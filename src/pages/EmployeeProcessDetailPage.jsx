import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Package,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Loader2,
    PlayCircle,
    PauseCircle,
    XCircle,
    FileText,
    Box,
    AlertTriangle
} from 'lucide-react';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    'in-progress': { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-700', icon: PlayCircle },
    completed: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
    'on-hold': { label: 'On Hold', bg: 'bg-gray-100', text: 'text-gray-700', icon: PauseCircle },
};

const EmployeeProcessDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    const [process, setProcess] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [extraRequests, setExtraRequests] = useState([]);
    const [dependencies, setDependencies] = useState(null);
    const [loading, setLoading] = useState(true);

    // Create output product state
    const [showCreateOutput, setShowCreateOutput] = useState(false);
    const [outputForm, setOutputForm] = useState({
        itemName: '',
        specifications: '',
        storageLocation: ''
    });
    const [creatingOutput, setCreatingOutput] = useState(false);

    // Update progress state
    const [showUpdateProgress, setShowUpdateProgress] = useState(false);
    const [progressForm, setProgressForm] = useState({
        progressPercentage: 0,
        producedQuantity: 0,
        producedWeight: 0,
        qualityGrade: '',
        notes: ''
    });
    const [updatingProgress, setUpdatingProgress] = useState(false);

    useEffect(() => {
        fetchProcessDetails();
        fetchMaterials();
        checkDependencies();
    }, [id]);

    const fetchProcessDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/employee/processInWorkOrderById/${id}`);

            if (response.success) {
                const foundProcess = response.data;
                setProcess(foundProcess);

                // Set initial progress form values
                setProgressForm({
                    progressPercentage: foundProcess.progressPercentage || 0,
                    producedQuantity: foundProcess.producedOutputDetails?.producedQuantity || 0,
                    producedWeight: foundProcess.producedOutputDetails?.producedWeight || 0,
                    qualityGrade: foundProcess.producedOutputDetails?.qualityGrade || '',
                    notes: foundProcess.producedOutputDetails?.notes || ''
                });

                // Extract extra material requests from populated workOrderId
                if (foundProcess.workOrderId?.extraMaterialRequests) {
                    setExtraRequests(foundProcess.workOrderId.extraMaterialRequests);
                }
            }
        } catch (err) {
            console.error('Failed to fetch process:', err);
            alert(err.message || 'Failed to fetch process details');
            navigate('/employee/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await api.get(`/employee/workOrderMaterials/${id}`);
            console.log(response);
            if (response.success) {
                setMaterials(response.data.allocatedMaterials || []);
            }
        } catch (err) {
            console.error('Failed to fetch materials:', err);
        }
    };

    const checkDependencies = async () => {
        try {
            const response = await api.post('/employee/checkDependencies', { processId: id });
            if (response.success) {
                setDependencies(response.data);
            }
        } catch (err) {
            console.error('Failed to check dependencies:', err);
        }
    };

    const handleCreateOutput = async (e) => {
        e.preventDefault();

        if (!outputForm.itemName) {
            alert('Item name is required');
            return;
        }

        try {
            setCreatingOutput(true);
            const response = await api.post(`/employee/create-output-product/${id}`, outputForm);

            if (response.success) {
                alert(response.message);
                setShowCreateOutput(false);
                setOutputForm({ itemName: '', specifications: '', storageLocation: '' });
                fetchProcessDetails(); // Refresh to show created output
            }
        } catch (err) {
            alert(err.message || 'Failed to create output product');
        } finally {
            setCreatingOutput(false);
        }
    };

    const handleUpdateProgress = async (e) => {
        e.preventDefault();

        try {
            setUpdatingProgress(true);
            const response = await api.post(`/employee/updateProcessInWorkOrderProgress/${id}`, {
                progressPercentage: progressForm.progressPercentage,
                producedOutputDetails: {
                    producedQuantity: progressForm.producedQuantity,
                    producedWeight: progressForm.producedWeight,
                    qualityGrade: progressForm.qualityGrade,
                    notes: progressForm.notes
                }
            });

            if (response.success) {
                alert('Progress updated successfully');
                setShowUpdateProgress(false);
                fetchProcessDetails(); // Refresh
            }
        } catch (err) {
            alert(err.message || 'Failed to update progress');
        } finally {
            setUpdatingProgress(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!window.confirm(`Change status to ${newStatus}?`)) {
            return;
        }

        try {
            const response = await api.patch(`/employee/updateProcessStatus/${id}`, {
                status: newStatus
            });

            if (response.success) {
                alert('Status updated successfully');
                fetchProcessDetails();
            }
        } catch (err) {
            alert(err.message || 'Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="inline-block animate-spin h-12 w-12 text-blue-600 mb-4" />
                    <p className="text-gray-600">Loading process details...</p>
                </div>
            </div>
        );
    }

    if (!process) {
        return (
            <div className="text-center py-12">
                <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                <p className="text-gray-600">Process not found</p>
            </div>
        );
    }

    const StatusIcon = STATUS_CONFIG[process.status]?.icon || Package;
    const hasOutputProduct = process.producedOutputDetails?.wipInventoryItemId || process.producedOutputDetails?.finishedGoodId;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/employee/dashboard')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800">{process.processName}</h1>
                    <p className="text-sm text-gray-600">Work Order: {process.workOrderNumber}</p>
                </div>
            </div>

            {/* Status and Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <StatusIcon size={24} className={STATUS_CONFIG[process.status]?.text} />
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_CONFIG[process.status]?.bg} ${STATUS_CONFIG[process.status]?.text}`}>
                            {STATUS_CONFIG[process.status]?.label}
                        </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <select
                            value={process.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="on-hold">On Hold</option>
                        </select>
                    </div>
                </div>

                <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                    <p className="text-sm text-blue-700 mb-2">Progress</p>
                    <p className="text-3xl font-bold text-blue-800">{process.progressPercentage || 0}%</p>
                    <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${process.progressPercentage || 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6">
                    <p className="text-sm text-emerald-700 mb-2">Target Quantity</p>
                    <p className="text-3xl font-bold text-emerald-800">
                        {process.output?.calculatedQuantity || 0}
                    </p>
                    <p className="text-sm text-emerald-600">{process.output?.unit || 'm'}</p>
                </div>
            </div>

            {/* Dependency Check */}
            {dependencies && (
                <div className={`rounded-xl border p-6 ${dependencies.canStart ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-3">
                        {dependencies.canStart ? (
                            <CheckCircle2 size={24} className="text-emerald-600" />
                        ) : (
                            <AlertTriangle size={24} className="text-amber-600" />
                        )}
                        <div>
                            <p className={`font-semibold ${dependencies.canStart ? 'text-emerald-800' : 'text-amber-800'}`}>
                                {dependencies.message}
                            </p>
                            {dependencies.previousProcessName && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Previous: {dependencies.previousProcessName}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Output Product */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Output Product</h2>

                {hasOutputProduct ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <p className="text-emerald-700 font-medium mb-2">
                            ✓ Output product created
                        </p>
                        <p className="text-sm text-gray-600">
                            Produced: {process.producedOutputDetails?.producedQuantity || 0} {process.output?.unit}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Quantity updates automatically when you update progress
                        </p>
                    </div>
                ) : (
                    <>
                        {!showCreateOutput ? (
                            <button
                                onClick={() => setShowCreateOutput(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Box size={18} />
                                Create Output Product
                            </button>
                        ) : (
                            <form onSubmit={handleCreateOutput} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Item Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={outputForm.itemName}
                                        onChange={(e) => setOutputForm({ ...outputForm, itemName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Specifications
                                    </label>
                                    <textarea
                                        value={outputForm.specifications}
                                        onChange={(e) => setOutputForm({ ...outputForm, specifications: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Storage Location
                                    </label>
                                    <input
                                        type="text"
                                        value={outputForm.storageLocation}
                                        onChange={(e) => setOutputForm({ ...outputForm, storageLocation: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={creatingOutput}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {creatingOutput ? 'Creating...' : 'Create'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateOutput(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>

            {/* Update Progress */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Update Progress</h2>

                {!showUpdateProgress ? (
                    <button
                        onClick={() => setShowUpdateProgress(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <FileText size={18} />
                        Update Progress
                    </button>
                ) : (
                    <form onSubmit={handleUpdateProgress} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Progress %
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={progressForm.progressPercentage}
                                    onChange={(e) => setProgressForm({ ...progressForm, progressPercentage: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Produced Quantity
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={progressForm.producedQuantity}
                                    onChange={(e) => setProgressForm({ ...progressForm, producedQuantity: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Produced Weight
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={progressForm.producedWeight}
                                    onChange={(e) => setProgressForm({ ...progressForm, producedWeight: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quality Grade
                                </label>
                                <input
                                    type="text"
                                    value={progressForm.qualityGrade}
                                    onChange={(e) => setProgressForm({ ...progressForm, qualityGrade: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={progressForm.notes}
                                onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={updatingProgress}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {updatingProgress ? 'Updating...' : 'Update Progress'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowUpdateProgress(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Allocated Materials */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Allocated Materials</h2>

                {materials.length === 0 ? (
                    <p className="text-gray-500">No materials allocated</p>
                ) : (
                    <div className="space-y-3">
                        {materials.map((material, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Material</p>
                                        <p className="font-medium text-gray-800">
                                            {material.materialId?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Lot Number</p>
                                        <p className="font-medium text-gray-800">
                                            {material.materialLotId?.lotNumber || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Allocated</p>
                                        <p className="font-medium text-gray-800">
                                            {material.allocatedWeight || 0} kg
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Consumed</p>
                                        <p className="font-medium text-gray-800">
                                            {material.consumedQuantity?.weight || 0} kg
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Extra Material Requests */}
            {extraRequests.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Extra Material Requests</h2>

                    <div className="space-y-3">
                        {extraRequests.map((request, index) => (
                            <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Material</p>
                                        <p className="font-medium text-gray-800">{request.materialName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Quantity</p>
                                        <p className="font-medium text-gray-800">
                                            {request.quantityRequired?.weight || 0} kg
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Reason</p>
                                        <p className="font-medium text-gray-800">{request.reason || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Status</p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                            request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {request.status}
                                        </span>
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

export default EmployeeProcessDetailPage;
