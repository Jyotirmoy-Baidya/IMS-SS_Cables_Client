import { useState } from 'react';
import { Plus, Trash2, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const SOURCE_LABELS = {
    manual:              'Manual',
    cableLength:         'Cable Length (m)',
    coreCount:           'Core Count',
    totalWireCount:      'Total Wire Count',
    totalDrawingLength:  'Total Drawing Length (m)',
    totalMaterialWeight: 'Total Metal Weight (kg)',
    totalCoreArea:       'Total Core Area (mm²)',
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

const QuoteProcessSection = ({
    processes,          // current process entries in the quote
    onAdd,              // (processEntry) => void
    onRemove,           // (id) => void
    onUpdateVariable,   // (processEntryId, varName, value) => void
    processMasterList,  // Process[] from DB (active only)
    quoteContext        // { cableLength, coreCount, totalWireCount, ... }
}) => {
    const [showSelector, setShowSelector] = useState(false);
    const [collapsed, setCollapsed] = useState({});

    // Build a process entry from a master process record + quoteContext
    const buildEntry = (master) => {
        const variables = (master.variables || []).map(v => {
            const autoValue = v.source !== 'manual' ? (quoteContext[v.source] || 0) : null;
            return {
                name:         v.name,
                label:        v.label,
                unit:         v.unit,
                source:       v.source,
                defaultValue: v.defaultValue,
                value:        autoValue !== null ? autoValue : (v.defaultValue || 0)
            };
        });
        return {
            id:          Date.now() + Math.random(),
            processId:   master._id,
            processName: master.name,
            category:    master.category,
            formula:     master.formula,
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

    return (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Zap size={18} className="text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-700">Manufacturing Processes</h3>
                    {processes.length > 0 && (
                        <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                            {processes.length}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowSelector(s => !s)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700"
                >
                    <Plus size={14} /> Add Process
                </button>
            </div>

            {/* Process selector dropdown */}
            {showSelector && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-2">Select a process to add:</p>
                    {processMasterList.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No active processes found. Create them in Process Master.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                            {processMasterList.map(master => (
                                <button
                                    key={master._id}
                                    onClick={() => handleSelectProcess(master)}
                                    className="text-left p-2 rounded border hover:bg-orange-50 hover:border-orange-300 transition-colors"
                                >
                                    <div className="text-sm font-medium">{master.name}</div>
                                    {master.formulaNote && (
                                        <div className="text-xs text-gray-400">{master.formulaNote}</div>
                                    )}
                                    <code className="text-xs text-gray-500 block truncate mt-0.5">{master.formula}</code>
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => setShowSelector(false)}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Process entries */}
            {processes.length === 0 ? (
                <div className="text-sm text-gray-400 italic text-center py-3">
                    No processes added yet. Click "Add Process" to include manufacturing costs.
                </div>
            ) : (
                <div className="space-y-3">
                    {processes.map(entry => {
                        const cost = evaluateFormula(entry.formula, entry.variables);
                        const isCollapsed = collapsed[entry.id];

                        return (
                            <div key={entry.id} className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                                {/* Process header */}
                                <div className="flex items-center justify-between px-3 py-2 bg-orange-50">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <button
                                            onClick={() => toggleCollapse(entry.id)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                                        </button>
                                        <span className="font-medium text-sm text-gray-800">{entry.processName}</span>
                                        {entry.formulaNote && (
                                            <span className="text-xs text-gray-400 truncate hidden md:block">— {entry.formulaNote}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                        <span className="text-sm font-semibold text-orange-700">
                                            ₹{cost.toFixed(2)}
                                        </span>
                                        <button
                                            onClick={() => onRemove(entry.id)}
                                            className="p-1 text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {!isCollapsed && (
                                    <div className="p-3">
                                        {/* Formula display */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <code className="text-xs bg-gray-50 border rounded px-2 py-1 text-gray-600 flex-1 truncate">
                                                {entry.formula}
                                            </code>
                                        </div>

                                        {/* Variables */}
                                        {entry.variables.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic">No variables — fixed cost formula</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {entry.variables.map(v => (
                                                    <div key={v.name} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs font-medium text-gray-700">{v.label}</span>
                                                                {v.unit && (
                                                                    <span className="text-xs text-gray-400">({v.unit})</span>
                                                                )}
                                                            </div>
                                                            {v.source !== 'manual' && (
                                                                <span className="text-xs text-blue-500">
                                                                    auto: {SOURCE_LABELS[v.source]}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={v.value}
                                                            readOnly={v.source !== 'manual'}
                                                            onChange={e => onUpdateVariable(entry.id, v.name, parseFloat(e.target.value) || 0)}
                                                            className={`w-24 px-2 py-1 border rounded text-xs text-right ${
                                                                v.source !== 'manual'
                                                                    ? 'bg-blue-50 border-blue-200 text-blue-700 cursor-not-allowed'
                                                                    : 'bg-white'
                                                            }`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Total */}
            {processes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-orange-200 flex justify-end">
                    <div className="bg-white rounded-lg px-4 py-2 border border-orange-200 text-sm font-semibold text-orange-800">
                        Total Process Cost: ₹{totalCost.toFixed(2)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteProcessSection;
