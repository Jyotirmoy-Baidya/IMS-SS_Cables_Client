import {
    calculateWireDimensions,
    calculateCoreDiameter,
    calculateInsulation
} from '../utils/cableCalculations.js';

/**
 * Service for cable-related calculations
 */

/**
 * Calculate sheath for a specific group
 * @param {Object} sheathGroup - The sheath group object
 * @param {Array} cores - Array of all cores
 * @param {Array} sheathGroups - Array of all sheath groups
 * @param {Number} cableLength - Cable length in meters
 * @returns {Object|null} Sheath calculation results or null
 */
export const calculateSheathForGroup = (sheathGroup, cores = [], sheathGroups = [], cableLength = 100) => {
    /**
     * Get insulated diameter and area for a core
     */
    const getCoreOuterDimensions = (coreId) => {
        const core = cores.find(c => (c.id || c._id) === coreId);
        if (!core) return { diameter: 0, area: 0 };

        const wireDimensions = calculateWireDimensions(core.totalCoreArea, core.wireCount);
        const coreDiameter = calculateCoreDiameter(wireDimensions.diameterPerWire, core.wireCount);
        const insulationCalc = calculateInsulation(
            coreDiameter,
            core.insulation?.thickness || 0.5,
            cableLength,
            'custom',
            core.insulation?.freshPercent || 70,
            core.insulation?.reprocessPercent || 30,
            0,
            null,
            core.insulation?.density || 1.4
        );
        const outerArea = (Math.PI * insulationCalc.insulatedDiameter * insulationCalc.insulatedDiameter) / 4;
        return { diameter: insulationCalc.insulatedDiameter, area: outerArea };
    };

    /**
     * Get sheath outer dimensions (recursive)
     */
    const getSheathOuterDimensions = (sheathId) => {
        const sheath = sheathGroups.find(sg => (sg.id || sg._id) === sheathId);
        if (!sheath) return { diameter: 0, area: 0 };
        const sheathCalc = calculateSheathForGroup(sheath, cores, sheathGroups, cableLength);
        if (!sheathCalc) return { diameter: 0, area: 0 };
        const outerArea = (Math.PI * sheathCalc.sheathOuterDiameter * sheathCalc.sheathOuterDiameter) / 4;
        return { diameter: sheathCalc.sheathOuterDiameter, area: outerArea };
    };

    const innerDiameters = [];
    const innerAreas = [];
    let avgLength = 0;
    let lengthCount = 0;

    // Get dimensions from cores
    (sheathGroup.coreIds || []).forEach(coreId => {
        const core = cores.find(c => (c.id || c._id) === coreId);
        if (core) {
            const dimensions = getCoreOuterDimensions(coreId);
            innerDiameters.push(dimensions.diameter);
            innerAreas.push(dimensions.area);
            avgLength += cableLength;
            lengthCount++;
        }
    });

    // Get dimensions from nested sheaths
    (sheathGroup.sheathIds || []).forEach(sheathId => {
        const dimensions = getSheathOuterDimensions(sheathId);
        if (dimensions.diameter > 0) {
            innerDiameters.push(dimensions.diameter);
            innerAreas.push(dimensions.area);
            const nestedSheath = sheathGroups.find(sg => (sg.id || sg._id) === sheathId);
            if (nestedSheath) {
                const nestedCalc = calculateSheathForGroup(nestedSheath, cores, sheathGroups, cableLength);
                if (nestedCalc) {
                    avgLength += nestedCalc.avgLength;
                    lengthCount++;
                }
            }
        }
    });

    if (innerDiameters.length === 0) return null;

    avgLength = avgLength / lengthCount;
    const totalInnerArea = innerAreas.reduce((sum, area) => sum + area, 0);
    const bundleDiameter = Math.sqrt((totalInnerArea * 4) / Math.PI);
    const sheathOuterDiameter = bundleDiameter + (2 * sheathGroup.thickness);
    const outerRadius = sheathOuterDiameter / 2;
    const innerRadius = bundleDiameter / 2;
    const volumeMm3 = Math.PI * (outerRadius ** 2 - innerRadius ** 2) * avgLength * 1000;
    const volumeCm3 = volumeMm3 / 1000;
    const freshDens = sheathGroup.density || 1.4;
    const reprocessDens = sheathGroup.reprocessDensity || freshDens;
    const freshWeight = (volumeCm3 * (sheathGroup.freshPercent / 100) * freshDens) / 1000;
    const reprocessWeight = (volumeCm3 * (sheathGroup.reprocessPercent / 100) * reprocessDens) / 1000;
    const totalWeight = freshWeight + reprocessWeight;
    const freshPrice = sheathGroup.freshPricePerKg || 0;
    const reprocessPrice = (sheathGroup.reprocessPricePerKg > 0) ? sheathGroup.reprocessPricePerKg : freshPrice * 0.7;
    const freshCost = freshWeight * freshPrice;
    const reprocessCost = reprocessWeight * reprocessPrice;

    return {
        bundleDiameter: parseFloat(bundleDiameter.toFixed(3)),
        sheathOuterDiameter: parseFloat(sheathOuterDiameter.toFixed(3)),
        totalInnerArea: parseFloat(totalInnerArea.toFixed(3)),
        totalWeight: parseFloat(totalWeight.toFixed(4)),
        freshWeight: parseFloat(freshWeight.toFixed(4)),
        reprocessWeight: parseFloat(reprocessWeight.toFixed(4)),
        freshCost: parseFloat(freshCost.toFixed(2)),
        reprocessCost: parseFloat(reprocessCost.toFixed(2)),
        totalCost: parseFloat((freshCost + reprocessCost).toFixed(2)),
        avgLength
    };
};

