import { useState } from 'react';
import { Calculator, ChevronDown, ChevronUp, Package, Zap, Info, TrendingUp } from 'lucide-react';

// Same evaluator used in QuoteProcessSection
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

const fmtINR = (n) =>
    '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Row = ({ label, value, bold, muted, accent }) => (
    <div className={`flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0
        ${bold ? 'font-semibold' : ''} ${muted ? 'text-gray-400' : 'text-gray-700'}`}>
        <span className="text-sm">{label}</span>
        <span className={`text-sm tabular-nums ${accent ? 'text-blue-700 font-bold' : ''}`}>{value}</span>
    </div>
);

const SectionCard = ({ title, icon: Icon, iconColor = 'text-blue-600', children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon size={16} className={iconColor} />
                    <span className="text-sm font-semibold text-gray-700">{title}</span>
                </div>
                {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
            </button>
            {open && <div className="px-4 py-3">{children}</div>}
        </div>
    );
};

const QuotationSummary = ({ totals, quoteProcesses = [], profitMarginPercent = 0, onProfitMarginChange }) => {
    const [showMaterialDetails, setShowMaterialDetails] = useState(false);

    // Material cost is the full calculated total (no built-in process rates)
    const materialCost = totals.totalCost;
    const details = totals.details || [];

    // Aggregate by (type, name) for the summary table
    const aggregated = Object.values(
        details.reduce((acc, d) => {
            const key = `${d.type}_${d.name}`;
            if (!acc[key]) acc[key] = { name: d.name, type: d.type, totalWeight: 0, cost: 0 };
            acc[key].totalWeight += d.type === 'conductor'
                ? (d.weight || 0)
                : (d.freshWeight || 0) + (d.reprocessWeight || 0);
            acc[key].cost += d.cost || 0;
            return acc;
        }, {})
    );

    // Group detail entries by core index for the per-core breakdown
    const coreGroups = details
        .filter(d => d.coreIndex !== undefined)
        .reduce((acc, d) => {
            if (!acc[d.coreIndex]) acc[d.coreIndex] = [];
            acc[d.coreIndex].push(d);
            return acc;
        }, {});

    const sheathEntries = details.filter(d => d.type === 'sheath');

    // Costs from Manufacturing Process Master entries
    const mfgProcessCost = quoteProcesses.reduce(
        (sum, p) => sum + evaluateFormula(p.formula, p.variables),
        0
    );

    const grandTotal = materialCost + mfgProcessCost;
    const profitAmount = grandTotal * (profitMarginPercent / 100);
    const finalPrice = grandTotal + profitAmount;

    return (
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">

            {/* ── Header ── */}
            <div className="bg-linear-to-r from-blue-700 to-blue-800 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Calculator size={22} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Quotation Summary</h2>
                        <p className="text-blue-200 text-xs mt-0.5">Final cost estimate for this cable configuration</p>
                    </div>
                </div>
            </div>

            <div className="p-5">

                {/* ── Top Metric Cards ── */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1">Material Cost</p>
                        <p className="text-lg font-bold text-blue-800">{fmtINR(materialCost)}</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center">
                        <p className="text-xs text-orange-500 font-medium uppercase tracking-wide mb-1">Process Cost</p>
                        <p className="text-lg font-bold text-orange-800">{fmtINR(mfgProcessCost)}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
                        <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Final Price</p>
                        <p className="text-xl font-bold text-emerald-800">{fmtINR(finalPrice)}</p>
                    </div>
                </div>

                {/* ── Material Requirements ── */}
                <SectionCard title="Material Requirements" icon={Package} iconColor="text-blue-600" defaultOpen={true}>
                    {aggregated.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No materials configured yet. Select rods and insulation types to see requirements.</p>
                    ) : (
                        <>
                            {/* Aggregated summary table */}
                            <div className="w-full text-xs mb-3">
                                <div className="grid grid-cols-3 gap-x-2 px-2 py-1 bg-gray-100 rounded text-gray-500 font-semibold uppercase tracking-wide mb-1">
                                    <span>Material</span>
                                    <span className="text-center">Type</span>
                                    <span className="text-right">Qty (kg)</span>
                                </div>
                                {aggregated.map((m, i) => (
                                    <div key={i} className="grid grid-cols-3 gap-x-2 px-2 py-1.5 border-b border-gray-100 last:border-0 items-center">
                                        <span className="font-medium text-gray-700">{m.name}</span>
                                        <span className="text-center capitalize text-gray-400">{m.type}</span>
                                        <span className="text-right font-semibold text-gray-700">{m.totalWeight.toFixed(3)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Info / per-core details toggle */}
                            <button
                                onClick={() => setShowMaterialDetails(p => !p)}
                                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium mb-1"
                            >
                                <Info size={13} />
                                {showMaterialDetails ? 'Hide per-core breakdown' : 'View per-core breakdown'}
                            </button>

                            {showMaterialDetails && (
                                <div className="mt-2 space-y-2">
                                    {/* Per-core breakdown */}
                                    {Object.entries(coreGroups).map(([coreIdx, items]) => (
                                        <div key={coreIdx} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                            <p className="text-xs font-bold text-blue-700 mb-2">Core {parseInt(coreIdx) + 1}</p>
                                            {items.map((item, i) => (
                                                <div key={i} className="mb-1.5 last:mb-0">
                                                    {item.type === 'conductor' ? (
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-600">{item.name} <span className="text-gray-400">(conductor)</span></span>
                                                            <span className="font-semibold text-gray-700">{item.weight.toFixed(3)} kg</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">{item.name} <span className="text-gray-400">(insulation)</span></span>
                                                                <span className="font-semibold text-gray-700">{((item.freshWeight || 0) + (item.reprocessWeight || 0)).toFixed(3)} kg</span>
                                                            </div>
                                                            {item.freshWeight > 0 && (
                                                                <div className="flex justify-between pl-3 text-gray-400">
                                                                    <span>↳ Fresh</span>
                                                                    <span>{item.freshWeight.toFixed(3)} kg</span>
                                                                </div>
                                                            )}
                                                            {item.reprocessWeight > 0 && (
                                                                <div className="flex justify-between pl-3 text-gray-400">
                                                                    <span>↳ Reprocess{item.name !== item.reprocessName ? ` (${item.reprocessName})` : ''}</span>
                                                                    <span>{item.reprocessWeight.toFixed(3)} kg</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    {/* Sheath breakdown */}
                                    {sheathEntries.length > 0 && (
                                        <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                                            <p className="text-xs font-bold text-green-700 mb-2">Outer Sheath</p>
                                            {sheathEntries.map((item, i) => (
                                                <div key={i} className="mb-1.5 last:mb-0 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">{item.name} <span className="text-gray-400">(sheath {item.sheathIndex + 1})</span></span>
                                                        <span className="font-semibold text-gray-700">{((item.freshWeight || 0) + (item.reprocessWeight || 0)).toFixed(3)} kg</span>
                                                    </div>
                                                    {item.freshWeight > 0 && (
                                                        <div className="flex justify-between pl-3 text-gray-400">
                                                            <span>↳ Fresh</span>
                                                            <span>{item.freshWeight.toFixed(3)} kg</span>
                                                        </div>
                                                    )}
                                                    {item.reprocessWeight > 0 && (
                                                        <div className="flex justify-between pl-3 text-gray-400">
                                                            <span>↳ Reprocess{item.name !== item.reprocessName ? ` (${item.reprocessName})` : ''}</span>
                                                            <span>{item.reprocessWeight.toFixed(3)} kg</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-600">Total Material Cost</span>
                        <span className="text-sm font-bold text-blue-700">{fmtINR(materialCost)}</span>
                    </div>
                </SectionCard>

                {/* ── Manufacturing Processes from Process Master ── */}
                <SectionCard title="Manufacturing Processes" icon={Zap} iconColor="text-orange-500" defaultOpen={true}>
                    {quoteProcesses.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No manufacturing processes added. Use the Manufacturing Processes section above to add them.</p>
                    ) : (
                        quoteProcesses.map((entry) => {
                            const cost = evaluateFormula(entry.formula, entry.variables);
                            return (
                                <div key={entry.id} className="mb-2 last:mb-0 bg-orange-50 border border-orange-100 rounded-lg p-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">{entry.processName}</p>
                                            {entry.formulaNote && (
                                                <p className="text-xs text-gray-400 mt-0.5">{entry.formulaNote}</p>
                                            )}
                                            <code className="text-xs text-gray-400 mt-1 block">{entry.formula}</code>
                                        </div>
                                        <span className="text-sm font-bold text-orange-700 shrink-0 ml-4">{fmtINR(cost)}</span>
                                    </div>
                                    {entry.variables.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-orange-100">
                                            {entry.variables.map(v => (
                                                <span key={v.name} className="text-xs text-gray-500 bg-white border border-orange-100 rounded px-2 py-0.5">
                                                    {v.label}: <strong>{v.value}</strong>{v.unit ? ` ${v.unit}` : ''}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    {quoteProcesses.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-600">Manufacturing Process Total</span>
                            <span className="text-sm font-bold text-orange-700">{fmtINR(mfgProcessCost)}</span>
                        </div>
                    )}
                </SectionCard>

                {/* ── Profit Margin ── */}
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={15} className="text-violet-600" />
                            <div>
                                <p className="text-sm font-bold text-violet-800">Profit Margin</p>
                                <p className="text-xs text-violet-400 mt-0.5">Applied on base total</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={profitMarginPercent}
                                onChange={e => onProfitMarginChange && onProfitMarginChange(parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1.5 border border-violet-300 rounded-lg text-sm text-right font-bold focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                            />
                            <span className="text-violet-700 font-bold text-sm">%</span>
                        </div>
                    </div>
                    {profitAmount > 0 && (
                        <div className="flex justify-between mt-3 pt-2 border-t border-violet-200">
                            <span className="text-xs text-violet-600">Profit Amount ({profitMarginPercent}% of {fmtINR(grandTotal)})</span>
                            <span className="text-xs font-bold text-violet-800">+ {fmtINR(profitAmount)}</span>
                        </div>
                    )}
                </div>

                {/* ── Grand Total ── */}
                <div className="bg-linear-to-r from-emerald-600 to-emerald-700 rounded-xl p-4 mt-2">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-emerald-100 text-sm font-medium">Material Cost</span>
                        <span className="text-white text-sm font-semibold">{fmtINR(materialCost)}</span>
                    </div>
                    {mfgProcessCost > 0 && (
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-emerald-100 text-sm font-medium">Manufacturing Processes</span>
                            <span className="text-white text-sm font-semibold">{fmtINR(mfgProcessCost)}</span>
                        </div>
                    )}
                    {profitAmount > 0 && (
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-emerald-100 text-sm font-medium">Profit ({profitMarginPercent}%)</span>
                            <span className="text-white text-sm font-semibold">+ {fmtINR(profitAmount)}</span>
                        </div>
                    )}
                    <div className="border-t border-emerald-500 pt-3 flex justify-between items-center">
                        <span className="text-white font-bold text-base">FINAL PRICE</span>
                        <span className="text-white font-bold text-2xl">{fmtINR(finalPrice)}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default QuotationSummary;
