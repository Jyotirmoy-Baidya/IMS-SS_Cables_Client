import { Trash2 } from 'lucide-react';

/**
 * ProcessEntryList - Component for displaying saved process entries
 *
 * @param {Array} entries - Array of process entry objects
 * @param {Boolean} loading - Loading state
 * @param {Function} onDelete - Callback when delete button is clicked
 */
const ProcessEntryList = ({ entries = [], loading = false, onDelete }) => {
    if (loading) {
        return (
            <div className="text-sm text-gray-500 text-center py-3">
                Loading processes...
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="text-sm text-gray-400 text-center py-3">
                No processes added yet. Click "Add Process" to begin.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {entries.map((entry, idx) => (
                <div
                    key={entry._id}
                    className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            {/* Process Name and Category */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-purple-700">
                                    #{idx + 1}
                                </span>
                                <span className="text-sm font-bold text-gray-800">
                                    {entry.processName}
                                </span>
                                {entry.category && (
                                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                        {entry.category}
                                    </span>
                                )}
                            </div>

                            {/* Process Cost */}
                            <div className="mt-1 text-xs text-gray-600">
                                Cost:{' '}
                                <span className="font-bold text-emerald-700">
                                    ₹{entry.processCost?.toFixed(2) || 0}
                                </span>
                            </div>

                            {/* Output Info */}
                            {entry.output?.outputType !== 'none' && (
                                <div className="mt-1 text-xs text-gray-600">
                                    Output:{' '}
                                    <span className="font-medium">
                                        {entry.output.calculatedItemName}
                                    </span>
                                    {entry.output.calculatedQuantity > 0 && (
                                        <span className="ml-1">
                                            ({entry.output.calculatedQuantity}{' '}
                                            {entry.output.unit})
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Notes */}
                            {entry.notes && (
                                <div className="mt-1 text-xs text-gray-500 italic">
                                    Note: {entry.notes}
                                </div>
                            )}

                            {/* Variables (if any) */}
                            {entry.variables && entry.variables.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {entry.variables.map((v, vIdx) => (
                                        <span
                                            key={vIdx}
                                            className="text-xs px-2 py-0.5 bg-white border border-purple-100 text-gray-600 rounded"
                                        >
                                            {v.name}: {v.value} {v.unit}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={() => onDelete && onDelete(entry._id)}
                            className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                            title="Delete process"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProcessEntryList;