/**
 * Get core outer dimensions
 * @param {String|Number} coreId - Core ID
 * @param {Array} cores - Array of all cores
 * @param {Number} cableLength - Cable length in meters
 * @returns {Object} Object with diameter and area
 */
export const getCoreOuterDimensions = (coreId, cores = [], cableLength = 100) => {
    const core = cores.find(c => (c.id || c._id) === coreId);
    if (!core) return { diameter: 0, area: 0 };

    const wireDimensions = calculateWireDimensions(core.totalCoreArea, core.wireCount);
    const coreDiameter = calculateCoreDiameter(wireDimensions.diameterPerWire, core.wireCount);
    const insulationCalc = calculateInsulation(
        coreDiameter,
        core.insulation?.thickness || 0.5,
        cableLength,
        'custom',
        core.insulation?.freshPercent || 0,
        core.insulation?.reprocessPercent || 0,
        0,
        null,
        core.insulation?.density || 1.4
    );
    const outerArea = (Math.PI * insulationCalc.insulatedDiameter * insulationCalc.insulatedDiameter) / 4;
    return { diameter: insulationCalc.insulatedDiameter, area: outerArea };
};

/**
 * Get sheath outer dimensions
 * @param {String|Number} sheathId - Sheath ID
 * @param {Array} cores - Array of all cores
 * @param {Array} sheathGroups - Array of all sheath groups
 * @param {Number} cableLength - Cable length in meters
 * @returns {Object} Object with diameter and area
 */
export const getSheathOuterDimensions = (sheathId, cores = [], sheathGroups = [], cableLength = 100) => {
    const sheath = sheathGroups.find(sg => (sg.id || sg._id) === sheathId);
    if (!sheath) return { diameter: 0, area: 0 };
    const sheathCalc = calculateSheathForGroup(sheath, cores, sheathGroups, cableLength);
    if (!sheathCalc) return { diameter: 0, area: 0 };
    const outerArea = (Math.PI * sheathCalc.sheathOuterDiameter * sheathCalc.sheathOuterDiameter) / 4;
    return { diameter: sheathCalc.sheathOuterDiameter, area: outerArea };
};
