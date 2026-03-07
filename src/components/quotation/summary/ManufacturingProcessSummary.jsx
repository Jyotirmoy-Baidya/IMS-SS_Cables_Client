import { useEffect } from 'react';
import { Settings, Layers, Package } from 'lucide-react';
import useQuotationProcessStore from '../../../store/quotationProcessStore.js';

const CATEGORY_ICONS = {
    conductor: Settings,
    insulation: Layers,
    sheathing: Package,
    general: Settings
};

const CATEGORY_COLORS = {
    conductor: 'bg-orange-50 border-orange-200 text-orange-700',
    insulation: 'bg-blue-50 border-blue-200 text-blue-700',
    sheathing: 'bg-green-50 border-green-200 text-green-700',
    general: 'bg-gray-50 border-gray-200 text-gray-700'
};

const CONTEXT_BADGES = {
    core: 'bg-purple-100 text-purple-700',
    sheath: 'bg-teal-100 text-teal-700',
    quote: 'bg-indigo-100 text-indigo-700'
};

/**
 * Evaluates a process formula with given variable values
 */
const evaluateFormula = (formula, variables) => {
    try {
        if (!formula.trim()) return 0;
        const scope = {};
        variables.forEach(v => {
            scope[v.name] = parseFloat(v.value) || parseFloat(v.defaultValue) || 0;
        });
        // eslint-disable-next-line no-new-func
        const fn = new Function(...Object.keys(scope), `return (${formula})`);
        const result = fn(...Object.values(scope));
        return typeof result === 'number' && isFinite(result) ? result : 0;
    } catch {
        return 0;
    }
};

const ManufacturingProcessSummary = ({ quotation }) => {
    const { allProcesses, syncFromQuotation, getProcessesByCategory } = useQuotationProcessStore();

    // Sync store whenever quotation changes
    useEffect(() => {
        if (quotation) {
            syncFromQuotation({
                cores: quotation.cores || [],
                sheathGroups: quotation.sheathGroups || [],
                quoteProcesses: quotation.quoteProcesses || []
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quotation.cores, quotation.sheathGroups, quotation.quoteProcesses]);

    const processesByCategory = getProcessesByCategory();
    const categories = Object.keys(processesByCategory);

    if (allProcesses.length === 0) {
        return (
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <Settings size={18} />
                    Manufacturing Process Summary
                </h3>
                <p className="text-sm text-gray-400 italic">
                    No processes added yet. Add processes to cores, sheaths, or cable level.
                </p>
            </div>
        );
    }

    // Calculate total process cost
    const totalProcessCost = allProcesses.reduce((sum, proc) => {
        return sum + evaluateFormula(proc.formula, proc.variables);
    }, 0);

    return (
        <div className="bg-white rounded-lg">
            {/* Header */}
            <div className="bg-linear-to-r from-indigo-50 via-purple-50 to-indigo-50 px-6 py-5 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2.5 rounded-lg shadow-sm">
                            <Settings size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                                Manufacturing Process Summary
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Aggregated view of all manufacturing operations
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white border border-indigo-100 rounded-lg px-4 py-2.5 shadow-sm">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                                Total Processes
                            </p>
                            <p className="text-xl font-bold text-indigo-600">
                                {allProcesses.length}
                            </p>
                        </div>
                        <div className="bg-white border border-indigo-100 rounded-lg px-4 py-2.5 shadow-sm">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                                Total Cost
                            </p>
                            <p className="text-xl font-bold text-indigo-600">
                                ₹{totalProcessCost.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Process List by Category */}
            <div className="p-6 space-y-6">
                {categories.map(category => {
                    const categoryProcesses = processesByCategory[category];
                    const Icon = CATEGORY_ICONS[category] || Settings;
                    const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;

                    const categoryCost = categoryProcesses.reduce((sum, proc) => {
                        return sum + evaluateFormula(proc.formula, proc.variables);
                    }, 0);

                    return (
                        <div key={category} className="space-y-3">
                            {/* Category Header */}
                            <div className={`flex items-center gap-2 px-3 py-2 rounded border ${colorClass}`}>
                                <Icon size={16} />
                                <span className="font-semibold capitalize">{category}</span>
                                <span className="ml-auto text-sm">
                                    {categoryProcesses.length} process{categoryProcesses.length !== 1 ? 'es' : ''}
                                    {' • '}₹{categoryCost.toFixed(2)}
                                </span>
                            </div>

                            {/* Processes in this category */}
                            <div className="space-y-2 pl-4">
                                {categoryProcesses.map(proc => {
                                    const cost = evaluateFormula(proc.formula, proc.variables);
                                    const contextBadge = CONTEXT_BADGES[proc.context.type] || CONTEXT_BADGES.quote;

                                    return (
                                        <div
                                            key={proc.id}
                                            className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            {/* Process Header */}
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-sm">{proc.processName}</h4>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${contextBadge}`}>
                                                            {proc.context.label}
                                                        </span>
                                                    </div>
                                                    {proc.formulaNote && (
                                                        <p className="text-xs text-gray-500 italic">{proc.formulaNote}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold text-sm">₹{cost.toFixed(2)}</div>
                                                </div>
                                            </div>

                                            {/* Formula */}
                                            <div className="text-xs font-mono bg-white px-2 py-1 rounded border mb-2">
                                                {proc.formula}
                                            </div>

                                            {/* Variables */}
                                            {proc.variables && proc.variables.length > 0 && (
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    {proc.variables.map((v, idx) => (
                                                        <div key={idx} className="flex justify-between items-center bg-white px-2 py-1 rounded">
                                                            <span className="text-gray-600">
                                                                {v.label || v.name}
                                                                {v.unit && <span className="text-gray-400 ml-1">({v.unit})</span>}
                                                            </span>
                                                            <span className="font-medium text-gray-900">
                                                                {parseFloat(v.value) || parseFloat(v.defaultValue) || 0}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary Footer */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    Manufacturing processes across {quotation.cores?.length || 0} cores,
                    {' '}{quotation.sheathGroups?.length || 0} sheath groups,
                    {' '}and {quotation.quoteProcesses?.length || 0} cable-level processes
                </div>
                <div className="text-base font-bold">
                    Total Process Cost: ₹{totalProcessCost.toFixed(2)}
                </div>
            </div>
        </div>
    );
};

export default ManufacturingProcessSummary;
