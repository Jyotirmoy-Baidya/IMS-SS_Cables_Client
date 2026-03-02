import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Package, TrendingUp, Activity, Clock } from 'lucide-react';
import api from '../api/axiosInstance';
import AddInputModal from '../components/processTracking/AddInputModal';
import AddOutputModal from '../components/processTracking/AddOutputModal';
import UpdateProgressModal from '../components/processTracking/UpdateProgressModal';

const ProcessTrackingDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddInput, setShowAddInput] = useState(false);
    const [showAddOutput, setShowAddOutput] = useState(false);
    const [showUpdateProgress, setShowUpdateProgress] = useState(false);

    useEffect(() => {
        fetchProcessTracking();
    }, [id]);

    const fetchProcessTracking = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/process-tracking/${id}`);
            setTracking(response.data);
        } catch (error) {
            console.error('Error fetching process tracking:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputAdded = () => {
        setShowAddInput(false);
        fetchProcessTracking();
    };

    const handleOutputAdded = () => {
        setShowAddOutput(false);
        fetchProcessTracking();
    };

    const handleProgressUpdated = () => {
        setShowUpdateProgress(false);
        fetchProcessTracking();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!tracking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400">Process tracking not found</p>
                    <button
                        onClick={() => navigate('/process-tracking')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/process-tracking')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-800">{tracking.processName}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {tracking.workOrderNumber} • {tracking.assignedEmployeeId?.name}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowUpdateProgress(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                        <TrendingUp size={16} />
                        Update Progress
                    </button>
                </div>

                {/* Status and Progress Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Status</p>
                            <p className="text-lg font-bold text-gray-800 capitalize">{tracking.status.replace('-', ' ')}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Progress</p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all"
                                        style={{ width: `${tracking.progressPercentage}%` }}
                                    ></div>
                                </div>
                                <span className="text-lg font-bold text-blue-600">{tracking.progressPercentage}%</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Timeline</p>
                            <div className="text-sm text-gray-600">
                                {tracking.startedAt && (
                                    <p>Started: {new Date(tracking.startedAt).toLocaleDateString()}</p>
                                )}
                                {tracking.completedAt && (
                                    <p>Completed: {new Date(tracking.completedAt).toLocaleDateString()}</p>
                                )}
                                {!tracking.startedAt && !tracking.completedAt && (
                                    <p className="text-gray-400">Not started</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Inputs Section */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 bg-blue-50 border-b border-blue-100">
                            <div className="flex items-center gap-2">
                                <Package size={18} className="text-blue-600" />
                                <h2 className="font-bold text-gray-800">Inputs (Consumed)</h2>
                            </div>
                            <button
                                onClick={() => setShowAddInput(true)}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
                            >
                                <Plus size={14} />
                                Add Input
                            </button>
                        </div>
                        <div className="p-5">
                            {tracking.inputs?.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">No inputs consumed yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {tracking.inputs.map((input, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {input.sourceType === 'raw-material' ? input.materialName : input.wipItemName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {input.sourceType.replace('-', ' ')}
                                                        {input.lotNumber && ` • Lot: ${input.lotNumber}`}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                                                    {input.quantityUsed.weight || input.quantityUsed.length || 0} {input.quantityUsed.unit}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Used: {new Date(input.usedAt).toLocaleString()}
                                            </p>
                                            {input.notes && (
                                                <p className="text-xs text-gray-600 mt-2 italic">{input.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Outputs Section */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 bg-green-50 border-b border-green-100">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={18} className="text-green-600" />
                                <h2 className="font-bold text-gray-800">Outputs (Produced)</h2>
                            </div>
                            <button
                                onClick={() => setShowAddOutput(true)}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm"
                            >
                                <Plus size={14} />
                                Add Output
                            </button>
                        </div>
                        <div className="p-5">
                            {tracking.outputs?.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">No outputs produced yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {tracking.outputs.map((output, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{output.itemName}</p>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {output.outputType.replace('-', ' ')}
                                                    </p>
                                                    {output.specifications && (
                                                        <p className="text-xs text-gray-500">{output.specifications}</p>
                                                    )}
                                                </div>
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                                                    {output.quantity.weight || output.quantity.length || 0} {output.quantity.unit}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Produced: {new Date(output.producedAt).toLocaleString()}
                                            </p>
                                            {output.storageLocation && (
                                                <p className="text-xs text-gray-600 mt-1">📍 {output.storageLocation}</p>
                                            )}
                                            {output.notes && (
                                                <p className="text-xs text-gray-600 mt-2 italic">{output.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Activity Logs */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 bg-purple-50 border-b border-purple-100">
                        <Activity size={18} className="text-purple-600" />
                        <h2 className="font-bold text-gray-800">Activity Logs</h2>
                    </div>
                    <div className="p-5">
                        {tracking.logs?.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No activity logs</p>
                        ) : (
                            <div className="space-y-3">
                                {tracking.logs.map((log, idx) => (
                                    <div key={idx} className="flex gap-3 items-start">
                                        <div className="shrink-0 mt-1">
                                            <Clock size={14} className="text-gray-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-700">{log.description}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {new Date(log.timestamp).toLocaleString()}
                                                {log.userName && ` • ${log.userName}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddInput && (
                <AddInputModal
                    tracking={tracking}
                    onClose={() => setShowAddInput(false)}
                    onSuccess={handleInputAdded}
                />
            )}

            {showAddOutput && (
                <AddOutputModal
                    tracking={tracking}
                    onClose={() => setShowAddOutput(false)}
                    onSuccess={handleOutputAdded}
                />
            )}

            {showUpdateProgress && (
                <UpdateProgressModal
                    tracking={tracking}
                    onClose={() => setShowUpdateProgress(false)}
                    onSuccess={handleProgressUpdated}
                />
            )}
        </div>
    );
};

export default ProcessTrackingDetailPage;
