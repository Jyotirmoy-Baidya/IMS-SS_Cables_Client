import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Activity,
    User,
    Clock,
    FileText,
    Package,
    CheckCircle2,
    AlertCircle,
    Loader2,
    PlayCircle,
    PauseCircle,
    TrendingUp,
    Box,
    Trash2
} from 'lucide-react';
import api from '../api/axiosInstance';

const ACTION_CONFIG = {
    'input-consumed': { label: 'Input Consumed', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    'progress-updated': { label: 'Progress Updated', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    'status-changed': { label: 'Status Changed', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
    'output-created': { label: 'Output Created', icon: Box, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    'report-submitted': { label: 'Report Submitted', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    'report-approved': { label: 'Report Approved', icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
    'assigned': { label: 'Employee Assigned', icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50' },
};

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    'in-progress': { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-700', icon: PlayCircle },
    completed: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
    'on-hold': { label: 'On Hold', bg: 'bg-gray-100', text: 'text-gray-700', icon: PauseCircle },
};

const ProcessInWorkOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [process, setProcess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProcessDetails();
    }, [id]);

    const fetchProcessDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/process-in-work-order/${id}`);

            if (response.success) {
                setProcess(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch process:', err);
            setError(err.message || 'Failed to fetch process details');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatRelativeTime = (date) => {
        if (!date) return '';
        const now = new Date();
        const logDate = new Date(date);
        const diffMs = now - logDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return formatDate(date);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2 className="inline-block animate-spin h-12 w-12 text-blue-600 mb-4" />
                    <p className="text-gray-600">Loading process details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertCircle size={48} className="mx-auto text-red-600 mb-4" />
                    <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!process) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="text-center">
                    <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Process not found</p>
                </div>
            </div>
        );
    }

    const StatusIcon = STATUS_CONFIG[process.status]?.icon || Package;
    const logs = process.logs || [];

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800">Process Activity Log</h1>
                    <p className="text-sm text-gray-600">
                        {process.processName} • Work Order: {process.workOrderNumber}
                    </p>
                </div>
            </div>

            {/* Process Overview Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Status */}
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <div className="flex items-center gap-2">
                            <StatusIcon size={18} className={STATUS_CONFIG[process.status]?.text} />
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[process.status]?.bg} ${STATUS_CONFIG[process.status]?.text}`}>
                                {STATUS_CONFIG[process.status]?.label}
                            </span>
                        </div>
                    </div>

                    {/* Progress */}
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Progress</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${process.progressPercentage || 0}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-bold text-blue-700">{process.progressPercentage || 0}%</span>
                        </div>
                    </div>

                    {/* Assigned Employee */}
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-800">
                                {process.assignedEmployeeId?.name || 'Unassigned'}
                            </span>
                        </div>
                    </div>

                    {/* Target Quantity */}
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Target Quantity</p>
                        <p className="text-lg font-bold text-gray-800">
                            {process.output?.calculatedQuantity || 0} {process.output?.unit || 'm'}
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Started: </span>
                        <span className="font-medium text-gray-800">{formatDate(process.startedAt)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Completed: </span>
                        <span className="font-medium text-gray-800">{formatDate(process.completedAt)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Total Logs: </span>
                        <span className="font-medium text-gray-800">{logs.length}</span>
                    </div>
                </div>
            </div>

            {/* Activity Logs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Activity size={24} className="text-white" />
                        <h2 className="text-xl font-bold text-white">Activity Timeline</h2>
                    </div>
                </div>

                <div className="p-6">
                    {logs.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No activity logs yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.slice().reverse().map((log, index) => {
                                const actionConfig = ACTION_CONFIG[log.action] || {
                                    label: log.action,
                                    icon: Activity,
                                    color: 'text-gray-600',
                                    bg: 'bg-gray-50'
                                };
                                const Icon = actionConfig.icon;

                                return (
                                    <div
                                        key={index}
                                        className={`relative border-l-4 border-gray-200 pl-6 pb-6 ${index === logs.length - 1 ? 'pb-0' : ''}`}
                                    >
                                        {/* Timeline dot */}
                                        <div className={`absolute -left-3 top-0 w-6 h-6 rounded-full ${actionConfig.bg} border-2 border-white flex items-center justify-center`}>
                                            <Icon size={14} className={actionConfig.color} />
                                        </div>

                                        {/* Log Card */}
                                        <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${actionConfig.bg} ${actionConfig.color}`}>
                                                        {actionConfig.label}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">{formatRelativeTime(log.timestamp)}</p>
                                                    <p className="text-xs text-gray-400">{formatDate(log.timestamp)}</p>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            {log.description && (
                                                <p className="text-sm text-gray-700 mb-2">{log.description}</p>
                                            )}

                                            {/* User Info */}
                                            {log.userName && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                                    <User size={12} />
                                                    <span>by <strong>{log.userName}</strong></span>
                                                </div>
                                            )}

                                            {/* Details */}
                                            {log.details && Object.keys(log.details).length > 0 && (
                                                <details className="mt-3">
                                                    <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                                                        View Details
                                                    </summary>
                                                    <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                                                        <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                                                            {JSON.stringify(log.details, null, 2)}
                                                        </pre>
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Inputs Summary */}
            {process.inputs && process.inputs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Package size={20} className="text-blue-600" />
                        Inputs Consumed ({process.inputs.length})
                    </h2>
                    <div className="space-y-2">
                        {process.inputs.map((input, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {input.materialName || input.wipItemName || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {input.lotNumber ? `Lot: ${input.lotNumber}` : 'WIP Item'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-blue-700">
                                            {input.quantityUsed?.weight || 0} kg
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(input.usedAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcessInWorkOrderDetailPage;
