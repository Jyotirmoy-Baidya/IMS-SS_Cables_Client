import { useState, useEffect } from 'react';
import { Calculator, Save, X, Zap } from 'lucide-react';
import api from '../../../api/axiosInstance';

/**
 * ProcessEntryEditor - Component for adding/editing process entries
 * Handles variable mapping, formula calculation, and saving to backend
 *
 * @param {String} parentId - ID of parent (core/sheath/quotation)
 * @param {String} parentType - Type of parent: 'core' | 'sheath' | 'quotation'
 * @param {Object} context - Available variables from parent (e.g., {wireCount: 16, thickness: 1.2})
 * @param {Function} onSave - Callback after successful save
 * @param {Function} onCancel - Callback to close the editor
 */
const ProcessEntryEditor = ({ parentId, parentType, context = {}, onSave, onCancel }) => {
    // Process master list
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(false);

    // Selected process and entry state
    const [selectedProcessId, setSelectedProcessId] = useState('');
    const [selectedProcess, setSelectedProcess] = useState(null);

    // Process entry state (mirrors backend ProcessEntrySchema)
    const [processEntry, setProcessEntry] = useState({
        processId: '',
        processName: '',
        category: '',
        processCost: 0,
        output: {
            outputType: 'none',
            calculatedQuantity: 0,
            calculatedItemName: '',
            calculatedSpecification: '',
            unit: 'm'
        },
        notes: ''
    });

    // Variables with values (for display and editing)
    const [variables, setVariables] = useState([]);

    // Fetch process master list on mount
    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                setLoading(true);
                const response = await api.get('/process/get-all-processes');
                setProcesses(response.data || []);
            } catch (error) {
                console.error('Error fetching processes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProcesses();
    }, []);

    // When process is selected, initialize variables from context
    const handleProcessSelect = async (processId) => {
        if (!processId) {
            setSelectedProcess(null);
            setSelectedProcessId('');
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/process/get-one-process/${processId}`);
            const process = response.data;

            setSelectedProcess(process);
            setSelectedProcessId(processId);

            // Initialize process entry
            setProcessEntry({
                processId: process._id,
                processName: process.name,
                category: process.category || '',
                processCost: 0,
                output: {
                    outputType: process.output?.outputType || 'none',
                    calculatedQuantity: 0,
                    calculatedItemName: '',
                    calculatedSpecification: '',
                    unit: process.output?.unit || 'm'
                },
                notes: ''
            });

            console.log(context);
            // Map variables from process master, auto-fill from context
            const mappedVariables = (process.variables || []).map(v => {
                const contextValue = context[v.source];
                console.log(contextValue)
                return {
                    name: v.name,
                    value: contextValue !== undefined ? contextValue : v.defaultValue,
                    unit: v.unit || '',
                    fromContext: contextValue !== undefined
                };
            });

            setVariables(mappedVariables);
        } catch (error) {
            console.error('Error fetching process details:', error);
        } finally {
            setLoading(false);
        }
    };

    // Update variable value
    const updateVariable = (varName, newValue) => {
        setVariables(prev =>
            prev.map(v =>
                v.name === varName ? { ...v, value: newValue, fromContext: false } : v
            )
        );
    };

    // Evaluate formula with current variables
    const evalFormula = (formula) => {
        if (!formula) return 0;

        try {
            let expression = formula;
            variables.forEach(v => {
                const regex = new RegExp(`\\b${v.name}\\b`, 'g');
                expression = expression.replace(regex, v.value || 0);
            });

            console.log(expression);

            // Evaluate safely
            const result = Function('"use strict"; return (' + expression + ')')();
            return parseFloat(result) || 0;
        } catch (error) {
            console.error('Formula evaluation error:', error);
            return 0;
        }
    };

    // Interpolate template with current variables
    const interpolateTemplate = (template) => {
        if (!template) return '';

        let result = template;
        console.log(variables);
        variables.forEach(v => {
            const regex = new RegExp(`{{${v.name}}}`, 'g');
            result = result.replace(regex, v.value || '');
        });
        return result;
    };

    // Calculate all outputs and cost
    const handleCalculate = () => {
        if (!selectedProcess) return;

        // Calculate process cost
        const calculatedCost = selectedProcess.formula
            ? evalFormula(selectedProcess.formula)
            : 0;

        // Calculate output values
        let calculatedOutput = { ...processEntry.output };

        if (selectedProcess.output && selectedProcess.output.outputType !== 'none') {
            calculatedOutput.calculatedQuantity = selectedProcess.output.quantityFormula
                ? evalFormula(selectedProcess.output.quantityFormula)
                : 0;
            calculatedOutput.calculatedItemName = selectedProcess.output.itemNameTemplate
                ? interpolateTemplate(selectedProcess.output.itemNameTemplate)
                : '';
            calculatedOutput.calculatedSpecification = selectedProcess.output.specificationTemplate
                ? interpolateTemplate(selectedProcess.output.specificationTemplate)
                : '';
        }

        setProcessEntry(prev => ({
            ...prev,
            processCost: calculatedCost,
            output: calculatedOutput
        }));
    };

    // Save process entry to backend
    const handleSave = async () => {
        if (!selectedProcess || !parentId) return;

        try {
            setLoading(true);

            // Determine API endpoint based on parent type
            const endpoints = {
                core: `/process-entry/add-to-core/${parentId}`,
                sheath: `/process-entry/add-to-sheath/${parentId}`,
                quotation: `/process-entry/add-to-quote/${parentId}`
            };

            const endpoint = endpoints[parentType];
            if (!endpoint) {
                throw new Error(`Invalid parent type: ${parentType}`);
            }

            // Prepare data (don't send variables array if empty)
            const dataToSend = {
                ...processEntry,
                variables: variables.length > 0 ? variables.map(v => ({
                    name: v.name,
                    value: v.value,
                    unit: v.unit
                })) : []
            };

            const response = await api.post(endpoint, dataToSend);

            if (response.success) {
                onSave && onSave(response.data);
            }
        } catch (error) {
            console.error('Error saving process entry:', error);
            alert(error.message || 'Failed to save process entry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border-2 border-indigo-200 rounded-xl p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">Add Process Entry</h3>
                <button
                    onClick={onCancel}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Process Selection */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Select Process
                </label>
                <select
                    value={selectedProcessId}
                    onChange={e => handleProcessSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                >
                    <option value="">— Select a Process —</option>
                    {processes.map(process => (
                        <option key={process._id} value={process._id}>
                            {process.name} {process.category && `(${process.category})`}
                        </option>
                    ))}
                </select>
            </div>

            {/* Variables Section */}
            {selectedProcess && variables.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" />
                        <h4 className="text-sm font-bold text-gray-700">Variables</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {variables.map(v => (
                            <div key={v.name} className="space-y-1">
                                <label className="block text-xs font-medium text-gray-600">
                                    {v.name}
                                    {v.fromContext && (
                                        <span className="ml-1.5 text-xs text-emerald-600">(from context)</span>
                                    )}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        step="any"
                                        value={v.value}
                                        onChange={e => updateVariable(v.name, parseFloat(e.target.value) || 0)}
                                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    {v.unit && (
                                        <span className="text-xs text-gray-500 self-center">{v.unit}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Calculate Button */}
                    <button
                        onClick={handleCalculate}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 font-medium transition-all"
                    >
                        <Calculator size={16} />
                        Calculate Outputs
                    </button>
                </div>
            )}

            {/* Output Section */}
            {selectedProcess && processEntry.output.outputType !== 'none' && (
                <div className="space-y-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <h4 className="text-sm font-bold text-indigo-800">Process Output</h4>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Quantity
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={processEntry.output.calculatedQuantity}
                                onChange={e => setProcessEntry(prev => ({
                                    ...prev,
                                    output: { ...prev.output, calculatedQuantity: parseFloat(e.target.value) || 0 }
                                }))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Unit
                            </label>
                            <span className="block px-2 py-1.5 text-sm text-gray-700">
                                {processEntry.output.unit}
                            </span>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Item Name
                            </label>
                            <input
                                type="text"
                                value={processEntry.output.calculatedItemName}
                                onChange={e => setProcessEntry(prev => ({
                                    ...prev,
                                    output: { ...prev.output, calculatedItemName: e.target.value }
                                }))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Specification
                            </label>
                            <input
                                type="text"
                                value={processEntry.output.calculatedSpecification}
                                onChange={e => setProcessEntry(prev => ({
                                    ...prev,
                                    output: { ...prev.output, calculatedSpecification: e.target.value }
                                }))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Cost Section */}
            {selectedProcess && (
                <div className="space-y-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">

                    <div>
                        <p>{selectedProcess.formula}</p>
                    </div>
                    <h4 className="text-sm font-bold text-emerald-800">Process Cost</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">₹</span>
                        <input
                            type="number"
                            step="any"
                            value={processEntry.processCost}
                            onChange={e => setProcessEntry(prev => ({
                                ...prev,
                                processCost: parseFloat(e.target.value) || 0
                            }))}
                            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Notes */}
            {selectedProcess && (
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Notes (optional)
                    </label>
                    <textarea
                        value={processEntry.notes}
                        onChange={e => setProcessEntry(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg resize-none"
                        placeholder="Add any notes about this process..."
                    />
                </div>
            )}

            {/* Action Buttons */}
            {selectedProcess && (
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !selectedProcess}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} />
                        {loading ? 'Saving...' : 'Save Process'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProcessEntryEditor;
