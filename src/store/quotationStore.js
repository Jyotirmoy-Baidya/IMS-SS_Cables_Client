import { create } from 'zustand';
import api from '../api/axiosInstance';

/**
 * Zustand store for quotation data management
 * Fetches and caches quotation data by ID
 */
const useQuotationStore = create((set, get) => ({
    // Current quotation data
    quotation: null,

    // Loading state
    loading: true,

    // Error state
    error: null,

    /**
     * Fetch quotation by ID from backend
     * @param {String} quotationId - The quotation ID to fetch
     * @param {Boolean} forceRefresh - Force refresh even if already loaded
     */
    fetchQuotationById: async (quotationId, forceRefresh = false) => {
        if (!quotationId) {
            console.error('quotationId is required');
            set({ quotation: null, error: 'Quotation ID is required' });
            return null;
        }

        // If already loaded and not forcing refresh, return cached data
        const { quotation } = get();
        if (!forceRefresh && quotation && quotation._id === quotationId) {
            return quotation;
        }

        set({ loading: true, error: null });
        try {
            const response = await api.get(`/quotation/get-one-quotation/${quotationId}`);
            const fetchedQuotation = response.data || null;
            console.log(fetchedQuotation);
            set({ quotation: fetchedQuotation, loading: false, error: null });
            return fetchedQuotation;
        } catch (error) {
            console.error('Error fetching quotation:', error);
            const errorMessage = error.message || 'Failed to fetch quotation';
            set({ quotation: null, loading: false, error: errorMessage });
            return null;
        }
    },

    /**
     * Update quotation data in store (without API call)
     * Useful for optimistic updates
     * @param {Object} updatedQuotation - Updated quotation data
     */
    setQuotation: (updatedQuotation) => {
        set({ quotation: updatedQuotation, error: null });
    },

    /**
     * Update specific fields in quotation
     * @param {Object} fields - Fields to update
     */
    updateQuotationFields: (fields) => {
        const { quotation } = get();
        if (!quotation) {
            console.warn('No quotation loaded to update');
            return;
        }

        set({
            quotation: {
                ...quotation,
                ...fields
            }
        });
    },

    /**
     * Add a core to quotation
     * @param {Object} core - Core data
     */
    addCore: (core) => {
        const { quotation } = get();
        if (!quotation) return;

        set({
            quotation: {
                ...quotation,
                cores: [...(quotation.cores || []), core]
            }
        });
    },

    /**
     * Update a core in quotation
     * @param {String} coreId - Core ID
     * @param {Object} updatedCore - Updated core data
     */
    updateCore: (coreId, updatedCore) => {
        const { quotation } = get();
        if (!quotation) return;

        set({
            quotation: {
                ...quotation,
                cores: (quotation.cores || []).map(core =>
                    core._id === coreId ? { ...core, ...updatedCore } : core
                )
            }
        });
    },

    /**
     * Remove a core from quotation
     * @param {String} coreId - Core ID to remove
     */
    removeCore: (coreId) => {
        const { quotation } = get();
        if (!quotation) return;

        set({
            quotation: {
                ...quotation,
                cores: (quotation.cores || []).filter(core => core._id !== coreId)
            }
        });
    },

    /**
     * Add a sheath to quotation
     * @param {Object} sheath - Sheath data
     */
    addSheath: (sheath) => {
        const { quotation } = get();
        if (!quotation) return;

        set({
            quotation: {
                ...quotation,
                sheathGroups: [...(quotation.sheathGroups || []), sheath]
            }
        });
    },

    /**
     * Update a sheath in quotation
     * @param {String} sheathId - Sheath ID
     * @param {Object} updatedSheath - Updated sheath data
     */
    updateSheath: (sheathId, updatedSheath) => {
        const { quotation } = get();
        if (!quotation) return;

        set({
            quotation: {
                ...quotation,
                sheathGroups: (quotation.sheathGroups || []).map(sheath =>
                    sheath._id === sheathId ? { ...sheath, ...updatedSheath } : sheath
                )
            }
        });
    },

    /**
     * Remove a sheath from quotation
     * @param {String} sheathId - Sheath ID to remove
     */
    removeSheath: (sheathId) => {
        const { quotation } = get();
        if (!quotation) return;

        set({
            quotation: {
                ...quotation,
                sheathGroups: (quotation.sheathGroups || []).filter(sheath => sheath._id !== sheathId)
            }
        });
    },

    /**
     * Clear quotation data
     */
    clearQuotation: () => {
        set({ quotation: null, loading: false, error: null });
    },

    /**
     * Refresh current quotation from backend
     */
    refreshQuotation: async () => {
        const { quotation } = get();
        if (!quotation || !quotation._id) {
            console.warn('No quotation to refresh');
            return null;
        }

        return await get().fetchQuotation(quotation._id, true);
    }
}));

export default useQuotationStore;
