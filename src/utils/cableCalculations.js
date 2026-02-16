import { MATERIAL_DENSITIES, INSULATION_DENSITIES } from './materialConstants';

/**
 * Calculate wire diameter from cross-sectional area
 * @param {number} area - Cross-sectional area in sq mm
 * @returns {number} - Diameter in mm
 */
export const calculateWireDiameter = (area) => {
  return Math.sqrt((area * 4) / Math.PI);
};

/**
 * Calculate outer cross-sectional area from diameter
 * @param {number} diameter - Outer diameter in mm
 * @returns {number} - Cross-sectional area in sq mm
 */
export const calculateOuterArea = (diameter) => {
  return (Math.PI * diameter * diameter) / 4;
};

/**
 * Calculate cross-sectional area from diameter
 * @param {number} diameter - Diameter in mm
 * @returns {number} - Cross-sectional area in sq mm
 */
export const calculateCrossSection = (diameter) => {
  return (Math.PI * diameter * diameter) / 4;
};

/**
 * Calculate wire dimensions for a core
 * @param {number} totalCoreArea - Total cross-sectional area of the core in sq mm
 * @param {number} wireCount - Number of wires in the core
 * @returns {object} - { areaPerWire, diameterPerWire }
 */
export const calculateWireDimensions = (totalCoreArea, wireCount) => {
  const areaPerWire = totalCoreArea / wireCount;
  const diameterPerWire = calculateWireDiameter(areaPerWire);

  return {
    areaPerWire: parseFloat(areaPerWire.toFixed(4)),
    diameterPerWire: parseFloat(diameterPerWire.toFixed(4))
  };
};

/**
 * Calculate drawing length required for stranding
 * For multi-wire cores: 1600m of drawn wire produces 100m of stranded core
 * @param {number} wireCount - Number of wires
 * @param {number} coreLength - Length of core needed in meters
 * @returns {number} - Total drawing length required in meters
 */
export const calculateDrawingLength = (wireCount, coreLength) => {
  if (wireCount === 1) {
    return coreLength;
  }
  return (wireCount * coreLength);
};

/**
 * Calculate material weight required
 * @param {number} crossSection - Cross-sectional area in sq mm
 * @param {number} length - Length in meters
 * @param {string} materialType - Type of material (copper, aluminum, alloy)
 * @param {number} wastagePercent - Wastage percentage
 * @returns {number} - Weight in kg
 */
export const calculateMaterialWeight = (crossSection, length, materialTypeOrDensity, wastagePercent = 0) => {
  const density = typeof materialTypeOrDensity === 'number'
    ? materialTypeOrDensity
    : (MATERIAL_DENSITIES[materialTypeOrDensity] || MATERIAL_DENSITIES.copper);

  // Convert everything to consistent units
  // crossSection is in sq mm, length is in meters
  // Convert length to mm: length * 1000
  const lengthInMm = length * 1000;

  // Volume in mm³
  const volumeMm3 = crossSection * lengthInMm;

  // Convert mm³ to m³: divide by 1,000,000,000 (10^9)
  const volumeM3 = volumeMm3 / 1000000000;

  // Density in kg/m³ (convert from g/cm³)
  // 1 g/cm³ = 1000 kg/m³
  const densityKgPerM3 = density * 1000;
  // Weight in kg
  const weight = volumeM3 * densityKgPerM3;

  const wastageMultiplier = 1 + (wastagePercent / 100);

  return weight * wastageMultiplier;
};

/**
 * Calculate core diameter after stranding
 * @param {number} wireDiameter - Diameter of individual wire in mm
 * @param {number} wireCount - Number of wires
 * @returns {number} - Core diameter in mm
 */
export const calculateCoreDiameter = (wireDiameter, wireCount) => {
  if (wireCount === 1) {
    return wireDiameter;
  }

  const packingEfficiency = 0.90;
  // return wireDiameter * Math.sqrt(wireCount / packingEfficiency);
  // Approximate formula for stranded conductor diameter
  return Math.sqrt(wireCount) * wireDiameter / 2;
};

/**
 * Calculate insulation weight and cost
 * @param {number} coreDiameter - Core diameter in mm
 * @param {number} insulationThickness - Insulation thickness in mm
 * @param {number} length - Length in meters
 * @param {string} insulationType - Type of insulation (pvc/xlpe)
 * @param {number} freshPercent - Percentage of fresh material
 * @param {number} reprocessPercent - Percentage of reprocessed material
 * @param {number} materialPrice - Price per kg
 * @returns {object} - Insulation calculations
 */
