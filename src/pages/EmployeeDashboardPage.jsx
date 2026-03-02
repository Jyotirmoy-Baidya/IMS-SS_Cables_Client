import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LogOut, Package, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
    TrendingUp, Upload, Activity
} from 'lucide-react';
import api from '../api/axiosInstance';

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    'in-progress': { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-700', icon: Activity },
    completed: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
};

const EmployeeDashboardPage = () => {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedWO, setExpandedWO] = useState(null);
    const [expandedProcess, setExpandedProcess] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Status update form
    const [statusForm, setStatusForm] = useState({
        status: '',
        progressPercentage: 0,
        notes: ''
    });
    console.log(employeeId);
    useEffect(() => {
        // Get employee from localStorage
        const employeeData = JSON.parse(localStorage.getItem('employee') || '{}');
        setEmployee(employeeData.data);
        console.log(employeeData);
        fetchWorkOrders();
    }, [employeeId]);

    const fetchWorkOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/employee/${employeeId}/work-orders`);
            setWorkOrders(response.data || []);
        } catch (err) {
            console.error('Error fetching work orders:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('employee');
        navigate('/employee/login');
    };

    const toggleWorkOrder = (woId) => {
        setExpandedWO(expandedWO === woId ? null : woId);
        setExpandedProcess(null);
    };

    const toggleProcess = (process) => {
        if (expandedProcess?._id === process._id) {
            setExpandedProcess(null);
        } else {
            setExpandedProcess(process);
            setStatusForm({
                status: process.status || 'pending',
                progressPercentage: process.tracking?.progressPercentage || 0,
                notes: ''
            });
        }
    };

    const handleUpdateStatus = async () => {
        if (!expandedProcess?.tracking) {
            alert('Process tracking not enabled for this process');
            return;
        }

        try {
            setUpdating(true);
            await api.patch(`/employee/tracking/${expandedProcess.tracking._id}/status`, {
                ...statusForm,
                employeeId
            });
            alert('Status updated successfully!');
            fetchWorkOrders();
            setExpandedProcess(null);
        } catch (err) {
            alert('Error updating status: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleUploadReport = async () => {
        if (!expandedProcess?.tracking) return;

        try {
            await api.post(`/employee/tracking/${expandedProcess.tracking._id}/upload-report`, {
                reportUrl: 'pending-upload', // Actual upload implementation later
                employeeId
            });
            alert('Report uploaded successfully! Waiting for admin approval.');
            fetchWorkOrders();
        } catch (err) {
            alert('Error uploading report: ' + err.message);
        }
    };

    if (loading || !employee?.employeeId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    console.log(employee);
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome, {employee?.name}!</h1>
                        <p className="text-blue-100 text-sm mt-1">Your assigned work orders and processes</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Total Work Orders</p>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{workOrders.length}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase">My Processes</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                            {workOrders.reduce((sum, wo) => sum + (wo.myProcesses?.length || 0), 0)}
                        </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Completed</p>
                        <p className="text-3xl font-bold text-emerald-600 mt-2">
                            {workOrders.reduce((sum, wo) =>
                                sum + (wo.myProcesses?.filter(p => p.status === 'completed').length || 0), 0
                            )}
                        </p>
                    </div>
                </div>

                {/* Work Orders List */}
                {workOrders.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                        <Package size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-400">No work orders assigned to you yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workOrders.map((wo) => (
                            <div key={wo._id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                                {/* Work Order Header */}
                                <div
                                    onClick={() => toggleWorkOrder(wo._id)}
                                    className="px-6 py-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition flex items-center justify-between"
                                >
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{wo.workOrderNumber}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Customer: {wo.customerId?.companyName} • Quote: {wo.quoteNumber}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            My Processes: {wo.myProcesses?.length || 0}
                                        </p>
                                    </div>
                                    {expandedWO === wo._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>

                                {/* Expanded Work Order - My Processes */}
                                {expandedWO === wo._id && (
                                    <div className="px-6 py-4 space-y-4">
                                        {wo.myProcesses?.map((process, idx) => {
                                            const StatusIcon = STATUS_CONFIG[process.status]?.icon || Clock;
                                            const cannotStart = !process.canStart;

                                            return (
                                                <div
                                                    key={process._id}
                                                    className={`border-2 rounded-lg overflow-hidden ${cannotStart ? 'border-red-200 bg-red-50' : 'border-gray-200'
                                                        }`}
                                                >
                                                    {/* Process Header */}
                                                    <div
                                                        onClick={() => toggleProcess(process)}
                                                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <h4 className="font-bold text-gray-800">{process.processName}</h4>
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[process.status]?.bg} ${STATUS_CONFIG[process.status]?.text} flex items-center gap-1`}>
                                                                        <StatusIcon size={12} />
                                                                        {STATUS_CONFIG[process.status]?.label}
                                                                    </span>
                                                                </div>

                                                                {/* Progress Bar */}
                                                                {process.tracking && (
                                                                    <div className="flex items-center gap-3 ml-11">
                                                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                            <div
                                                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                                                style={{ width: `${process.tracking.progressPercentage}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className="text-sm font-bold text-gray-600">
                                                                            {process.tracking.progressPercentage}%
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Previous Process Status */}
                                                                {process.previousProcess && (
                                                                    <div className="ml-11 mt-2 text-xs">
                                                                        <span className="text-gray-500">Previous: </span>
                                                                        <span className="font-medium text-gray-700">
                                                                            {process.previousProcess.processName}
                                                                        </span>
                                                                        <span className={`ml-2 px-2 py-0.5 rounded ${process.previousProcess.status === 'completed'
                                                                            ? 'bg-emerald-100 text-emerald-700'
                                                                            : 'bg-amber-100 text-amber-700'
                                                                            }`}>
                                                                            {process.previousProcess.status} - {process.previousProcess.progressPercentage}%
                                                                        </span>
                                                                        {process.previousProcess.requiresReport && (
                                                                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${process.previousProcess.reportReceived
                                                                                ? 'bg-green-100 text-green-700'
                                                                                : 'bg-red-100 text-red-700'
                                                                                }`}>
                                                                                Report: {process.previousProcess.reportReceived ? 'Received ✓' : 'Pending'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Block Reason */}
                                                                {cannotStart && (
                                                                    <div className="ml-11 mt-2 flex items-center gap-2 text-xs text-red-600">
                                                                        <AlertCircle size={14} />
                                                                        <span>{process.blockReason}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {expandedProcess?._id === process._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                        </div>
                                                    </div>

                                                    {/* Expanded Process Details */}
                                                    {expandedProcess?._id === process._id && process.tracking && (
                                                        <div className="px-4 py-4 bg-gray-50 border-t">
                                                            <div className="space-y-4">
                                                                {/* Status Update Form */}
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                                                                        <select
                                                                            value={statusForm.status}
                                                                            onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                                                                            disabled={cannotStart}
                                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                                        >
                                                                            <option value="pending">Pending</option>
                                                                            <option value="in-progress">In Progress</option>
                                                                            <option value="completed">Completed</option>
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                                            Progress: {statusForm.progressPercentage}%
                                                                        </label>
                                                                        <input
                                                                            type="range"
                                                                            min="0"
                                                                            max="100"
                                                                            value={statusForm.progressPercentage}
                                                                            onChange={(e) => setStatusForm({ ...statusForm, progressPercentage: parseInt(e.target.value) })}
                                                                            disabled={cannotStart}
                                                                            className="w-full"
                                                                        />
                                                                    </div>

                                                                    <div className="col-span-2">
                                                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                                                                        <textarea
                                                                            value={statusForm.notes}
                                                                            onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                                                                            rows={2}
                                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                                            placeholder="Add any notes..."
                                                                        ></textarea>
                                                                    </div>
                                                                </div>

                                                                {/* Action Buttons */}
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={handleUpdateStatus}
                                                                        disabled={updating || cannotStart}
                                                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold"
                                                                    >
                                                                        <TrendingUp size={16} />
                                                                        Update Status
                                                                    </button>

                                                                    {process.tracking.addReportAfter && (
                                                                        <button
                                                                            onClick={handleUploadReport}
                                                                            disabled={process.status !== 'completed' || process.tracking.reportUploaded}
                                                                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold"
                                                                        >
                                                                            <Upload size={16} />
                                                                            {process.tracking.reportUploaded ? 'Report Uploaded' : 'Upload Report'}
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Report Status */}
                                                                {process.tracking.addReportAfter && (
                                                                    <div className={`p-3 rounded-lg ${process.tracking.reportReceived
                                                                        ? 'bg-green-100 border border-green-200'
                                                                        : process.tracking.reportUploaded
                                                                            ? 'bg-amber-100 border border-amber-200'
                                                                            : 'bg-gray-100 border border-gray-200'
                                                                        }`}>
                                                                        <p className="text-xs font-semibold mb-1">
                                                                            Report Status:
                                                                        </p>
                                                                        <p className="text-sm">
                                                                            {process.tracking.reportReceived
                                                                                ? '✅ Report received and approved'
                                                                                : process.tracking.reportUploaded
                                                                                    ? '⏳ Awaiting admin approval'
                                                                                    : '📄 Report required after completion'}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* No Tracking Warning */}
                                                    {expandedProcess?._id === process._id && !process.tracking && (
                                                        <div className="px-4 py-4 bg-amber-50 border-t border-amber-200">
                                                            <div className="flex items-center gap-2 text-amber-800 text-sm">
                                                                <AlertCircle size={16} />
                                                                <span>Process tracking not enabled. Contact admin to enable tracking.</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeDashboardPage;
