import React from 'react';

const ProcessRatesConfig = ({ processRates, onRateChange }) => {
    return (
        <div className="bg-purple-50 p-4 rounded-lg mb-4 border-2 border-purple-200">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Process Cost Rates</h2>
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded">
                    <label className="block font-semibold mb-2">Drawing (₹/meter)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={processRates.drawing}
                        onChange={(e) => onRateChange('drawing', parseFloat(e.target.value))}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="bg-white p-3 rounded">
                    <label className="block font-semibold mb-2">Stranding (₹/100m)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={processRates.stranding}
                        onChange={(e) => onRateChange('stranding', parseFloat(e.target.value))}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="bg-white p-3 rounded">
                    <label className="block font-semibold mb-2">Annealing (₹/meter)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={processRates.annealing}
                        onChange={(e) => onRateChange('annealing', parseFloat(e.target.value))}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="bg-white p-3 rounded">
                    <label className="block font-semibold mb-2">Insulation (₹/meter)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={processRates.insulation}
                        onChange={(e) => onRateChange('insulation', parseFloat(e.target.value))}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="bg-white p-3 rounded">
                    <label className="block font-semibold mb-2">Sheathing (₹/meter)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={processRates.sheathing}
                        onChange={(e) => onRateChange('sheathing', parseFloat(e.target.value))}
                        className="w-full p-2 border rounded"
                    />
                </div>
            </div>
        </div>
    );
};

export default ProcessRatesConfig;
