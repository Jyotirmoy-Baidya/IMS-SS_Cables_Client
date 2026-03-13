import { useState, useEffect } from 'react';
import { X, CheckCircle2, User, FileText, MapPin } from 'lucide-react';
import api from '../../api/axiosInstance';
import useQuotationProcessStore from '../../store/quotationProcessStore';
import useMaterialRequirementsStore from '../../store/materialRequirementsStore';

const ConvertToWorkOrderModal = ({ quotationId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);
    const [allLocations, setAllLocations] = useState([]);
    const [processAssignments, setProcessAssignments] = useState([]);
    const [materialRequirements, setMaterialRequirements] = useState([]);
    const [finalQuotePrice, setFinalQuotePrice] = useState(null);
    const [notes, setNotes] = useState('');
    const { calculateAllProcessInQuotation } = useQuotationProcessStore();
    const { calculateAll } = useMaterialRequirementsStore();

    useEffect(() => {
        const fetchEmployeesAndInitialize = async () => {
            try {
                setLoading(true);

                // Sync all processes from quotationId (cores, sheaths, and quote-level)
                const allProcessesCalc = await calculateAllProcessInQuotation(quotationId);

                // Calculate material requirements
                const materials = await calculateAll(quotationId);
                setMaterialRequirements(materials || []);

                // Fetch all active employees, locations, and final quote price in parallel
                const [empRes, locRes, quotePriceRes] = await Promise.all([
                    api.get('/user/get-all-users?role=employee&isActive=true'),
                    api.get('/location/get-all-locations?isActive=true'),
                    api.get(`/quote-price/quotation/${quotationId}`)
                ]);
                const employees = empRes.data || [];
                const locations = locRes.data || [];
                setAllLocations(locations);

                // Find the final quote price
                const finalPrice = (quotePriceRes.data || []).find(qp => qp.isFinal);
                setFinalQuotePrice(finalPrice || null);
                // Get unique processes from the store
                // const uniqueProcesses = getUniqueProcesses(allProcesses);

                // Initialize process assignments
                const assignments = allProcessesCalc.map((process, index) => {
                    // Find employees who have this process
                    const eligibleEmployees = employees.filter(emp =>
                        emp.processes?.some(p => (typeof p === 'object' ? p._id : p) === process.processId._id)
                    );

                    // Extract output configuration
                    const expectedOutput = process?.output || { outputType: 'none' };
                    return {
                        processId: process._id,
                        processName: process.processName,
                        category: process.category,
                        assignedEmployeeId: eligibleEmployees[0]?._id || '',
                        locationId: locations[0]?._id || '',
                        locationName: locations[0]?.name || '',
                        sequence: index, // Initialize with current index
                        addReportAfter: false,
                        cost: process.processCost || 0,
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
    }, [quotationId]);




    const handleAssignmentChange = (index, field, value) => {
        const updated = [...processAssignments];
        updated[index][field] = value;

        // If sequence changed, re-sort the array
        if (field === 'sequence') {
            updated.sort((a, b) => a.sequence - b.sequence);
        }

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
            console.log(quotationId)
            // Prepare payload
            const payload = {
                quoteId: quotationId,
                processAssignments: processAssignments.map(a => ({
                    processId: a.processId,
                    processName: a.processName,
                    category: a.category,
                    assignedEmployeeId: a.assignedEmployeeId,
                    locationId: a.locationId,
                    locationName: a.locationName,
                    sequence: a.sequence,
                    addReportAfter: a.addReportAfter,
                    processCost: a.cost || 0,
                    expectedOutput: a.expectedOutput
                })),
                materialRequirements: materialRequirements,
                processCosts: processAssignments.map(a => ({
                    processId: a.processId,
                    processName: a.processName,
                    cost: a.cost || 0
                })),
                finalQuotePriceId: finalQuotePrice?._id || null,
                notes,
            };

            console.log("word order payload", payload);

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
                            Quotation: <span className="font-semibold text-gray-700">{quotationId.quoteNumber}</span>
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
                                    No processes found in this quotationId.
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
                                            {/* Sequence Number Input */}
                                            <div className="flex flex-col items-center gap-1 pt-1">
                                                <label className="text-xs text-gray-500 font-medium">Seq</label>
                                                <input
                                                    type="number"
                                                    value={assignment.sequence}
                                                    onChange={e =>
                                                        handleAssignmentChange(idx, 'sequence', parseInt(e.target.value) || 0)
                                                    }
                                                    className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                    min="0"
                                                />
                                            </div>

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
                                                    <span className="ml-auto text-xs font-semibold text-emerald-600">
                                                        ₹{assignment.cost?.toFixed(2) || '0.00'}
                                                    </span>
                                                </div>

                                                {/* Expected Output Info */}
                                                {assignment.expectedOutput && assignment.expectedOutput.outputType !== 'none' && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2">
                                                        <p className="text-xs font-medium text-blue-700 mb-1">Expected Output:</p>
                                                        <div className="text-xs text-blue-600 space-y-0.5">
                                                            <p><span className="font-semibold">Item:</span> {assignment.expectedOutput.calculatedItemName || 'N/A'}</p>
                                                            <p><span className="font-semibold">Quantity:</span> {assignment.expectedOutput.calculatedQuantity || 0} {assignment.expectedOutput.unit || 'm'}</p>
                                                            {assignment.expectedOutput.calculatedSpecification && (
                                                                <p><span className="font-semibold">Spec:</span> {assignment.expectedOutput.calculatedSpecification}</p>
                                                            )}
                                                            <p><span className="font-semibold">Type:</span> <span className="capitalize">{assignment.expectedOutput.outputType}</span></p>
                                                        </div>
                                                    </div>
                                                )}

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

                    {/* Final Quote Price Details */}
                    {finalQuotePrice && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <FileText size={14} className="text-gray-500" />
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Final Quote Price (Version {finalQuotePrice.version})
                                </label>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Base Amount</p>
                                        <p className="font-semibold text-gray-800">₹{finalQuotePrice.quoteBaseAmount?.toFixed(2) || '0.00'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">After Profit</p>
                                        <p className="font-semibold text-gray-800">₹{finalQuotePrice.quoteAfterAddingProfit?.toFixed(2) || '0.00'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">GST ({finalQuotePrice.gstPercentage || 0}%)</p>
                                        <p className="font-semibold text-gray-800">₹{((finalQuotePrice.quotePriceAfterTax - finalQuotePrice.quoteAfterAddingProfit) || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-emerald-100 rounded-lg p-2">
                                        <p className="text-xs text-emerald-700 mb-1">Final Price (After Tax)</p>
                                        <p className="text-lg font-bold text-emerald-800">₹{finalQuotePrice.quotePriceAfterTax?.toFixed(2) || '0.00'}</p>
                                    </div>
                                </div>
                                {finalQuotePrice.notes && (
                                    <div className="mt-3 pt-3 border-t border-emerald-200">
                                        <p className="text-xs text-gray-500 mb-1">Notes:</p>
                                        <p className="text-xs text-gray-700">{finalQuotePrice.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
