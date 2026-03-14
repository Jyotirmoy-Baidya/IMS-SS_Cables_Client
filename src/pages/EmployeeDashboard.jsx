import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import api from '../api/axiosInstance';

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    'in-progress': { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-700', icon: Package },
    completed: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
    'on-hold': { label: 'On Hold', bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle },
};

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0
    });

    useEffect(() => {
        fetchProcesses();
    }, []);

    const fetchProcesses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/employee/processInWorkOrder');

            if (response.success) {
                const data = response.data;
                setProcesses(data);

                // Calculate stats
                setStats({
                    total: data.length,
                    pending: data.filter(p => p.status === 'pending').length,
                    inProgress: data.filter(p => p.status === 'in-progress').length,
                    completed: data.filter(p => p.status === 'completed').length
                });
            }
        } catch (err) {
            console.error('Failed to fetch processes:', err);
            alert(err.message || 'Failed to fetch your processes');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading your processes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Processes</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
                        </div>
                        <Package size={32} className="text-gray-400" />
                    </div>
                </div>

                <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-amber-700">Pending</p>
                            <p className="text-3xl font-bold text-amber-800 mt-1">{stats.pending}</p>
                        </div>
                        <Clock size={32} className="text-amber-400" />
                    </div>
                </div>

                <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-700">In Progress</p>
                            <p className="text-3xl font-bold text-blue-800 mt-1">{stats.inProgress}</p>
                        </div>
                        <Package size={32} className="text-blue-400" />
                    </div>
                </div>

                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-emerald-700">Completed</p>
                            <p className="text-3xl font-bold text-emerald-800 mt-1">{stats.completed}</p>
                        </div>
                        <CheckCircle2 size={32} className="text-emerald-400" />
                    </div>
                </div>
            </div>

            {/* Processes List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">My Assigned Processes</h2>
                </div>

                {processes.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No processes assigned to you yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {processes.map((process) => {
                            const StatusIcon = STATUS_CONFIG[process.status]?.icon || Package;
                            return (
                                <div
                                    key={process._id}
                                    onClick={() => navigate(`/employee/process/${process._id}`)}
                                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {process.processName}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[process.status]?.bg} ${STATUS_CONFIG[process.status]?.text}`}>
                                                    {STATUS_CONFIG[process.status]?.label}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                                <div>
                                                    <span className="font-medium">Work Order:</span>{' '}
                                                    {process.workOrderNumber}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Progress:</span>{' '}
                                                    {process.progressPercentage || 0}%
                                                </div>
                                                {process.output?.calculatedQuantity && (
                                                    <div>
                                                        <span className="font-medium">Target:</span>{' '}
                                                        {process.output.calculatedQuantity} {process.output.unit}
                                                    </div>
                                                )}
                                                {process.producedOutputDetails?.producedQuantity > 0 && (
                                                    <div>
                                                        <span className="font-medium">Produced:</span>{' '}
                                                        {process.producedOutputDetails.producedQuantity} {process.output?.unit}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="ml-4 flex items-center gap-3">
                                            <StatusIcon size={32} className={STATUS_CONFIG[process.status]?.text} />
                                            <ChevronRight size={24} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeDashboard;
