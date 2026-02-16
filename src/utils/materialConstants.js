// Raw Material Types with dimensions and prices
export const RAW_MATERIAL_TYPES = {
  COPPER: 'copper',
  ALUMINUM: 'aluminum',
  ALLOY: 'alloy'
};

// Material densities (g/cm³)
// Note: 1 g/cm³ = 1000 kg/m³
// Copper: 8.96 g/cm³ = 8960 kg/m³
// Aluminum: 2.7 g/cm³ = 2700 kg/m³
// Alloy: 2.85 g/cm³ = 2850 kg/m³
export const MATERIAL_DENSITIES = {
  copper: 8.96,
  aluminum: 2.7,
  alloy: 2.85
};

// Available copper rod dimensions (diameter in mm and price per kg)
export const COPPER_ROD_DIMENSIONS = [
  { diameter: 8, crossSection: 50.27, pricePerKg: 800 },
  { diameter: 9.5, crossSection: 70.88, pricePerKg: 805 },
  { diameter: 12, crossSection: 113.10, pricePerKg: 810 },
  { diameter: 16, crossSection: 201.06, pricePerKg: 815 },
  { diameter: 20, crossSection: 314.16, pricePerKg: 820 }
];

// Available aluminum rod dimensions
export const ALUMINUM_ROD_DIMENSIONS = [
  { diameter: 9.5, crossSection: 70.88, pricePerKg: 250 },
  { diameter: 12, crossSection: 113.10, pricePerKg: 255 },
  { diameter: 16, crossSection: 201.06, pricePerKg: 260 },
  { diameter: 20, crossSection: 314.16, pricePerKg: 265 }
];

// Available alloy rod dimensions
export const ALLOY_ROD_DIMENSIONS = [
  { diameter: 9.5, crossSection: 70.88, pricePerKg: 300 },
  { diameter: 12, crossSection: 113.10, pricePerKg: 305 },
  { diameter: 16, crossSection: 201.06, pricePerKg: 310 },
  { diameter: 20, crossSection: 314.16, pricePerKg: 315 }
];

// Get rod dimensions based on material type
export const getRodDimensions = (materialType) => {
  switch (materialType) {
    case RAW_MATERIAL_TYPES.COPPER:
      return COPPER_ROD_DIMENSIONS;
    case RAW_MATERIAL_TYPES.ALUMINUM:
      return ALUMINUM_ROD_DIMENSIONS;
    case RAW_MATERIAL_TYPES.ALLOY:
      return ALLOY_ROD_DIMENSIONS;
    default:
      return COPPER_ROD_DIMENSIONS;
  }
};

// Insulation material densities (g/cm³) - Demo values
export const INSULATION_DENSITIES = {
  pvc: 1.4,
  xlpe: 0.935
};

// Insulation material prices (₹/kg)
export const INSULATION_PRICES = {
  pvc: 120,
  xlpe: 180
};

// Process rates
export const PROCESS_RATES = {
  drawing: 0.05, // per meter
  stranding: 8.0, // per 100m
  annealing: 0.03, // per meter (optional process)
  insulation: 0.08, // per meter
  sheathing: 0.12 // per meter
};
