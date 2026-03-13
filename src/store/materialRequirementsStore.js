import { create } from 'zustand';
import api from '../api/axiosInstance';

/**
 * Zustand store for material requirements aggregation
 * Extracts and aggregates materialRequired arrays from cores and sheaths
 */
const useMaterialRequirementsStore = create((set, get) => ({
    // Aggregated requirements by material (for MaterialRequirements component)
    materialsRequiredInQuotation: [],

    // Raw breakdown by usage
    breakdown: [],

    totalMaterialCost: 0,

    /**
     * Extract and aggregate material requirements from quotation cores and sheaths
     * Can accept either quotation ID (string) to fetch from backend, or quotation object directly
     * @param {String|Object} quotationOrId - Either quotation ID (string) or quotation object
     */
    calculateAll: async (quotationOrId) => {
        if (!quotationOrId) {
            console.error('quotationOrId is required');
            set({ requirements: [], breakdown: [], materialsRequiredInQuotation: [] });
            return [];
        }

        try {
            let quotation;

            // If string, fetch from backend; if object, use directly
            if (typeof quotationOrId === 'string') {
                const response = await api.get(`/quotation/get-one-quotation/${quotationOrId}`);
                quotation = response.data || {};
            } else {
                quotation = quotationOrId;
            }

            console.log(quotation);
            const { cores = [], sheathGroups = [] } = quotation;

            const breakdown = [];

            // Flatten all materialRequired arrays from cores using flatMap
            // Include core name and coreNumber in each material requirement
            const coresMaterialsRequired = cores.flatMap(core => {
                return (core.materialRequired || []).map(material => ({
                    ...material,
                    usedIn: `Core - ${core.coreNumber}`
                }))
            });

            // Flatten all materialRequired arrays from sheaths using flatMap
            // Include sheath name and sheathNumber in each material requirement
            const sheathsMaterialsRequired = sheathGroups.flatMap(sheathGroup => {
                return (sheathGroup.materialRequired || []).map(material => ({
                    ...material,
                    usedIn: `Sheath - ${sheathGroup.sheathNumber || sheathGroup.name || 'Unnamed'}`
                }))
            });

            // Combine both cores and sheaths materials
            const materialsRequiredInQuotation = [
                ...coresMaterialsRequired,
                ...sheathsMaterialsRequired
            ];

            console.log(materialsRequiredInQuotation);

            // ═══════════════════════════════════════════════════════
            // EXTRACT MATERIAL REQUIREMENTS FROM SHEATH GROUPS FOR BREAKDOWN
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

            // Calculate total material cost
            const totalMaterialCost = materialsRequiredInQuotation.reduce(
                (sum, material) => sum + (material.totalCost || 0),
                0
            );

            set({ materialsRequiredInQuotation, breakdown, totalMaterialCost });

            console.log("materialsssss", materialsRequiredInQuotation)
            return materialsRequiredInQuotation;
        } catch (error) {
            console.error('Error fetching quotation or calculating materials:', error);
            set({ requirements: [], breakdown: [], materialsRequiredInQuotation: [] });
            return [];
        }
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
