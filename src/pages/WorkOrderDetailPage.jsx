import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Clock, CheckCircle2, Calendar, Package
} from 'lucide-react';
import api from '../api/axiosInstance';
import ProcessInWorkOrderList from '../components/workOrder/ProcessInWorkOrderList';

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

    const overallProgress = workOrder.processInWorkOrder?.length > 0
        ? workOrder.processInWorkOrder.reduce((sum, pwo) => sum + (pwo.processId?.progressPercentage || 0), 0) / workOrder.processInWorkOrder.length
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
                    <p className="text-2xl font-bold text-gray-800 mt-1">{workOrder.processInWorkOrder?.length || 0}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">
                        {workOrder.processInWorkOrder?.filter(pwo => pwo.processId?.status === 'completed').length || 0}
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
                <ProcessInWorkOrderList
                    workOrderId={workOrder._id}
                    onRefresh={fetchWorkOrder}
                />
            </div>

            {/* Allocated Materials Section */}
            {workOrder.allocatedMaterials && workOrder.allocatedMaterials.length > 0 && (
                <div className="mt-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-800">Allocated Materials</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Materials reserved for this work order
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Material</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lot Number</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Allocated</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Planned Usage</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Consumed</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {workOrder.allocatedMaterials.map((allocated, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <Package size={14} className="text-gray-400" />
                                                <span className="font-medium text-gray-800">
                                                    {allocated.materialName || 'Unknown Material'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded font-mono">
                                                {allocated.lotNumber || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="font-semibold text-gray-800">
                                                {allocated.allocatedWeight?.toFixed(2) || '0.00'} kg
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="font-semibold text-blue-700">
                                                {(allocated.plannedWeightToUse || allocated.allocatedWeight)?.toFixed(2) || '0.00'} kg
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="font-semibold text-green-700">
                                                {allocated.consumedQuantity?.weight?.toFixed(2) || '0.00'} kg
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center text-gray-600">
                                            <div className="flex items-center justify-center gap-1">
                                                <Calendar size={12} className="text-gray-400" />
                                                <span className="text-xs">
                                                    {allocated.allocatedAt
                                                        ? new Date(allocated.allocatedAt).toLocaleDateString('en-IN')
                                                        : 'N/A'
                                                    }
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            {allocated.isConsumed ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full font-medium">
                                                    <CheckCircle2 size={12} />
                                                    Consumed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
                                                    <Clock size={12} />
                                                    Allocated
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
