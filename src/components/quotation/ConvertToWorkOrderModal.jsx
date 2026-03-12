import { useState, useEffect } from 'react';
import { X, CheckCircle2, User, FileText, MapPin } from 'lucide-react';
import api from '../../api/axiosInstance';
import useQuotationProcessStore from '../../store/quotationProcessStore';
import useMaterialRequirementsStore from '../../store/materialRequirementsStore';

const ConvertToWorkOrderModal = ({ quotation, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);
    const [allEmployees, setAllEmployees] = useState([]);
    const [allLocations, setAllLocations] = useState([]);
    const [processAssignments, setProcessAssignments] = useState([]);
    const [materialRequirements, setMaterialRequirements] = useState([]);
    const [notes, setNotes] = useState('');
    const { allProcesses, calculateAllProcessInQuotation } = useQuotationProcessStore();
    const { calculateAll } = useMaterialRequirementsStore();

    useEffect(() => {
        const fetchEmployeesAndInitialize = async () => {
            try {
                setLoading(true);

                // Sync all processes from quotation (cores, sheaths, and quote-level)
                calculateAllProcessInQuotation({
                    cores: quotation.cores || [],
                    sheathGroups: quotation.sheathGroups || [],
                    quoteProcesses: quotation.quoteProcesses || []
                });

                // Calculate material requirements
                const materials = await calculateAll(quotation);
                setMaterialRequirements(materials || []);

                // Fetch all active employees and locations in parallel
                const [empRes, locRes] = await Promise.all([
                    api.get('/user/get-all-users?role=employee&isActive=true'),
                    api.get('/location/get-all-locations?isActive=true'),
                ]);
                const employees = empRes.data || [];
                const locations = locRes.data || [];
                setAllEmployees(employees);
                setAllLocations(locations);
                console.log(allProcesses);
                // Get unique processes from the store
                const uniqueProcesses = getUniqueProcesses(allProcesses);

                // Initialize process assignments
                const assignments = uniqueProcesses.map(process => {
                    // Find employees who have this process
                    const eligibleEmployees = employees.filter(emp =>
                        emp.processes?.some(p => (typeof p === 'object' ? p._id : p) === process._id)
                    );

                    // Get full process data from allProcesses - match by processId AND context
                    const processData = allProcesses.find(p => {
                        if (p.processId !== process._id) return false;

                        // If process has context, match it exactly
                        if (process.context && p.context) {
                            return p.context.type === process.context.type &&
                                (p.context.coreIndex === process.context.coreIndex ||
                                    p.context.sheathIndex === process.context.sheathIndex);
                        }

                        // For quote-level processes without context
                        return !process.context && !p.context;
                    });

                    console.log('Process assignment:', {
                        processName: process.name,
                        context: process.context,
                        foundData: !!processData,
                        output: processData?.output,
                        variables: processData?.variables
                    });

                    // Get process cost from quotation
                    const processCost = getProcessCost(process, quotation);

                    // Extract output configuration
                    const expectedOutput = processData?.output || { outputType: 'none' };

                    return {
                        processId: process._id,
                        processName: process.name,
                        category: process.category,
                        context: process.context,
                        assignedEmployeeId: eligibleEmployees[0]?._id || '',
                        locationId: locations[0]?._id || '',
                        locationName: locations[0]?.name || '',
                        addReportAfter: false,
                        cost: processCost,
                        costFormula: processData?.formula || '',
                        variables: processData?.variables || [],
                        expectedOutput,
                        eligibleEmployees,
                    };
                });

                setProcessAssignments(assignments);
            } catch (err) {
                console.error('Failed to fetch employees:', err);
                alert('Failed to load employees: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployeesAndInitialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quotation]);

    const getUniqueProcesses = (processes) => {
        // Keep processes with unique processId + context combination
        // This is important because the same process can be used multiple times
        // with different variables (e.g., for different cores)
        const processMap = new Map();

        processes.forEach(proc => {
            if (proc.processId && proc.processName) {
                // Create unique key combining processId and context
                const contextKey = proc.context ?
                    `${proc.processId}-${proc.context.type}-${proc.context.coreIndex || proc.context.sheathIndex || 0}` :
                    proc.processId;

                processMap.set(contextKey, {
                    _id: proc.processId,
                    name: proc.processName,
                    category: proc.category,
                    context: proc.context,
                    uniqueKey: contextKey // Store for later matching
                });
            }
        });

        return Array.from(processMap.values());
    };

    const evalFormula = (formula, variables) => {
        try {
            const scope = {};
            (variables || []).forEach(v => { scope[v.name] = parseFloat(v.value) || 0; });
            if (!formula || !formula.trim()) return 0;
            const fn = new Function(...Object.keys(scope), `return (${formula})`);
            const result = fn(...Object.values(scope));
            return typeof result === 'number' && isFinite(result) ? result : 0;
        } catch { return 0; }
    };

    const interpolateTemplate = (template, variables) => {
        if (!template) return '';
        try {
            const scope = {};
            (variables || []).forEach(v => { scope[v.name] = parseFloat(v.value) || 0; });
            return template.replace(/\$\{(\w+)\}/g, (match, varName) => {
                return scope[varName] !== undefined ? scope[varName] : match;
            });
        } catch {
            return template;
        }
    };

    const getProcessCost = (process, quotation) => {
        // Find process in allProcesses with matching processId and context
        const processData = allProcesses.find(p => {
            if (p.processId !== process._id) return false;

            // If process has context, match it exactly
            if (process.context && p.context) {
                return p.context.type === process.context.type &&
                    (p.context.coreIndex === process.context.coreIndex ||
                        p.context.sheathIndex === process.context.sheathIndex);
            }

            // For quote-level processes without context
            return !process.context && !p.context;
        });

        if (!processData || !processData.formula) return 0;

        return evalFormula(processData.formula, processData.variables || []);
    };

    const handleAssignmentChange = (index, field, value) => {
        const updated = [...processAssignments];
        updated[index][field] = value;
        setProcessAssignments(updated);
    };

    const handleConvert = async () => {
        try {
            // Validate all assignments
            const invalid = processAssignments.filter(a => !a.assignedEmployeeId);
            if (invalid.length > 0) {
                alert('Please assign an employee to all processes before converting.');
                return;
            }

            setConverting(true);

            // Prepare payload
            const payload = {
                quoteId: quotation._id,
                processAssignments: processAssignments.map(a => {
                    const expectedOutput = a.expectedOutput || { outputType: 'none' };

                    const calculatedExpectedOutput = {
                        outputType: expectedOutput.outputType || 'none',
                        expectedQuantity: expectedOutput.quantityFormula
                            ? evalFormula(expectedOutput.quantityFormula, a.variables || [])
                            : 0,
                        expectedItemName: expectedOutput.itemNameTemplate
                            ? interpolateTemplate(expectedOutput.itemNameTemplate, a.variables || [])
                            : '',
                        expectedSpecification: expectedOutput.specificationTemplate
                            ? interpolateTemplate(expectedOutput.specificationTemplate, a.variables || [])
                            : '',
                        unit: expectedOutput.unit || 'm',
                        quantityFormula: expectedOutput.quantityFormula || '',
                        itemNameTemplate: expectedOutput.itemNameTemplate || '',
                        specificationTemplate: expectedOutput.specificationTemplate || ''
                    };

                    console.log('Expected output calculation:', {
                        processName: a.processName,
                        context: a.context,
                        outputType: expectedOutput.outputType,
                        quantityFormula: expectedOutput.quantityFormula,
                        variables: a.variables,
                        calculatedQuantity: calculatedExpectedOutput.expectedQuantity,
                        calculatedItemName: calculatedExpectedOutput.expectedItemName,
                        calculatedSpecification: calculatedExpectedOutput.expectedSpecification
                    });

                    return {
                        processId: a.processId,
                        processName: a.processName,
                        processCategory: a.category || '',
                        assignedEmployeeId: a.assignedEmployeeId,
                        locationId: a.locationId,
                        locationName: a.locationName,
                        addReportAfter: a.addReportAfter,

                        // Cost information
                        processCost: a.cost || 0,
                        costFormula: a.costFormula || '',

                        // Variables snapshot
                        variables: (a.variables || []).map(v => ({
                            name: v.name,
                            label: v.label,
                            value: parseFloat(v.value) || 0,
                            unit: v.unit || '',
                            source: v.source || 'manual'
                        })),

                        // Expected output
                        expectedOutput: calculatedExpectedOutput
                    };
                }),
                materialRequirements: materialRequirements.map(req => ({
                    materialId: req.materialId,
                    materialName: req.materialName,
                    category: req.category,
                    type: req.type,
                    totalWeight: req.totalWeight,
                    pricePerKg: req.pricePerKg || 0,
                    totalCost: req.totalCost || 0,
                    usedIn: req.usedIn
                })),
                processCosts: processAssignments.map(a => ({
                    processId: a.processId,
                    processName: a.processName,
                    cost: a.cost || 0
                })),
                notes,
            };

            await api.post('/work-order/create-work-order', payload);
            onSuccess?.();
            onClose();
        } catch (err) {
            alert('Failed to convert to work order: ' + err.message);
        } finally {
            setConverting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl p-8">
                    <p className="text-gray-500 text-sm">Loading employees...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Convert to Work Order</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Quotation: <span className="font-semibold text-gray-700">{quotation.quoteNumber}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-5">

                    {/* Process Assignments */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <User size={14} className="text-gray-500" />
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Assign Employees to Processes
                            </label>
                        </div>

                        {processAssignments.length === 0 ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-amber-700">
                                    No processes found in this quotation.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {processAssignments.map((assignment, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Process Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {assignment.processName}
                                                    </p>
                                                    {assignment.context && (
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${assignment.context.type === 'core' ? 'bg-purple-100 text-purple-700' :
                                                            assignment.context.type === 'sheath' ? 'bg-teal-100 text-teal-700' :
                                                                'bg-indigo-100 text-indigo-700'
                                                            }`}>
                                                            {assignment.context.label}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Employee Dropdown */}
                                                {assignment.eligibleEmployees.length === 0 ? (
                                                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
                                                        <p className="text-xs text-red-600 font-medium">
                                                            No employees assigned to this process
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="mb-2">
                                                        <label className="block text-xs text-gray-500 mb-1">
                                                            Assign Employee
                                                        </label>
                                                        <select
                                                            value={assignment.assignedEmployeeId}
                                                            onChange={e =>
                                                                handleAssignmentChange(idx, 'assignedEmployeeId', e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                        >
                                                            {assignment.eligibleEmployees.map(emp => (
                                                                <option key={emp._id} value={emp._id}>
                                                                    {emp.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {/* Location Dropdown */}
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">
                                                        <MapPin size={10} className="inline mr-1" />
                                                        Location
                                                    </label>
                                                    {allLocations.length === 0 ? (
                                                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                                            <p className="text-xs text-amber-600">No locations available</p>
                                                        </div>
                                                    ) : (
                                                        <select
                                                            value={assignment.locationId}
                                                            onChange={e => {
                                                                const loc = allLocations.find(l => l._id === e.target.value);
                                                                handleAssignmentChange(idx, 'locationId', e.target.value);
                                                                handleAssignmentChange(idx, 'locationName', loc?.name || '');
                                                            }}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                        >
                                                            {allLocations.map(loc => (
                                                                <option key={loc._id} value={loc._id}>
                                                                    {loc.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Add Report Checkbox */}
                                            <div className="flex items-center gap-2 pt-1">
                                                <input
                                                    type="checkbox"
                                                    id={`report-${idx}`}
                                                    checked={assignment.addReportAfter}
                                                    onChange={e =>
                                                        handleAssignmentChange(idx, 'addReportAfter', e.target.checked)
                                                    }
                                                    className="w-4 h-4 rounded border-gray-300"
                                                />
                                                <label
                                                    htmlFor={`report-${idx}`}
                                                    className="text-xs text-gray-600 whitespace-nowrap cursor-pointer"
                                                >
                                                    Add report after
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <FileText size={14} className="text-gray-500" />
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Notes (Optional)
                            </label>
                        </div>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Add any notes or instructions for this work order..."
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConvert}
                        disabled={converting || processAssignments.some(a => !a.assignedEmployeeId)}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CheckCircle2 size={16} />
                        {converting ? 'Converting...' : 'Convert to Work Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConvertToWorkOrderModal;
