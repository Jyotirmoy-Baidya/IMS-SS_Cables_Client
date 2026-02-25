import { useState, useEffect } from 'react';
import { X, CheckCircle2, User, FileText, MapPin } from 'lucide-react';
import api from '../../api/axiosInstance';

const ConvertToWorkOrderModal = ({ quotation, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);
    const [allEmployees, setAllEmployees] = useState([]);
    const [allLocations, setAllLocations] = useState([]);
    const [processAssignments, setProcessAssignments] = useState([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchEmployeesAndInitialize = async () => {
            try {
                setLoading(true);

                // Fetch all active employees and locations in parallel
                const [empRes, locRes] = await Promise.all([
                    api.get('/user/get-all-users?role=employee&isActive=true'),
                    api.get('/location/get-all-locations?isActive=true'),
                ]);
                const employees = empRes.data || [];
                const locations = locRes.data || [];
                setAllEmployees(employees);
                setAllLocations(locations);

                // Extract unique processes from quotation
                const uniqueProcesses = extractUniqueProcesses(quotation);

                // Initialize process assignments
                const assignments = uniqueProcesses.map(process => {
                    // Find employees who have this process
                    const eligibleEmployees = employees.filter(emp =>
                        emp.processes?.some(p => (typeof p === 'object' ? p._id : p) === process._id)
                    );

                    return {
                        processId: process._id,
                        processName: process.name,
                        assignedEmployeeId: eligibleEmployees[0]?._id || '',
                        locationId: locations[0]?._id || '',
                        locationName: locations[0]?.name || '',
                        addReportAfter: false,
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
    }, [quotation]);

    const extractUniqueProcesses = (quotation) => {
        const processMap = new Map();

        // Extract from quoteProcesses (if it's an array)
        if (Array.isArray(quotation.quoteProcesses)) {
            quotation.quoteProcesses.forEach(qp => {
                if (qp.processId && qp.processName) {
                    processMap.set(
                        typeof qp.processId === 'object' ? qp.processId._id : qp.processId,
                        {
                            _id: typeof qp.processId === 'object' ? qp.processId._id : qp.processId,
                            name: qp.processName,
                        }
                    );
                }
            });
        }

        return Array.from(processMap.values());
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
                processAssignments: processAssignments.map(a => ({
                    processId: a.processId,
                    processName: a.processName,
                    assignedEmployeeId: a.assignedEmployeeId,
                    locationId: a.locationId,
                    locationName: a.locationName,
                    addReportAfter: a.addReportAfter,
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
                                                <p className="text-sm font-semibold text-gray-800 mb-2">
                                                    {assignment.processName}
                                                </p>

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
