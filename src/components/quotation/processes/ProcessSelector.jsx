import { useState } from 'react';
import { Plus, Trash2, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const SOURCE_LABELS = {
    manual: 'Manual',

    // Cable-level
    cableLength: 'Cable Length (m)',
    coreCount: 'Core Count',
    totalWireCount: 'Total Wire Count',
    totalDrawingLength: 'Total Drawing Length (m)',
    totalMaterialWeight: 'Total Metal Weight (kg)',
    totalCoreArea: 'Total Core Area (mm²)',

    // Core-specific length
    coreLength: 'Core Length (m)',

    // Core conductor
    coreMaterialDensity: 'Core Material Density (g/cm³)',
    coreTotalCoreArea: 'Core Total Area (mm²)',
    coreWireCount: 'Core Wire Count',
    coreWastagePercent: 'Core Wastage %',
    coreHasAnnealing: 'Core Has Annealing',

    // Core insulation
    insulationDensity: 'Insulation Density (g/cm³)',
    insulationThickness: 'Insulation Thickness (mm)',
    insulationFreshPercent: 'Insulation Fresh %',
    insulationReprocessPercent: 'Insulation Reprocess %',
    insulationFreshPricePerKg: 'Insulation Fresh Price (₹/kg)',
    insulationReprocessPricePerKg: 'Insulation Reprocess Price (₹/kg)',

    // Sheath
    sheathDensity: 'Sheath Density (g/cm³)',
    sheathThickness: 'Sheath Thickness (mm)',
    sheathFreshPercent: 'Sheath Fresh %',
    sheathReprocessPercent: 'Sheath Reprocess %',
    sheathFreshPricePerKg: 'Sheath Fresh Price (₹/kg)',
    sheathReprocessPricePerKg: 'Sheath Reprocess Price (₹/kg)',

    // Calculated values
    wireDiameter: 'Wire Diameter (mm)',
    conductorDiameter: 'Conductor Diameter (mm)',
    insulatedDiameter: 'Insulated Diameter (mm)',
    drawingLength: 'Drawing Length (m)',
    materialWeight: 'Material Weight (kg)',
    insulationWeight: 'Insulation Weight (kg)',
    sheathWeight: 'Sheath Weight (kg)',
};

const evaluateFormula = (formula, variables) => {
    try {
        const scope = {};
        variables.forEach(v => { scope[v.name] = parseFloat(v.value) || 0; });
        if (!formula.trim()) return 0;
        // eslint-disable-next-line no-new-func
        const fn = new Function(...Object.keys(scope), `return (${formula})`);
        const result = fn(...Object.values(scope));
        return typeof result === 'number' && isFinite(result) ? result : 0;
    } catch {
        return 0;
    }
};

const ProcessSelector = ({
    processes = [],           // Process entries for this core/sheath
    onAdd,                    // (processEntry) => void
    onRemove,                 // (processEntryId) => void
    onUpdateVariable,         // (processEntryId, varName, value) => void
    processMasterList = [],   // Process[] from DB
    quoteContext = {},        // { cableLength, coreCount, ... }
    title = 'Processes',      // Display title
    compact = false           // Compact mode for inline display
}) => {
    const [showSelector, setShowSelector] = useState(false);
    const [collapsed, setCollapsed] = useState({});

    const buildEntry = (master) => {
        const variables = (master.variables || []).map(v => {
            const autoValue = v.source !== 'manual' ? (quoteContext[v.source] || 0) : null;
            return {
                name: v.name,
                label: v.label,
                unit: v.unit,
                source: v.source,
                defaultValue: v.defaultValue,
                value: autoValue !== null ? autoValue : (v.defaultValue || 0)
            };
        });
        return {
            id: Date.now() + Math.random(),
            processId: master._id,
            processName: master.name,
            category: master.category,
            formula: master.formula,
            formulaNote: master.formulaNote,
            variables
        };
    };

    const handleSelectProcess = (master) => {
        onAdd(buildEntry(master));
        setShowSelector(false);
    };

    const toggleCollapse = (id) =>
        setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

    const totalCost = processes.reduce((sum, p) =>
        sum + evaluateFormula(p.formula, p.variables), 0
    );

    const containerClass = compact
        ? "border border-gray-200 rounded-lg p-3 bg-gray-50"
        : "bg-orange-50 border-2 border-orange-200 rounded-lg p-4";

    return (
        <div className={containerClass}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Zap size={compact ? 14 : 18} className={compact ? "text-gray-600" : "text-orange-600"} />
                    <h4 className={`font-semibold ${compact ? 'text-sm text-gray-700' : 'text-base text-gray-700'}`}>
                        {title}
                    </h4>
                    {processes.length > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${compact ? 'bg-gray-200 text-gray-700' : 'bg-orange-200 text-orange-800'}`}>
                            {processes.length}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowSelector(s => !s)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-white text-xs rounded hover:opacity-90 ${compact ? 'bg-gray-700' : 'bg-gray-900'}`}
                >
                    <Plus size={12} /> Add
                </button>
            </div>

            {/* Process selector dropdown */}
            {showSelector && (
                <div className="bg-white border border-gray-300 rounded-lg shadow-md p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-2">Select a process:</p>
                    {processMasterList.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No active processes</p>
                    ) : (
                        <div className="max-h-48 overflow-y-auto space-y-1">
                            {processMasterList.map(pm => (
                                <button
                                    key={pm._id}
                                    onClick={() => handleSelectProcess(pm)}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 rounded border border-gray-200 transition"
                                >
                                    <div className="font-medium text-gray-800">{pm.name}</div>
                                    <div className="text-gray-500 text-[10px] capitalize">{pm.category}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Process list */}
            {processes.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-2">
                    No processes added yet
                </p>
            ) : (
                <div className="space-y-2">
                    {processes.map(proc => {
                        const cost = evaluateFormula(proc.formula, proc.variables);
                        const isCollapsed = collapsed[proc.id];
                        return (
                            <div key={proc.id} className="bg-white border border-gray-200 rounded-lg p-2">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="text-xs font-medium text-gray-800">{proc.processName}</span>
                                        <span className="text-xs text-gray-500 capitalize">({proc.category})</span>
                                        <span className="ml-auto text-xs font-bold text-green-600">
                                            ₹{cost.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => toggleCollapse(proc.id)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                            title={isCollapsed ? 'Expand' : 'Collapse'}
                                        >
                                            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                        </button>
                                        <button
                                            onClick={() => onRemove(proc.id)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                            title="Remove"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {!isCollapsed && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                                        {/* Formula */}
                                        <div>
                                            <p className="text-[10px] text-gray-500 mb-0.5">Formula:</p>
                                            <code className="text-[10px] bg-gray-100 px-2 py-1 rounded block text-gray-700">
                                                {proc.formula}
                                            </code>
                                        </div>

                                        {/* Variables */}
                                        {proc.variables && proc.variables.length > 0 && (
                                            <div>
                                                <p className="text-[10px] text-gray-500 mb-1">Variables:</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {proc.variables.map((v, idx) => (
                                                        <div key={idx}>
                                                            <label className="text-[10px] text-gray-600 mb-0.5 block">
                                                                {v.label} {v.unit && `(${v.unit})`}
                                                            </label>
                                                            {v.source === 'manual' ? (
                                                                <input
                                                                    type="number"
                                                                    step="any"
                                                                    value={v.value || 0}
                                                                    onChange={e => onUpdateVariable(proc.id, v.name, parseFloat(e.target.value) || 0)}
                                                                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                                                                />
                                                            ) : (
                                                                <div className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                                    {Number(v.value || 0).toFixed(2)}
                                                                    <span className="text-[10px] text-gray-400 ml-1">
                                                                        ({SOURCE_LABELS[v.source]})
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Total */}
                    {processes.length > 1 && (
                        <div className="pt-2 border-t border-gray-300">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-gray-700">Total Process Cost:</span>
                                <span className="text-sm font-bold text-green-700">₹{totalCost.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProcessSelector;
