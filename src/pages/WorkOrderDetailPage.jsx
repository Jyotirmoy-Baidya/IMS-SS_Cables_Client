import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, MapPin, Clock, CheckCircle2, ChevronDown, ChevronUp,
    Calendar, Package, AlertCircle
} from 'lucide-react';
import api from '../api/axiosInstance';

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700' },
    'in-progress': { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-700' },
    completed: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

const WorkOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [workOrder, setWorkOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedProcess, setExpandedProcess] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Process update form
    const [processForm, setProcessForm] = useState({
        status: '',
        producedQuantity: '',
        producedSpec: '',
        storageLocation: '',
        progressPercentage: 0,
        notes: '',
    });

    const fetchWorkOrder = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/work-order/get-work-order/${id}`);
            setWorkOrder(res.data || null);
        } catch (err) {
            console.error('Failed to fetch work order:', err);
            alert('Failed to load work order: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkOrder();
    }, [id]);

    const handleExpandProcess = (processAssignment) => {
        if (expandedProcess?._id === processAssignment._id) {
            setExpandedProcess(null);
        } else {
            setExpandedProcess(processAssignment);
            setProcessForm({
                status: processAssignment.status || 'pending',
                producedQuantity: processAssignment.producedQuantity || '',
                producedSpec: processAssignment.producedSpec || '',
                storageLocation: processAssignment.storageLocation || '',
                progressPercentage: processAssignment.progressPercentage || 0,
                notes: processAssignment.notes || '',
            });
        }
    };

    const handleUpdateProcess = async (processAssignmentId) => {
        try {
            setUpdating(true);

            // Find the process assignment in the work order
            const processIdx = workOrder.processAssignments.findIndex(
                pa => pa._id === processAssignmentId
            );
            if (processIdx === -1) {
                alert('Process assignment not found');
                return;
            }

            // Update the process assignment
            const updatedAssignments = [...workOrder.processAssignments];
            updatedAssignments[processIdx] = {
                ...updatedAssignments[processIdx],
                ...processForm,
                completedAt: processForm.status === 'completed' ? new Date() : updatedAssignments[processIdx].completedAt,
                startedAt: processForm.status === 'in-progress' && !updatedAssignments[processIdx].startedAt
                    ? new Date()
                    : updatedAssignments[processIdx].startedAt,
            };

            // Calculate overall work order status
            const allCompleted = updatedAssignments.every(pa => pa.status === 'completed');
            const anyInProgress = updatedAssignments.some(pa => pa.status === 'in-progress');
            const woStatus = allCompleted ? 'completed' : anyInProgress ? 'in-progress' : 'pending';

            await api.put(`/work-order/update-work-order/${id}`, {
                processAssignments: updatedAssignments,
                status: woStatus,
            });

            alert('Process updated successfully!');
            fetchWorkOrder();
            setExpandedProcess(null);
        } catch (err) {
            alert('Failed to update process: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                Loading work order details…
            </div>
        );
    }

    if (!workOrder) {
        return (
            <div className="p-6">
                <div className="text-center text-gray-400">Work order not found</div>
            </div>
        );
    }

    const overallProgress = workOrder.processAssignments.length > 0
        ? workOrder.processAssignments.reduce((sum, pa) => sum + (pa.progressPercentage || 0), 0) / workOrder.processAssignments.length
        : 0;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/work-orders')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-3"
                >
                    <ArrowLeft size={16} />
                    Back to Work Orders
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">
                            {workOrder.workOrderNumber}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Quote: {workOrder.quoteNumber} • Customer: {workOrder.customerId?.companyName}
                        </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${STATUS_CONFIG[workOrder.status]?.bg} ${STATUS_CONFIG[workOrder.status]?.text}`}>
                        {STATUS_CONFIG[workOrder.status]?.label}
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cable Length</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{workOrder.cableLength?.toLocaleString()} m</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Processes</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{workOrder.processAssignments?.length || 0}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">
                        {workOrder.processAssignments?.filter(pa => pa.status === 'completed').length || 0}
                    </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Overall Progress</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{Math.round(overallProgress)}%</p>
                </div>
            </div>

            {/* Process List */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Process Tracking</h2>
                </div>

                <div className="divide-y divide-gray-100">
                    {workOrder.processAssignments?.map((pa, idx) => (
                        <div key={pa._id} className="border-b border-gray-100 last:border-b-0">
                            {/* Process Header - Clickable */}
                            <div
                                onClick={() => handleExpandProcess(pa)}
                                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Process Number */}
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold">
                                            {idx + 1}
                                        </div>

                                        {/* Process Info */}
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-800 mb-1">{pa.processName}</div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <User size={12} />
                                                    {pa.assignedEmployeeId?.name || '—'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={12} />
                                                    {pa.locationName || '—'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-32">
                                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                                <span>Progress</span>
                                                <span className="font-semibold">{pa.progressPercentage || 0}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all"
                                                    style={{ width: `${pa.progressPercentage || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[pa.status]?.bg} ${STATUS_CONFIG[pa.status]?.text}`}>
                                            {STATUS_CONFIG[pa.status]?.label}
                                        </div>
                                    </div>

                                    {/* Expand Icon */}
                                    <div className="ml-4">
                                        {expandedProcess?._id === pa._id ? (
                                            <ChevronUp size={18} className="text-gray-400" />
                                        ) : (
                                            <ChevronDown size={18} className="text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Process Details */}
                            {expandedProcess?._id === pa._id && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Status */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Status
                                            </label>
                                            <select
                                                value={processForm.status}
                                                onChange={e => setProcessForm(prev => ({ ...prev, status: e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>

                                        {/* Progress Percentage */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Progress %
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={processForm.progressPercentage}
                                                onChange={e => setProcessForm(prev => ({ ...prev, progressPercentage: Number(e.target.value) }))}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            />
                                        </div>

                                        {/* Produced Quantity */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                <Package size={11} className="inline mr-1" />
                                                Produced Quantity (m)
                                            </label>
                                            <input
                                                type="number"
                                                value={processForm.producedQuantity}
                                                onChange={e => setProcessForm(prev => ({ ...prev, producedQuantity: e.target.value }))}
                                                placeholder="e.g., 100"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            />
                                        </div>

                                        {/* Produced Spec */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Specification
                                            </label>
                                            <input
                                                type="text"
                                                value={processForm.producedSpec}
                                                onChange={e => setProcessForm(prev => ({ ...prev, producedSpec: e.target.value }))}
                                                placeholder="e.g., 0.5sq mm"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            />
                                        </div>

                                        {/* Storage Location */}
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                <MapPin size={11} className="inline mr-1" />
                                                Storage Location
                                            </label>
                                            <input
                                                type="text"
                                                value={processForm.storageLocation}
                                                onChange={e => setProcessForm(prev => ({ ...prev, storageLocation: e.target.value }))}
                                                placeholder="e.g., bobbin count 10 in shelf 2"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            />
                                        </div>

                                        {/* Notes */}
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Notes
                                            </label>
                                            <textarea
                                                value={processForm.notes}
                                                onChange={e => setProcessForm(prev => ({ ...prev, notes: e.target.value }))}
                                                placeholder="Additional notes or observations..."
                                                rows={2}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Update Button */}
                                    <div className="mt-4 flex justify-end gap-2">
                                        <button
                                            onClick={() => setExpandedProcess(null)}
                                            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleUpdateProcess(pa._id)}
                                            disabled={updating}
                                            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {updating ? 'Updating...' : 'Update Process'}
                                        </button>
                                    </div>

                                    {/* Show existing intermediate product details if any */}
                                    {pa.producedQuantity > 0 && (
                                        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                                                Current Intermediate Product
                                            </p>
                                            <div className="text-sm text-emerald-800">
                                                <p><strong>{pa.producedQuantity}m</strong> {pa.producedSpec}</p>
                                                {pa.storageLocation && (
                                                    <p className="text-xs text-emerald-600 mt-1">
                                                        Stored at: {pa.storageLocation}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Notes Section */}
            {workOrder.notes && (
                <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Work Order Notes</p>
                    <p className="text-sm text-gray-700">{workOrder.notes}</p>
                </div>
            )}
        </div>
    );
};

export default WorkOrderDetailPage;
