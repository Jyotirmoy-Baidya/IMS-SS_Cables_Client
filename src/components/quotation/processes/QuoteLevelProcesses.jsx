import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import ProcessSelector from './ProcessSelector.jsx';

/**
 * Component for managing cable-level processes (quoteProcesses)
 * These are processes that apply to the entire cable, not specific cores/sheaths
 */
const QuoteLevelProcesses = ({
    quoteProcesses = [],
    onAdd,
    onRemove,
    onUpdateVariable,
    processMasterList = [],
    quoteContext = {}
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!isExpanded) {
        return (
            <div className="bg-white rounded-lg border">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold">Cable-Level Processes</h3>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                            {quoteProcesses.length} process{quoteProcesses.length !== 1 ? 'es' : ''}
                        </span>
                    </div>
                    <ChevronDown size={20} className="text-gray-400" />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border">
            {/* Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold">Cable-Level Processes</h3>
                    <span className="text-xs text-gray-500">
                        Processes that apply to the entire cable (not specific to cores/sheaths)
                    </span>
                </div>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <ChevronUp size={20} />
                </button>
            </div>

            {/* Process Selector */}
            <div className="p-6">
                {quoteProcesses.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        <p className="mb-3">No cable-level processes added yet.</p>
                        <p className="text-xs">
                            These are processes like final testing, packaging, or cable-level assembly
                            that aren't specific to individual cores or sheaths.
                        </p>
                    </div>
                ) : null}

                <ProcessSelector
                    processes={quoteProcesses}
                    onAdd={onAdd}
                    onRemove={onRemove}
                    onUpdateVariable={onUpdateVariable}
                    processMasterList={processMasterList}
                    quoteContext={quoteContext}
                    title=""
                    compact={false}
                />
            </div>
        </div>
    );
};

export default QuoteLevelProcesses;
