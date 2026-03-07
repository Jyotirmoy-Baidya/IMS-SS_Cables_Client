import { create } from 'zustand';
import {
    calculateWireDimensions,
    calculateDrawingLength,
    calculateMaterialWeight,
    calculateCoreDiameter,
    calculateInsulation
} from '../utils/cableCalculations.js';
import { fetchMaterialTypes, getMetalTypes, getInsulationTypes } from '../services/materialService.js';
import { calculateSheathForGroup as calculateSheathService } from '../services/calculationService.js';

/**
 * Comprehensive Zustand store for all material calculations
 * Handles weights, costs, breakdowns, and totals
 */
const useMaterialRequirementsStore = create((set, get) => ({
    // Cost totals
    totalCost: 0,

    // Detailed breakdown for QuotationSummary
    // Format: { type, coreIndex?, sheathIndex?, coreId?, sheathId?, name, weight?, freshWeight?, reprocessWeight?, reprocessName?, pricePerKg?, cost }
    details: [],

    // Aggregated requirements by material (for MaterialRequirements component)
    requirements: [],

    // Raw breakdown by usage
    breakdown: [],

    // Material types cache
    metalTypes: [],
    insulationTypes: [],

    /**
     * Calculate everything from quotation data
     * @param {Object} quotation - { cores, sheathGroups, cableLength }
     * @param {Object} options - { metalTypes, insulationTypes } (optional - will fetch if not provided)
     */
    calculateAll: async (quotation, options = {}) => {
        const { cores = [], sheathGroups = [], cableLength = 100 } = quotation;

        // Fetch material types if not provided
        let metalTypes = options.metalTypes || get().metalTypes;
        let insulationTypes = options.insulationTypes || get().insulationTypes;

        if (!metalTypes.length || !insulationTypes.length) {
            try {
                const allTypes = await fetchMaterialTypes();
                metalTypes = await getMetalTypes(allTypes);
                insulationTypes = await getInsulationTypes(allTypes);
                // Cache them in the store
                set({ metalTypes, insulationTypes });
            } catch (error) {
                console.error('Failed to fetch material types:', error);
                // Continue with empty arrays
                metalTypes = metalTypes || [];
                insulationTypes = insulationTypes || [];
            }
        }

        // Create sheath calculation function with current context
        const calculateSheath = (sheathGroup) =>
            calculateSheathService(sheathGroup, cores, sheathGroups, cableLength);

        let totalCost = 0;
        const details = [];
        const breakdown = [];

        // ═══════════════════════════════════════════════════════
        // PROCESS EACH CORE
        // ═══════════════════════════════════════════════════════
        cores.forEach((core, coreIndex) => {
            const effectiveCoreLength = core.coreLength ?? cableLength;
            const wireDimensions = calculateWireDimensions(core.totalCoreArea, core.wireCount);
            const drawingLength = calculateDrawingLength(core.wireCount, effectiveCoreLength);
            const coreDiameter = calculateCoreDiameter(wireDimensions.diameterPerWire, core.wireCount);

            // ─────────────────────────────────────────────────────
            // 1. CONDUCTOR (METAL)
            // ─────────────────────────────────────────────────────
            const materialWeight = calculateMaterialWeight(
                wireDimensions.areaPerWire,
                drawingLength,
                core.materialDensity || 8.96,
                core.wastagePercent
            );

            if (core.selectedRod) {
                const rodPrice = core.selectedRod?.inventory?.avgPricePerKg
                    || core.selectedRod?.inventory?.lastPricePerKg || 0;
                const conductorCost = materialWeight * rodPrice;
                totalCost += conductorCost;

                const metalName = core.selectedRod.name
                    || metalTypes.find(t => t._id === core.materialTypeId)?.name
                    || 'Metal';

                // For QuotationSummary details
                details.push({
                    type: 'conductor',
                    coreIndex,
                    coreId: core.id || core._id,
                    name: metalName,
                    weight: parseFloat(materialWeight.toFixed(4)),
                    pricePerKg: rodPrice,
                    cost: parseFloat(conductorCost.toFixed(2))
                });

                // For MaterialRequirements breakdown
                breakdown.push({
                    materialId: core.selectedRod._id,
                    materialName: core.selectedRod.name,
                    category: 'metal',
                    purpose: 'conductor',
                    weight: parseFloat(materialWeight.toFixed(4)),
                    cost: parseFloat(conductorCost.toFixed(2)),
                    pricePerKg: rodPrice,
                    type: 'fresh',
                    context: {
                        type: 'core',
                        coreIndex,
                        coreId: core.id || core._id,
                        label: `Core ${coreIndex + 1}`
                    }
                });
            }

            // ─────────────────────────────────────────────────────
            // 2. INSULATION
            // ─────────────────────────────────────────────────────
            const insulationCalc = calculateInsulation(
                coreDiameter,
                core.insulation.thickness,
                effectiveCoreLength,
                'custom',
                core.insulation.freshPercent,
                core.insulation.reprocessPercent,
                core.insulation.freshPricePerKg || 0,
                core.insulation.reprocessPricePerKg || null,
                core.insulation.density || 1.4,
                core.insulation.reprocessDensity || null
            );

            totalCost += insulationCalc.totalCost;

            const insulName = core.insulation.material?.name
                || core.insulation.materialTypeName
                || insulationTypes.find(t => t._id === core.insulation.materialTypeId)?.name
                || '';

            const reprocessName = core.insulation.reprocessMaterial?.name
                || core.insulation.reprocessMaterialTypeName
                || insulName;

            if (insulName) {
                // For QuotationSummary details
                details.push({
                    type: 'insulation',
                    coreIndex,
                    coreId: core.id || core._id,
                    name: insulName,
                    freshWeight: insulationCalc.freshWeight,
                    reprocessWeight: insulationCalc.reprocessWeight,
                    reprocessName: reprocessName,
                    cost: insulationCalc.totalCost
                });

                // For MaterialRequirements breakdown - Fresh
                if (insulationCalc.freshWeight > 0 && core.insulation?.materialId) {
                    breakdown.push({
                        materialId: core.insulation.materialId,
                        materialName: insulName,
                        category: 'insulation',
                        purpose: 'insulation-fresh',
                        weight: parseFloat(insulationCalc.freshWeight.toFixed(4)),
                        cost: parseFloat(insulationCalc.freshCost.toFixed(2)),
                        pricePerKg: core.insulation.freshPricePerKg || 0,
                        type: 'fresh',
                        context: {
                            type: 'core',
                            coreIndex,
                            coreId: core.id || core._id,
                            label: `Core ${coreIndex + 1}`
                        }
                    });
                }

                // For MaterialRequirements breakdown - Reprocess
                if (insulationCalc.reprocessWeight > 0) {
                    const reprocessMaterialId = core.insulation.reprocessMaterialId || core.insulation.materialId;
                    if (reprocessMaterialId) {
                        breakdown.push({
                            materialId: reprocessMaterialId,
                            materialName: reprocessName,
                            category: 'insulation',
                            purpose: 'insulation-reprocess',
                            weight: parseFloat(insulationCalc.reprocessWeight.toFixed(4)),
                            cost: parseFloat(insulationCalc.reprocessCost.toFixed(2)),
                            pricePerKg: core.insulation.reprocessPricePerKg || 0,
                            type: 'reprocess',
                            context: {
                                type: 'core',
                                coreIndex,
                                coreId: core.id || core._id,
                                label: `Core ${coreIndex + 1}`
                            }
                        });
                    }
                }
            }
        });

        // ═══════════════════════════════════════════════════════
        // PROCESS EACH SHEATH GROUP
        // ═══════════════════════════════════════════════════════
        sheathGroups.forEach((sg, sheathIndex) => {
            const sheathCalc = calculateSheath(sg);
            if (!sheathCalc) return;

            totalCost += sheathCalc.totalCost;

            const sheathName = sg.materialObject?.name
                || sg.material
                || insulationTypes.find(t => t._id === sg.materialTypeId)?.name
                || '';

            const reprocessName = sg.reprocessMaterialObject?.name
                || sg.reprocessMaterialTypeName
                || sheathName;

            if (sheathName) {
                // For QuotationSummary details
                details.push({
                    type: 'sheath',
                    sheathIndex,
                    sheathId: sg.id || sg._id,
                    name: sheathName,
                    freshWeight: sheathCalc.freshWeight,
                    reprocessWeight: sheathCalc.reprocessWeight,
                    reprocessName: reprocessName,
                    cost: sheathCalc.totalCost
                });

                // For MaterialRequirements breakdown - Fresh
                if (sheathCalc.freshWeight > 0 && sg.materialId) {
                    breakdown.push({
                        materialId: sg.materialId,
                        materialName: sheathName,
                        category: 'plastic',
                        purpose: 'sheath-fresh',
                        weight: parseFloat(sheathCalc.freshWeight.toFixed(4)),
                        cost: parseFloat(sheathCalc.freshCost.toFixed(2)),
                        pricePerKg: sg.freshPricePerKg || 0,
                        type: 'fresh',
                        context: {
                            type: 'sheath',
                            sheathIndex,
                            sheathId: sg.id || sg._id,
                            label: `Sheath Group ${sheathIndex + 1}`
                        }
                    });
                }

                // For MaterialRequirements breakdown - Reprocess
                if (sheathCalc.reprocessWeight > 0) {
                    const reprocessMaterialId = sg.reprocessMaterialId || sg.materialId;
                    if (reprocessMaterialId) {
                        breakdown.push({
                            materialId: reprocessMaterialId,
                            materialName: reprocessName,
                            category: 'plastic',
                            purpose: 'sheath-reprocess',
                            weight: parseFloat(sheathCalc.reprocessWeight.toFixed(4)),
                            cost: parseFloat(sheathCalc.reprocessCost.toFixed(2)),
                            pricePerKg: sg.reprocessPricePerKg || 0,
                            type: 'reprocess',
                            context: {
                                type: 'sheath',
                                sheathIndex,
                                sheathId: sg.id || sg._id,
                                label: `Sheath Group ${sheathIndex + 1}`
                            }
                        });
                    }
                }
            }
        });

        // ═══════════════════════════════════════════════════════
        // AGGREGATE BY MATERIAL (for MaterialRequirements component)
        // ═══════════════════════════════════════════════════════
        const aggregated = {};
        breakdown.forEach(item => {
            const key = `${item.materialId}_${item.type}`;
            if (!aggregated[key]) {
                aggregated[key] = {
                    materialId: item.materialId,
                    materialName: item.materialName,
                    category: item.category,
                    type: item.type,
                    totalWeight: 0,
                    totalCost: 0,
                    usedIn: []
                };
            }
            aggregated[key].totalWeight += item.weight;
            aggregated[key].totalCost += item.cost;
            aggregated[key].usedIn.push({
                context: item.context,
                purpose: item.purpose,
                weight: item.weight,
                cost: item.cost
            });
        });

        const requirements = Object.values(aggregated).map(mat => ({
            ...mat,
            totalWeight: parseFloat(mat.totalWeight.toFixed(4)),
            totalCost: parseFloat(mat.totalCost.toFixed(2))
        }));

        set({ totalCost, details, requirements, breakdown });
    },

    /**
     * Get totals object (for backward compatibility with QuotationSummary)
     */
    getTotals: () => {
        const { totalCost, details } = get();
        return { totalCost, details };
    },

    /**
     * Get requirements grouped by category
     */
    getRequirementsByCategory: () => {
        const { requirements } = get();
        return requirements.reduce((acc, req) => {
            const cat = req.category || 'other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(req);
            return acc;
        }, {});
    },

    /**
     * Get total weight for a specific material
     */
    getTotalWeightForMaterial: (materialId) => {
        const { requirements } = get();
        return requirements
            .filter(r => r.materialId === materialId)
            .reduce((sum, r) => sum + r.totalWeight, 0);
    },

    /**
     * Get breakdown for a specific core
     */
    getBreakdownForCore: (coreIndex) => {
        const { breakdown } = get();
        return breakdown.filter(b => b.context.type === 'core' && b.context.coreIndex === coreIndex);
    },

    /**
     * Get breakdown for a specific sheath
     */
    getBreakdownForSheath: (sheathIndex) => {
        const { breakdown } = get();
        return breakdown.filter(b => b.context.type === 'sheath' && b.context.sheathIndex === sheathIndex);
    },

    /**
     * Clear all data
     */
    clear: () => {
        set({ totalCost: 0, details: [], requirements: [], breakdown: [] });
    }
}));

export default useMaterialRequirementsStore;
