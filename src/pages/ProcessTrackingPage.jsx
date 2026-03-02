import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle, Clock, Package, ArrowRight } from 'lucide-react';
import api from '../api/axiosInstance';

const ProcessTrackingPage = () => {
    const navigate = useNavigate();
    const [trackings, setTrackings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        workOrderId: ''
    });

    useEffect(() => {
        fetchProcessTrackings();
    }, [filters]);

    const fetchProcessTrackings = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.status) params.status = filters.status;
            if (filters.workOrderId) params.workOrderId = filters.workOrderId;

            const response = await api.get('/process-tracking', { params });
            setTrackings(response.data || []);
        } catch (error) {
            console.error('Error fetching process trackings:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending': { color: 'bg-gray-100 text-gray-700', icon: Clock },
            'in-progress': { color: 'bg-blue-100 text-blue-700', icon: Play },
            'completed': { color: 'bg-green-100 text-green-700', icon: CheckCircle },
            'on-hold': { color: 'bg-yellow-100 text-yellow-700', icon: Clock }
        };

        const config = statusConfig[status] || statusConfig['pending'];
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${config.color}`}>
                <Icon size={12} />
                {status.replace('-', ' ').toUpperCase()}
            </span>
        );
    };

    const getProgressBarColor = (percentage) => {
        if (percentage === 0) return 'bg-gray-200';
        if (percentage < 50) return 'bg-red-400';
        if (percentage < 80) return 'bg-yellow-400';
        return 'bg-green-400';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Process Tracking</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor and manage work order process execution</p>
                </div>

                {/* Filters */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="on-hold">On Hold</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Process Tracking List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : trackings.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                        <Package size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-400">No process tracking records found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {trackings.map((tracking) => (
                            <div
                                key={tracking._id}
                                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => navigate(`/process-tracking/${tracking._id}`)}
                            >
                                <div className="p-5">
                                    {/* Header Row */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-gray-800">{tracking.processName}</h3>
                                                {getStatusBadge(tracking.status)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="font-semibold text-blue-600">
                                                    {tracking.workOrderNumber}
                                                </span>
                                                <span>•</span>
                                                <span>{tracking.assignedEmployeeId?.name || 'Unassigned'}</span>
                                            </div>
                                        </div>
                                        <ArrowRight size={20} className="text-gray-400 shrink-0" />
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                            <span>Progress</span>
                                            <span className="font-bold text-gray-700">{tracking.progressPercentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${getProgressBarColor(tracking.progressPercentage)}`}
                                                style={{ width: `${tracking.progressPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-center">
                                            <p className="text-xs text-blue-500 font-medium">Inputs</p>
                                            <p className="text-lg font-bold text-blue-700">{tracking.inputs?.length || 0}</p>
                                        </div>
                                        <div className="bg-green-50 border border-green-100 rounded-lg p-2 text-center">
                                            <p className="text-xs text-green-500 font-medium">Outputs</p>
                                            <p className="text-lg font-bold text-green-700">{tracking.outputs?.length || 0}</p>
                                        </div>
                                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-2 text-center">
                                            <p className="text-xs text-purple-500 font-medium">Logs</p>
                                            <p className="text-lg font-bold text-purple-700">{tracking.logs?.length || 0}</p>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    {(tracking.startedAt || tracking.completedAt) && (
                                        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                                            {tracking.startedAt && (
                                                <div>
                                                    <span className="font-medium">Started:</span>{' '}
                                                    {new Date(tracking.startedAt).toLocaleString()}
                                                </div>
                                            )}
                                            {tracking.completedAt && (
                                                <div>
                                                    <span className="font-medium">Completed:</span>{' '}
                                                    {new Date(tracking.completedAt).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProcessTrackingPage;
