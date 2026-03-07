import api from '../api/axiosInstance.js';

/**
 * Service for fetching and managing material types and raw materials
 */

let cachedMaterialTypes = null;
let cachedRawMaterials = null;

/**
 * Fetch all material types from the API
 * @returns {Promise<Array>} Array of material types
 */
export const fetchMaterialTypes = async () => {
    try {
        const response = await api.get('/material-type/get-all-material-types');
        cachedMaterialTypes = response.data || [];
        return cachedMaterialTypes;
    } catch (error) {
        console.error('Failed to fetch material types:', error);
        throw error;
    }
};

/**
 * Fetch all raw materials from the API
 * @returns {Promise<Array>} Array of raw materials
 */
export const fetchRawMaterials = async () => {
    try {
        const response = await api.get('/raw-material/get-all-materials');
        cachedRawMaterials = response.data || [];
        return cachedRawMaterials;
    } catch (error) {
        console.error('Failed to fetch raw materials:', error);
        throw error;
    }
};

/**
 * Get metal types (category = 'metal')
 * @param {Array} allTypes - Optional: provide types array to avoid API call
 * @returns {Promise<Array>} Array of metal types
 */
export const getMetalTypes = async (allTypes = null) => {
    const types = allTypes || cachedMaterialTypes || await fetchMaterialTypes();
    return types.filter(t => t.category === 'metal');
};

/**
 * Get insulation/plastic types
 * @param {Array} allTypes - Optional: provide types array to avoid API call
 * @returns {Promise<Array>} Array of insulation/plastic types
 */
export const getInsulationTypes = async (allTypes = null) => {
    const types = allTypes || cachedMaterialTypes || await fetchMaterialTypes();
    return types.filter(t => t.category === 'insulation' || t.category === 'plastic');
};

/**
 * Get metal raw materials
 * @param {Array} allMaterials - Optional: provide materials array to avoid API call
 * @returns {Promise<Array>} Array of metal raw materials
 */
export const getMetalRawMaterials = async (allMaterials = null) => {
    const materials = allMaterials || cachedRawMaterials || await fetchRawMaterials();
    return materials.filter(m => m.category === 'metal');
};

/**
 * Get insulation/plastic raw materials
 * @param {Array} allMaterials - Optional: provide materials array to avoid API call
 * @returns {Promise<Array>} Array of insulation/plastic raw materials
 */
export const getInsulationRawMaterials = async (allMaterials = null) => {
    const materials = allMaterials || cachedRawMaterials || await fetchRawMaterials();
    return materials.filter(m => m.category === 'insulation' || m.category === 'plastic');
};

/**
 * Clear cached data
 */
export const clearCache = () => {
    cachedMaterialTypes = null;
    cachedRawMaterials = null;
};

/**
 * Get cached material types (without API call)
 * @returns {Array|null} Cached material types or null
 */
export const getCachedMaterialTypes = () => cachedMaterialTypes;

/**
 * Get cached raw materials (without API call)
 * @returns {Array|null} Cached raw materials or null
 */
export const getCachedRawMaterials = () => cachedRawMaterials;