export const calculateInsulation = (
  coreDiameter,
  insulationThickness,
  length,
  insulationTypeOrDensity,
  freshPercent,
  reprocessPercent,
  freshPricePerKg,
  reprocessPricePerKg = null,
  customDensity = null,
  reprocessDensity = null   // density for reprocess material (if different type from fresh)
) => {
  const insulatedDiameter = coreDiameter + (2 * insulationThickness);

  // Volume calculation
  const outerRadius = insulatedDiameter / 2;
  const innerRadius = coreDiameter / 2;
  const totalVolumeCm3 = Math.PI * (outerRadius ** 2 - innerRadius ** 2) * length * 1000 / 1000;

  const freshDens = customDensity
    || (typeof insulationTypeOrDensity === 'number' ? insulationTypeOrDensity : null)
    || INSULATION_DENSITIES[insulationTypeOrDensity]
    || INSULATION_DENSITIES.pvc;
  const reprocessDens = reprocessDensity || freshDens;

  // Use separate densities for each portion (backward-compat: same result when densities are equal)
  const freshWeight = (totalVolumeCm3 * (freshPercent / 100) * freshDens) / 1000;
  const reprocessWeight = (totalVolumeCm3 * (reprocessPercent / 100) * reprocessDens) / 1000;
  const totalWeight = freshWeight + reprocessWeight;

  // Use actual reprocess price if set, else fall back to 70% of fresh price
  const effectiveReprocessPrice = (reprocessPricePerKg != null && reprocessPricePerKg > 0)
    ? reprocessPricePerKg
    : freshPricePerKg * 0.7;

  const freshCost = freshWeight * freshPricePerKg;
  const reprocessCost = reprocessWeight * effectiveReprocessPrice;

  return {
    insulatedDiameter: parseFloat(insulatedDiameter.toFixed(3)),
    totalWeight: parseFloat(totalWeight.toFixed(4)),
    freshWeight: parseFloat(freshWeight.toFixed(4)),
    reprocessWeight: parseFloat(reprocessWeight.toFixed(4)),
    freshCost: parseFloat(freshCost.toFixed(2)),
    reprocessCost: parseFloat(reprocessCost.toFixed(2)),
    totalCost: parseFloat((freshCost + reprocessCost).toFixed(2))
  };
};

/**
 * Calculate sheath (outer covering) for multiple cores
 * @param {Array} insulatedCoreDiameters - Array of insulated core diameters
 * @param {number} sheathThickness - Sheath thickness in mm
 * @param {number} length - Length in meters
 * @param {string} sheathType - Type of sheath material (pvc/xlpe)
 * @param {number} freshPercent - Percentage of fresh material
 * @param {number} reprocessPercent - Percentage of reprocessed material
 * @param {number} materialPrice - Price per kg
 * @returns {object} - Sheath calculations
 */
export const calculateSheath = (
  insulatedCoreDiameters,
  sheathThickness,
  length,
  sheathType,
  freshPercent,
  reprocessPercent,
  materialPrice
) => {
  if (insulatedCoreDiameters.length === 0) return null;

  // Calculate bundle diameter (cores laid together)
  const maxCoreDiameter = Math.max(...insulatedCoreDiameters);
  const bundleDiameter = Math.sqrt(insulatedCoreDiameters.length) * maxCoreDiameter * 1.1;
  const sheathOuterDiameter = bundleDiameter + (2 * sheathThickness);

  // Volume calculation
  const outerRadius = sheathOuterDiameter / 2;
  const innerRadius = bundleDiameter / 2;
  const volumeMm3 = Math.PI * (outerRadius ** 2 - innerRadius ** 2) * length * 1000;
  const volumeCm3 = volumeMm3 / 1000;

  const density = INSULATION_DENSITIES[sheathType] || INSULATION_DENSITIES.pvc;
  const totalWeight = (volumeCm3 * density) / 1000; // in kg

  const freshWeight = totalWeight * (freshPercent / 100);
  const reprocessWeight = totalWeight * (reprocessPercent / 100);

  const freshCost = freshWeight * materialPrice;
  const reprocessCost = reprocessWeight * materialPrice * 0.7;

  return {
    bundleDiameter: parseFloat(bundleDiameter.toFixed(3)),
    sheathOuterDiameter: parseFloat(sheathOuterDiameter.toFixed(3)),
    totalWeight: parseFloat(totalWeight.toFixed(4)),
    freshWeight: parseFloat(freshWeight.toFixed(4)),
    reprocessWeight: parseFloat(reprocessWeight.toFixed(4)),
    freshCost: parseFloat(freshCost.toFixed(2)),
    reprocessCost: parseFloat(reprocessCost.toFixed(2)),
    totalCost: parseFloat((freshCost + reprocessCost).toFixed(2))
  };
};

/**
 * Calculate process costs
 * @param {object} params - Process parameters
 * @returns {object} - Process costs breakdown
 */
export const calculateProcessCosts = (params) => {
  const {
    wireCount,
    coreLength,
    drawingLength,
    hasAnnealing,
    drawingRate,
    strandingRate,
    annealingRate,
    insulationRate,
    sheathingRate
  } = params;

  const costs = {};

  // Drawing cost
  costs.drawing = drawingLength * drawingRate;

  // Stranding cost (only for multi-wire cores)
  if (wireCount > 1) {
    costs.stranding = (coreLength / 100) * strandingRate;
  }

  // Annealing cost (optional)
  if (hasAnnealing) {
    costs.annealing = drawingLength * annealingRate;
  }

  // Insulation cost
  costs.insulation = coreLength * insulationRate;

  return costs;
};
