import React from 'react';
import { Trash2 } from 'lucide-react';

const SheathComponent = ({
    sheathGroup,
    index,
    cores,
    sheathGroups,
    onUpdate,
    onDelete,
    insulationTypes,
    insulationRawMaterials,
    calculateSheathForGroup,
    getAvailableCores,
    getAvailableSheaths
}) => {
    const handleUpdate = (field, value) => {
        onUpdate(sheathGroup.id, field, value);
    };

    const handleInsulationTypeSelect = (typeId) => {
        if (!typeId) {
            handleUpdate('materialTypeId', null);
            handleUpdate('material', '');
            handleUpdate('density', 1.4);
            handleUpdate('freshPricePerKg', 0);
            handleUpdate('reprocessPricePerKg', 0);
            return;
        }
        const type = (insulationTypes || []).find(t => t._id === typeId);
        if (!type) return;
        const matchingMat = (insulationRawMaterials || []).find(m => {
            const mtId = typeof m.materialTypeId === 'object' ? m.materialTypeId?._id : m.materialTypeId;
            return mtId === typeId;
        });
        handleUpdate('materialTypeId', typeId);
        handleUpdate('material', type.name);
        handleUpdate('density', type.density || 1.4);
        handleUpdate('freshPricePerKg', matchingMat?.inventory?.avgPricePerKg || 0);
        handleUpdate('reprocessPricePerKg', matchingMat?.reprocessInventory?.pricePerKg || 0);
    };

    const handleReprocessTypeSelect = (typeId) => {
        if (!typeId) {
            handleUpdate('reprocessMaterialTypeId', null);
            handleUpdate('reprocessMaterialTypeName', '');
            handleUpdate('reprocessDensity', null);
            handleUpdate('reprocessPricePerKg', 0);
            return;
        }
        const type = (insulationTypes || []).find(t => t._id === typeId);
        if (!type) return;
        const matchingMat = (insulationRawMaterials || []).find(m => {
            const mtId = typeof m.materialTypeId === 'object' ? m.materialTypeId?._id : m.materialTypeId;
            return mtId === typeId;
        });
        handleUpdate('reprocessMaterialTypeId', typeId);
        handleUpdate('reprocessMaterialTypeName', type.name);
        handleUpdate('reprocessDensity', type.density || null);
        handleUpdate('reprocessPricePerKg', matchingMat?.reprocessInventory?.pricePerKg || 0);
    };

    const toggleCore = (coreId) => {
        const currentCoreIds = sheathGroup.coreIds || [];
        const newCoreIds = currentCoreIds.includes(coreId)
            ? currentCoreIds.filter(id => id !== coreId)
            : [...currentCoreIds, coreId];

        handleUpdate('coreIds', newCoreIds);
    };

    const toggleSheath = (sheathId) => {
        const currentSheathIds = sheathGroup.sheathIds || [];
        const newSheathIds = currentSheathIds.includes(sheathId)
            ? currentSheathIds.filter(id => id !== sheathId)
            : [...currentSheathIds, sheathId];

        handleUpdate('sheathIds', newSheathIds);
    };

    // Get available cores and sheaths
    const availableCores = getAvailableCores(sheathGroup.id);
    const availableSheaths = getAvailableSheaths(sheathGroup.id);

    // Calculate sheath
    const sheathCalc = calculateSheathForGroup(sheathGroup);

    // Calculate outer area
    const outerArea = sheathCalc
        ? (Math.PI * sheathCalc.sheathOuterDiameter * sheathCalc.sheathOuterDiameter) / 4
        : 0;

    return (
        <div className="bg-green-50 p-4 rounded-lg mb-4 border-2 border-green-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">Sheath Group {index + 1}</h3>
                <button
                    onClick={() => onDelete(sheathGroup.id)}
                    className="text-red-600 hover:text-red-800"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Core Selection with Checkboxes */}
            <div className="bg-white p-3 rounded mb-4">
                <h4 className="font-semibold mb-2">Select Cores</h4>
                {availableCores.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                        {availableCores.map((core, idx) => (
                            <label key={core.id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={(sheathGroup.coreIds || []).includes(core.id)}
                                    onChange={() => toggleCore(core.id)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">
                                    Core {cores.findIndex(c => c.id === core.id) + 1}
                                </span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No cores available (all cores are already used in other sheaths)</p>
                )}
            </div>

            {/* Sheath Selection with Checkboxes (Nested Sheaths) */}
            <div className="bg-blue-50 p-3 rounded mb-4">
                <h4 className="font-semibold mb-2">Select Other Sheaths (Nested Sheathing)</h4>
                {availableSheaths.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                        {availableSheaths.map((sheath) => (
                            <label key={sheath.id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={(sheathGroup.sheathIds || []).includes(sheath.id)}
                                    onChange={() => toggleSheath(sheath.id)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">
                                    Sheath {sheathGroups.findIndex(sg => sg.id === sheath.id) + 1}
                                </span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No sheaths available for nesting</p>
                )}
            </div>

            {/* Selected Items Display */}
            {((sheathGroup.coreIds && sheathGroup.coreIds.length > 0) || (sheathGroup.sheathIds && sheathGroup.sheathIds.length > 0)) && (
                <div className="bg-yellow-50 p-2 rounded mb-4 text-sm">
                    <strong>Contains:</strong>{' '}
                    {(sheathGroup.coreIds || []).map((cid, idx) => (
                        <span key={`core-${cid}`}>
                            {idx > 0 && ', '}Core {cores.findIndex(c => c.id === cid) + 1}
                        </span>
                    ))}
                    {(sheathGroup.coreIds || []).length > 0 && (sheathGroup.sheathIds || []).length > 0 && ', '}
                    {(sheathGroup.sheathIds || []).map((sid, idx) => (
                        <span key={`sheath-${sid}`}>
                            {idx > 0 && ', '}Sheath {sheathGroups.findIndex(sg => sg.id === sid) + 1}
                        </span>
                    ))}
                </div>
            )}

            {/* Sheath Configuration */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {/* Fresh material */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Fresh Sheath Material</label>
                    <select
                        value={sheathGroup.materialTypeId || ''}
                        onChange={e => handleInsulationTypeSelect(e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">-- Select Fresh Material --</option>
                        {(insulationTypes || []).map(type => (
                            <option key={type._id} value={type._id}>
                                {type.name} (ρ = {type.density} g/cm³)
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Fresh Price/kg (₹)
                        {sheathGroup.freshPricePerKg > 0 && (
                            <span className="ml-1 text-xs text-green-600 font-normal">from PO avg</span>
                        )}
                    </label>
                    <input
                        type="number" step="0.01"
                        value={sheathGroup.freshPricePerKg || ''}
                        onChange={e => handleUpdate('freshPricePerKg', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Fresh (%)</label>
                    <input
                        type="number"
                        value={sheathGroup.freshPercent}
                        onChange={(e) => handleUpdate('freshPercent', parseFloat(e.target.value))}
                        className="w-full p-2 border rounded"
                    />
                </div>
                {/* Reprocess material — can differ from fresh */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                        Reprocess Material Type
                        <span className="ml-1 text-xs text-gray-400 font-normal">(can be different from fresh)</span>
                    </label>
                    <select
                        value={sheathGroup.reprocessMaterialTypeId || ''}
                        onChange={e => handleReprocessTypeSelect(e.target.value)}
                        className="w-full p-2 border rounded border-purple-200"
                    >
                        <option value="">-- Same as fresh / select reprocess type --</option>
                        {(insulationTypes || []).map(type => (
                            <option key={type._id} value={type._id}>
                                {type.name} (ρ = {type.density} g/cm³)
                            </option>
                        ))}
                    </select>
                    {sheathGroup.reprocessMaterialTypeId && (
                        <p className="text-xs text-purple-600 mt-1">
                            Using: <strong>{sheathGroup.reprocessMaterialTypeName}</strong>
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Reprocess Price/kg (₹)
                        {sheathGroup.reprocessPricePerKg > 0 && (
                            <span className="ml-1 text-xs text-purple-600 font-normal">from inventory</span>
                        )}
                    </label>
                    <input
                        type="number" step="0.01"
                        value={sheathGroup.reprocessPricePerKg || ''}
                        onChange={e => handleUpdate('reprocessPricePerKg', parseFloat(e.target.value) || 0)}
                        placeholder="auto (70% fresh)"
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Reprocess (%)</label>
                    <input
                        type="number"
                        value={sheathGroup.reprocessPercent}
                        onChange={(e) => handleUpdate('reprocessPercent', parseFloat(e.target.value))}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Thickness (mm)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={sheathGroup.thickness}
                        onChange={(e) => handleUpdate('thickness', parseFloat(e.target.value))}
                        className="w-full p-2 border rounded"
                    />
                </div>
            </div>

            {/* Sheath Calculations */}
            {sheathCalc ? (
                <div className="bg-white p-3 rounded">
                    <h4 className="font-semibold mb-2">Sheath Calculations</h4>
                    <div className="grid grid-cols-4 gap-2 text-sm mb-2">
                        <div>Total Inner Area: <strong>{sheathCalc.totalInnerArea} sq mm</strong></div>
                        <div>Bundle Dia: <strong>{sheathCalc.bundleDiameter} mm</strong></div>
                        <div>Outer Dia: <strong>{sheathCalc.sheathOuterDiameter} mm</strong></div>
                        <div>Total Weight: <strong>{sheathCalc.totalWeight} kg</strong></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm border-t pt-2">
                        <div>Fresh Cost: <strong className="text-green-700">₹{sheathCalc.freshCost}</strong></div>
                        <div>Reprocess Cost: <strong className="text-purple-700">₹{sheathCalc.reprocessCost}</strong></div>
                        <div className="text-green-700 font-semibold">
                            Outer Area: <strong>{outerArea.toFixed(2)} sq mm</strong>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-orange-100 border border-orange-300 p-3 rounded text-sm text-orange-800">
                    ⚠️ Please select at least one core or sheath to calculate
                </div>
            )}
        </div>
    );
};

export default SheathComponent;
