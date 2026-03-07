import { create } from 'zustand';
import api from '../api/axiosInstance';

/**
 * Zustand store for material requirements aggregation
 * Extracts and aggregates materialRequired arrays from cores and sheaths
 */
const useMaterialRequirementsStore = create((set, get) => ({
    // Aggregated requirements by material (for MaterialRequirements component)
    requirements: [],

    // Raw breakdown by usage
    breakdown: [],

    /**
     * Extract and aggregate material requirements from quotation cores and sheaths
     * Uses pre-calculated materialRequired arrays from backend
     * @param {Object} quotation - { cores, sheathGroups }
     */
    calculateAll: async (quotation) => {
        const { cores = [], sheathGroups = [] } = quotation;

        const breakdown = [];

        // ═══════════════════════════════════════════════════════
        // EXTRACT MATERIAL REQUIREMENTS FROM CORES
        // ═══════════════════════════════════════════════════════
        cores.forEach((core, coreIndex) => {
            if (core.materialRequired && Array.isArray(core.materialRequired)) {
                core.materialRequired.forEach(material => {
                    breakdown.push({
                        materialId: material.materialId,
                        materialName: material.materialName,
                        category: material.category,
                        purpose: material.purpose,
                        weight: material.weight,
                        type: material.type,
                        context: {
                            type: 'core',
                            coreIndex,
                            coreId: core.id || core._id,
                            label: `Core ${coreIndex + 1}`
                        }
                    });
                });
            }
        });

        // ═══════════════════════════════════════════════════════
        // EXTRACT MATERIAL REQUIREMENTS FROM SHEATH GROUPS
        // ═══════════════════════════════════════════════════════
        sheathGroups.forEach((sheathGroup, sheathIndex) => {
            if (sheathGroup.materialRequired && Array.isArray(sheathGroup.materialRequired)) {
                sheathGroup.materialRequired.forEach(material => {
                    breakdown.push({
                        materialId: material.materialId,
                        materialName: material.materialName,
                        category: material.category,
                        purpose: material.purpose,
                        weight: material.weight,
                        type: material.type,
                        context: {
                            type: 'sheath',
                            sheathIndex,
                            sheathId: sheathGroup.id || sheathGroup._id,
                            label: `Sheath Group ${sheathIndex + 1}`
                        }
                    });
                });
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
                    usedIn: []
                };
            }
            aggregated[key].totalWeight += item.weight;
            aggregated[key].usedIn.push({
                context: item.context,
                purpose: item.purpose,
                weight: item.weight
            });
        });

        const requirements = Object.values(aggregated).map(mat => ({
            ...mat,
            totalWeight: parseFloat(mat.totalWeight.toFixed(4))
        }));

        // ═══════════════════════════════════════════════════════
        // FETCH PRICING INFORMATION FROM DATABASE
        // ═══════════════════════════════════════════════════════
        try {
            // Get unique material IDs
            const materialIds = [...new Set(requirements.map(req => req.materialId))].filter(Boolean);

            if (materialIds.length > 0) {
                // Fetch material pricing information
                const response = await api.post('/raw-material/get-by-ids', { materialIds });

                const materials = response.data || [];

                // Create a map of materialId -> pricing info
                const pricingMap = {};
                materials.forEach(material => {
                    pricingMap[material._id] = {
                        avgPricePerKg: material.inventory?.avgPricePerKg || 0,
                        lastPricePerKg: material.inventory?.lastPricePerKg || 0,
                        reprocessPricePerKg: material.reprocessInventory?.pricePerKg || 0
                    };
                });

                console.log("map", pricingMap);

                // Add pricing to each requirement
                requirements.forEach(req => {
                    const pricing = pricingMap[req.materialId];
                    if (pricing) {
                        // Use reprocess price for reprocess materials, otherwise use avg price
                        const pricePerKg = req.type === 'reprocess'
                            ? (pricing.reprocessPricePerKg || pricing.avgPricePerKg)
                            : pricing.avgPricePerKg;

                        req.pricePerKg = pricePerKg;
                        req.totalCost = parseFloat((req.totalWeight * pricePerKg).toFixed(2));
                    } else {
                        req.pricePerKg = 0;
                        req.totalCost = 0;
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching material pricing:', error);
            // Continue without pricing if fetch fails
            requirements.forEach(req => {
                req.pricePerKg = 0;
                req.totalCost = 0;
            });
        }
        console.log(requirements);
        set({ requirements, breakdown });
        return requirements;
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
        set({ requirements: [], breakdown: [] });
    }
}));

export default useMaterialRequirementsStore;
