import React, { useState } from 'react';
import { Trash2, Layers, CheckCircle, AlertTriangle, Package, Minimize2, Maximize2 } from 'lucide-react';
import ProcessSelector from '../processes/ProcessSelector';

const fmtN = (n, d = 3) => Number(n || 0).toFixed(d);
const fmtCur = (n) => '₹' + Number(n || 0).toFixed(2);

const StatBox = ({ label, value, accent }) => (
    <div className={`rounded-lg px-3 py-2 ${accent ? 'bg-teal-50 border border-teal-100' : 'bg-gray-50 border border-gray-100'}`}>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm font-bold ${accent ? 'text-teal-700' : 'text-gray-700'}`}>{value}</p>
    </div>
);

const FieldLabel = ({ children }) => (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{children}</label>
);

const InputField = ({ className = '', ...props }) => (
    <input
        {...props}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition ${className}`}
    />
);

const SelectField = ({ className = '', children, ...props }) => (
    <select
        {...props}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition ${className}`}
    >
        {children}
    </select>
);

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
    getAvailableSheaths,
    // Process management props
    processMasterList = [],
    quoteContext = {},
    onAddProcess,
    onRemoveProcess,
    onUpdateProcessVariable
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleUpdate = (field, value) => {
        onUpdate(sheathGroup.id, field, value);
    };

    // Calculate process cost for this sheath
    const processCost = (sheathGroup.processes || []).reduce((sum, process) => {
        const scope = {};
        (process.variables || []).forEach(v => {
            scope[v.name] = parseFloat(v.value) || 0;
        });
        try {
            if (!process.formula || !process.formula.trim()) return sum;
            const fn = new Function(...Object.keys(scope), `return (${process.formula})`);
            const result = fn(...Object.values(scope));
            return sum + (typeof result === 'number' && isFinite(result) ? result : 0);
        } catch {
            return sum;
        }
    }, 0);

    const handleInsulationTypeSelect = (typeId) => {
        if (!typeId) {
            handleUpdate('materialTypeId', null);
            handleUpdate('material', '');
            handleUpdate('materialId', null);
            handleUpdate('materialObject', null);
            handleUpdate('density', 1.4);
            handleUpdate('freshPricePerKg', 0);
            handleUpdate('reprocessPricePerKg', 0);
            return;
        }
        const type = (insulationTypes || []).find(t => t._id === typeId);
        if (!type) return;
        handleUpdate('materialTypeId', typeId);
        handleUpdate('material', type.name);
        handleUpdate('materialId', null);
        handleUpdate('materialObject', null);
        handleUpdate('density', type.density || 1.4);
        handleUpdate('freshPricePerKg', 0);
        handleUpdate('reprocessPricePerKg', 0);
    };

    const handleSheathMaterialSelect = (materialId) => {
        if (!materialId) {
            handleUpdate('materialId', null);
            handleUpdate('materialObject', null);
            handleUpdate('freshPricePerKg', 0);
            handleUpdate('reprocessPricePerKg', 0);
            return;
        }
        const material = (insulationRawMaterials || []).find(m => m._id === materialId);
        if (!material) return;
        handleUpdate('materialId', material._id);
        handleUpdate('materialObject', {
            _id: material._id,
            name: material.name,
            category: material.category,
            specifications: material.specifications
        });
        handleUpdate('freshPricePerKg', material?.inventory?.avgPricePerKg || 0);
        handleUpdate('reprocessPricePerKg', material?.reprocessInventory?.pricePerKg || 0);
    };

    const handleReprocessTypeSelect = (typeId) => {
        if (!typeId) {
            handleUpdate('reprocessMaterialTypeId', null);
            handleUpdate('reprocessMaterialTypeName', '');
            handleUpdate('reprocessMaterialId', null);
            handleUpdate('reprocessMaterialObject', null);
            handleUpdate('reprocessDensity', null);
            handleUpdate('reprocessPricePerKg', 0);
            return;
        }
        const type = (insulationTypes || []).find(t => t._id === typeId);
        if (!type) return;
        handleUpdate('reprocessMaterialTypeId', typeId);
        handleUpdate('reprocessMaterialTypeName', type.name);
        handleUpdate('reprocessMaterialId', null);
        handleUpdate('reprocessMaterialObject', null);
        handleUpdate('reprocessDensity', type.density || null);
        handleUpdate('reprocessPricePerKg', 0);
    };

    const handleReprocessMaterialSelect = (materialId) => {
        if (!materialId) {
            handleUpdate('reprocessMaterialId', null);
            handleUpdate('reprocessMaterialObject', null);
            handleUpdate('reprocessPricePerKg', 0);
            return;
        }
        const material = (insulationRawMaterials || []).find(m => m._id === materialId);
        if (!material) return;
        handleUpdate('reprocessMaterialId', material._id);
        handleUpdate('reprocessMaterialObject', {
            _id: material._id,
            name: material.name,
            category: material.category,
            specifications: material.specifications
        });
        handleUpdate('reprocessPricePerKg', material?.reprocessInventory?.pricePerKg || 0);
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

    const availableCores = getAvailableCores(sheathGroup.id);
    const availableSheaths = getAvailableSheaths(sheathGroup.id);
    const sheathCalc = calculateSheathForGroup(sheathGroup);
    const outerArea = sheathCalc
        ? (Math.PI * sheathCalc.sheathOuterDiameter * sheathCalc.sheathOuterDiameter) / 4
        : 0;

    const filteredSheathMaterials = sheathGroup.materialTypeId
        ? (insulationRawMaterials || []).filter(m => {
            const mtId = typeof m.materialTypeId === 'object' ? m.materialTypeId?._id : m.materialTypeId;
            return mtId === sheathGroup.materialTypeId;
        })
        : [];

    const filteredReprocessMaterials = sheathGroup.reprocessMaterialTypeId
        ? (insulationRawMaterials || []).filter(m => {
            const mtId = typeof m.materialTypeId === 'object' ? m.materialTypeId?._id : m.materialTypeId;
            return mtId === sheathGroup.reprocessMaterialTypeId;
        })
        : [];

    const selectedCoreIds = sheathGroup.coreIds || [];
    const selectedSheathIds = sheathGroup.sheathIds || [];
    const hasSelection = selectedCoreIds.length > 0 || selectedSheathIds.length > 0;

    return (
        <div id={`sheath-${sheathGroup.id}`} className="bg-white border-2 border-teal-200 rounded-xl overflow-hidden shadow-sm mb-4">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-3 bg-linear-to-r from-teal-700 to-teal-800">
                <div className="flex items-center gap-2.5">
                    <div className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-wide">Sheath Group {index + 1}</h3>
                </div>

                <div className="flex items-center gap-2">
                    {/* Cost summary when collapsed */}
                    {isCollapsed && sheathCalc && (
                        <div className="flex items-center gap-3 text-xs mr-2">
                            <span className="text-teal-100">
                                Material: {fmtCur(sheathCalc.totalCost)}
                            </span>
                            {processCost > 0 && (
                                <span className="text-teal-100">
                                    Process: {fmtCur(processCost)}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Minimize/Maximize button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-teal-600 transition-colors"
                        title={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                        {isCollapsed ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>

                    {/* Delete button */}
                    <button
                        onClick={() => onDelete(sheathGroup.id)}
                        className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-600 transition-colors"
                        title="Remove sheath group"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="p-5 space-y-5">

                    {/* ── Section 1: Content Selection ── */}
                    <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Package size={15} className="text-teal-600" />
                        <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Sheath Contents</span>
                    </div>

                    {/* Core Selection */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3">
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Select Cores</p>
                        {availableCores.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {availableCores.map((core) => {
                                    const coreNumber = cores.findIndex(c => c.id === core.id) + 1;
                                    const isSelected = selectedCoreIds.includes(core.id);
                                    return (
                                        <label
                                            key={core.id}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white border border-blue-200 text-blue-800 hover:bg-blue-100'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleCore(core.id)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-sm font-medium">Core {coreNumber}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-blue-500 italic">All cores are used in other sheaths</p>
                        )}
                    </div>

                    {/* Nested Sheath Selection */}
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-2">Nested Sheaths (Optional)</p>
                        {availableSheaths.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {availableSheaths.map((sheath) => {
                                    const sheathNumber = sheathGroups.findIndex(sg => sg.id === sheath.id) + 1;
                                    const isSelected = selectedSheathIds.includes(sheath.id);
                                    return (
                                        <label
                                            key={sheath.id}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-white border border-purple-200 text-purple-800 hover:bg-purple-100'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSheath(sheath.id)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-sm font-medium">Sheath {sheathNumber}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-purple-500 italic">No sheaths available for nesting</p>
                        )}
                    </div>

                    {/* Selected Items Summary */}
                    {hasSelection && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                            <CheckCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                            <div className="text-xs text-amber-800">
                                <strong className="font-semibold">Contains:</strong>{' '}
                                {selectedCoreIds.map((cid, idx) => (
                                    <span key={`core-${cid}`}>
                                        {idx > 0 && ', '}Core {cores.findIndex(c => c.id === cid) + 1}
                                    </span>
                                ))}
                                {selectedCoreIds.length > 0 && selectedSheathIds.length > 0 && ', '}
                                {selectedSheathIds.map((sid, idx) => (
                                    <span key={`sheath-${sid}`}>
                                        {idx > 0 && ', '}Sheath {sheathGroups.findIndex(sg => sg.id === sid) + 1}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Section 2: Material Configuration ── */}
                <div className="border border-teal-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-50">
                        <Layers size={14} className="text-teal-600" />
                        <span className="text-sm font-bold text-gray-700">Sheath Material</span>
                    </div>

                    <div className="px-4 pt-3 pb-4 bg-white space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Fresh Type */}
                            <div className="md:col-span-2">
                                <FieldLabel>Fresh Material Type</FieldLabel>
                                <SelectField
                                    value={sheathGroup.materialTypeId || ''}
                                    onChange={e => handleInsulationTypeSelect(e.target.value)}
                                >
                                    <option value="">— Select Fresh Material —</option>
                                    {(insulationTypes || []).map(type => (
                                        <option key={type._id} value={type._id}>
                                            {type.name} (ρ = {type.density} g/cm³)
                                        </option>
                                    ))}
                                </SelectField>
                            </div>

                            {/* Fresh Raw Material */}
                            <div className="md:col-span-2">
                                <FieldLabel>Fresh Raw Material</FieldLabel>
                                <SelectField
                                    value={sheathGroup.materialId || ''}
                                    onChange={e => handleSheathMaterialSelect(e.target.value)}
                                    disabled={!sheathGroup.materialTypeId}
                                >
                                    <option value="">— Select Raw Material —</option>
                                    {filteredSheathMaterials.map(mat => (
                                        <option key={mat._id} value={mat._id}>
                                            {mat.name} | Code: {mat.materialCode} | Stock: {mat.inventory?.totalWeight?.toFixed(1) || 0} kg | ₹{mat.inventory?.avgPricePerKg?.toFixed(2) || 0}/kg
                                        </option>
                                    ))}
                                </SelectField>
                                {!sheathGroup.materialTypeId && (
                                    <p className="text-xs text-gray-400 mt-1">Select material type first</p>
                                )}
                                {sheathGroup.materialTypeId && filteredSheathMaterials.length === 0 && (
                                    <p className="text-xs text-orange-500 mt-1">No raw materials found for this type</p>
                                )}
                            </div>

                            {/* Fresh Price */}
                            <div>
                                <FieldLabel>
                                    Fresh Price/kg (₹)
                                    {sheathGroup.freshPricePerKg > 0 && (
                                        <span className="ml-1 text-emerald-500 normal-case font-normal">(stock avg)</span>
                                    )}
                                </FieldLabel>
                                <InputField
                                    type="number" step="0.01"
                                    value={sheathGroup.freshPricePerKg || ''}
                                    onChange={e => handleUpdate('freshPricePerKg', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    disabled={!sheathGroup.materialId}
                                />
                            </div>

                            {/* Fresh % */}
                            <div>
                                <FieldLabel>Fresh (%)</FieldLabel>
                                <InputField
                                    type="number"
                                    value={sheathGroup.freshPercent}
                                    onChange={e => handleUpdate('freshPercent', parseFloat(e.target.value))}
                                />
                            </div>

                            {/* Reprocess Type */}
                            <div className="md:col-span-2">
                                <FieldLabel>
                                    Reprocess Type
                                    <span className="ml-1 text-gray-400 normal-case font-normal">(optional — can differ)</span>
                                </FieldLabel>
                                <SelectField
                                    value={sheathGroup.reprocessMaterialTypeId || ''}
                                    onChange={e => handleReprocessTypeSelect(e.target.value)}
                                    className="border-purple-200 focus:ring-purple-300 focus:border-purple-400"
                                >
                                    <option value="">— Same as fresh / select reprocess type —</option>
                                    {(insulationTypes || []).map(type => (
                                        <option key={type._id} value={type._id}>
                                            {type.name} (ρ = {type.density} g/cm³)
                                        </option>
                                    ))}
                                </SelectField>
                                {sheathGroup.reprocessMaterialTypeId && (
                                    <p className="text-xs text-purple-600 mt-1">
                                        Reprocess stock: <strong>{sheathGroup.reprocessMaterialTypeName}</strong>
                                    </p>
                                )}
                            </div>

                            {/* Reprocess Raw Material */}
                            <div className="md:col-span-2">
                                <FieldLabel>
                                    Reprocess Raw Material
                                    <span className="ml-1 text-gray-400 normal-case font-normal">(optional)</span>
                                </FieldLabel>
                                <SelectField
                                    value={sheathGroup.reprocessMaterialId || ''}
                                    onChange={e => handleReprocessMaterialSelect(e.target.value)}
                                    disabled={!sheathGroup.reprocessMaterialTypeId}
                                    className="border-purple-200 focus:ring-purple-300 focus:border-purple-400"
                                >
                                    <option value="">— Select Reprocess Raw Material —</option>
                                    {filteredReprocessMaterials.map(mat => (
                                        <option key={mat._id} value={mat._id}>
                                            {mat.name} | Code: {mat.materialCode} | Reprocess: {mat.reprocessInventory?.totalWeight?.toFixed(1) || 0} kg | ₹{mat.reprocessInventory?.pricePerKg?.toFixed(2) || 0}/kg
                                        </option>
                                    ))}
                                </SelectField>
                                {!sheathGroup.reprocessMaterialTypeId && (
                                    <p className="text-xs text-gray-400 mt-1">Select reprocess type first</p>
                                )}
                                {sheathGroup.reprocessMaterialTypeId && filteredReprocessMaterials.length === 0 && (
                                    <p className="text-xs text-orange-500 mt-1">No reprocess materials found for this type</p>
                                )}
                            </div>

                            {/* Reprocess Price */}
                            <div>
                                <FieldLabel>
                                    Reprocess Price/kg (₹)
                                    {sheathGroup.reprocessPricePerKg > 0 && (
                                        <span className="ml-1 text-purple-500 normal-case font-normal">(stock)</span>
                                    )}
                                </FieldLabel>
                                <InputField
                                    type="number" step="0.01"
                                    value={sheathGroup.reprocessPricePerKg || ''}
                                    onChange={e => handleUpdate('reprocessPricePerKg', parseFloat(e.target.value) || 0)}
                                    placeholder="auto (70% fresh)"
                                    className="border-purple-200"
                                    disabled={!sheathGroup.reprocessMaterialId}
                                />
                            </div>

                            {/* Reprocess % */}
                            <div>
                                <FieldLabel>Reprocess (%)</FieldLabel>
                                <InputField
                                    type="number"
                                    value={sheathGroup.reprocessPercent}
                                    onChange={e => handleUpdate('reprocessPercent', parseFloat(e.target.value))}
                                    className="border-purple-200"
                                />
                            </div>

                            {/* Thickness */}
                            <div>
                                <FieldLabel>Thickness (mm)</FieldLabel>
                                <InputField
                                    type="number" step="0.1"
                                    value={sheathGroup.thickness}
                                    onChange={e => handleUpdate('thickness', parseFloat(e.target.value))}
                                />
                            </div>

                            {/* Wastage % */}
                            <div>
                                <FieldLabel>Wastage (%)</FieldLabel>
                                <InputField
                                    type="number" step="0.1" min="0" max="100"
                                    value={sheathGroup.wastagePercent || 0}
                                    onChange={e => handleUpdate('wastagePercent', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Sheath Results */}
                        {sheathCalc ? (
                            <div className="space-y-2 pt-2">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <StatBox label="Inner Area" value={`${sheathCalc.totalInnerArea} mm²`} />
                                    <StatBox label="Bundle Dia" value={`${sheathCalc.bundleDiameter} mm`} />
                                    <StatBox label="Sheath Outer Dia" value={`${sheathCalc.sheathOuterDiameter} mm`} accent />
                                    <StatBox label="Total Weight" value={`${sheathCalc.totalWeight} kg`} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    <StatBox label="Fresh Cost" value={fmtCur(sheathCalc.freshCost)} />
                                    <StatBox label="Reprocess Cost" value={fmtCur(sheathCalc.reprocessCost)} />
                                    <StatBox label="Sheath Total" value={fmtCur(sheathCalc.totalCost)} accent />
                                </div>
                                <div className="flex gap-2 pt-1 border-t border-gray-100">
                                    <div className="flex-1 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                                        <p className="text-xs text-teal-500">Outer Area (After Sheath)</p>
                                        <p className="text-sm font-bold text-teal-700">{fmtN(outerArea, 2)} mm²</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 text-sm text-orange-700 mt-2">
                                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                <span>Select at least one core or sheath to calculate sheath dimensions</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Process Selector for this Sheath */}
                <div className="mt-4">
                    <ProcessSelector
                        processes={sheathGroup.processes || []}
                        onAdd={(entry) => onAddProcess && onAddProcess(entry)}
                        onRemove={(id) => onRemoveProcess && onRemoveProcess(id)}
                        onUpdateVariable={(processId, varName, value) =>
                            onUpdateProcessVariable && onUpdateProcessVariable(processId, varName, value)
                        }
                        processMasterList={processMasterList}
                        quoteContext={quoteContext}
                        title={`Sheath ${index + 1} Processes`}
                        compact={true}
                    />
                </div>

                </div>
            )}
        </div>
    );
};

export default SheathComponent;
