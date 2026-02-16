import React from 'react';
import { INSULATION_PRICES } from '../../../utils/materialConstants';

const MaterialPriceConfig = ({ materialPrices, onPriceChange }) => {
    return (
        <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
            <div>
                <label className="block text-sm font-medium mb-1">Copper Price (₹/kg)</label>
                <input
                    type="number"
                    value={materialPrices.copper}
                    onChange={(e) => onPriceChange('copper', parseFloat(e.target.value))}
                    className="w-full p-2 border rounded"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Aluminum Price (₹/kg)</label>
                <input
                    type="number"
                    value={materialPrices.aluminum}
                    onChange={(e) => onPriceChange('aluminum', parseFloat(e.target.value))}
                    className="w-full p-2 border rounded"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Alloy Price (₹/kg)</label>
                <input
                    type="number"
                    value={materialPrices.alloy}
                    onChange={(e) => onPriceChange('alloy', parseFloat(e.target.value))}
                    className="w-full p-2 border rounded"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">PVC Price (₹/kg)</label>
                <input
                    type="number"
                    value={materialPrices.pvc}
                    onChange={(e) => onPriceChange('pvc', parseFloat(e.target.value))}
                    className="w-full p-2 border rounded"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">XLPE Price (₹/kg)</label>
                <input
                    type="number"
                    value={materialPrices.xlpe}
                    onChange={(e) => onPriceChange('xlpe', parseFloat(e.target.value))}
                    className="w-full p-2 border rounded"
                />
            </div>
        </div>
    );
};

export default MaterialPriceConfig;
