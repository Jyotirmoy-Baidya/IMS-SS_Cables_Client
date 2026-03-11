import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, MapPin, Clock, CheckCircle2, ChevronDown, ChevronUp,
    Calendar, Package, AlertCircle, Activity, TrendingUp, Plus, ExternalLink
} from 'lucide-react';
import api from '../api/axiosInstance';
import AddInputModal from '../components/processTracking/AddInputModal';
import AddOutputModal from '../components/processTracking/AddOutputModal';
import UpdateProgressModal from '../components/processTracking/UpdateProgressModal';
import SubmitReportModal from '../components/processTracking/SubmitReportModal';
import ProcessStatusBanner from '../components/processTracking/ProcessStatusBanner';

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

    // Process tracking state
    const [processTrackings, setProcessTrackings] = useState({});
    const [selectedProcessTracking, setSelectedProcessTracking] = useState(null);
    const [showAddInput, setShowAddInput] = useState(false);
    const [showAddOutput, setShowAddOutput] = useState(false);
    const [showUpdateProgress, setShowUpdateProgress] = useState(false);

    // Report and dependency state
    const [processDependencies, setProcessDependencies] = useState({});
    const [showSubmitReport, setShowSubmitReport] = useState(false);
    const [reportProcessTracking, setReportProcessTracking] = useState(null);

    // Process update form
    const [processForm, setProcessForm] = useState({
        status: '',
        progressPercentage: 0,
        actualOutput: {
            producedQuantity: 0,
            producedItemName: '',
            producedSpecification: '',
            storageLocation: '',
            qualityGrade: '',
            defectRate: 0,
            notes: ''
        },
        notes: '',
    });

    const fetchWorkOrder = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/work-order/get-work-order/${id}`);
            setWorkOrder(res.data || null);

            // Fetch process tracking for all processes
            if (res.data?.processAssignments?.length > 0) {
                const trackingRes = await api.get(`/process-tracking?workOrderId=${id}`);
                const trackings = trackingRes.data || [];

                // Map trackings by processAssignmentId
                const trackingMap = {};
                trackings.forEach(tracking => {
                    trackingMap[tracking.processAssignmentId] = tracking;
                });
                setProcessTrackings(trackingMap);
            }
        } catch (err) {
            console.error('Failed to fetch work order:', err);
            alert('Failed to load work order: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const checkProcessDependency = async (processAssignment) => {
        try {
            const response = await api.post('/process-tracking/check-dependencies', {
                workOrderId: workOrder?._id,
                processSequence: processAssignment.sequence
            });

            setProcessDependencies(prev => ({
                ...prev,
                [processAssignment._id]: response.data
            }));
        } catch (error) {
            console.error('Error checking dependencies:', error);
        }
    };

    useEffect(() => {
        fetchWorkOrder();
    }, [id]);

    useEffect(() => {
        if (workOrder && workOrder.processAssignments) {
            workOrder.processAssignments.forEach(pa => {
                checkProcessDependency(pa);
            });
        }
    }, [workOrder]);

    const handleExpandProcess = (processAssignment) => {
        if (expandedProcess?._id === processAssignment._id) {
            setExpandedProcess(null);
        } else {
            setExpandedProcess(processAssignment);
            setProcessForm({
                status: processAssignment.status || 'pending',
                progressPercentage: processAssignment.progressPercentage || 0,
                actualOutput: {
                    producedQuantity: processAssignment.actualOutput?.producedQuantity || 0,
                    producedItemName: processAssignment.actualOutput?.producedItemName || '',
                    producedSpecification: processAssignment.actualOutput?.producedSpecification || '',
                    storageLocation: processAssignment.actualOutput?.storageLocation || '',
                    qualityGrade: processAssignment.actualOutput?.qualityGrade || '',
                    defectRate: processAssignment.actualOutput?.defectRate || 0,
                    notes: processAssignment.actualOutput?.notes || ''
                },
                notes: processAssignment.notes || '',
            });
        }
    };

    const handleCreateProcessTracking = async (processAssignment) => {
        try {
            await api.post('/process-tracking', {
                workOrderId: workOrder._id,
                processAssignmentId: processAssignment._id
            });
            alert('Process tracking created successfully!');
            fetchWorkOrder();
        } catch (err) {
            alert('Failed to create process tracking: ' + err.message);
        }
    };

    const handleOpenInputModal = (processAssignment) => {
        const tracking = processTrackings[processAssignment._id];
        if (!tracking) {
            alert('Please create process tracking first');
            return;
        }
        setSelectedProcessTracking(tracking);
        setShowAddInput(true);
    };

    const handleOpenOutputModal = (processAssignment) => {
        const tracking = processTrackings[processAssignment._id];
        if (!tracking) {
            alert('Please create process tracking first');
            return;
        }
        setSelectedProcessTracking(tracking);
        setShowAddOutput(true);
    };

    const handleInputAdded = () => {
        setShowAddInput(false);
        setSelectedProcessTracking(null);
        fetchWorkOrder();
    };

    const handleOutputAdded = () => {
        setShowAddOutput(false);
        setSelectedProcessTracking(null);
        fetchWorkOrder();
    };

    const handleOpenUpdateProgressModal = (processAssignment) => {
        const tracking = processTrackings[processAssignment._id];
        if (!tracking) {
            alert('Please create process tracking first');
            return;
        }
        setSelectedProcessTracking(tracking);
        setShowUpdateProgress(true);
    };

    const handleProgressUpdated = () => {
        setShowUpdateProgress(false);
        setSelectedProcessTracking(null);
        fetchWorkOrder();
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
                status: processForm.status,
                progressPercentage: processForm.progressPercentage,
                notes: processForm.notes,
                actualOutput: processForm.actualOutput,
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

            // Also update process tracking if exists
            const tracking = processTrackings[processAssignmentId];
            if (tracking) {
                await api.patch(`/process-tracking/${tracking._id}/progress`, {
                    progressPercentage: processForm.progressPercentage,
                    status: processForm.status,
                    userId: null // You can add user context here
                });
            }

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

                            {/* Process Dependency Status Banner */}
                            {processDependencies[pa._id] && (
                                <div className="px-6 pt-4">
                                    <ProcessStatusBanner
                                        dependencyStatus={processDependencies[pa._id]}
                                        processName={pa.processName}
                                        onSubmitReport={() => {
                                            const tracking = processTrackings[pa._id];
                                            if (tracking && tracking.status === 'completed' && !tracking.reportUploaded) {
                                                setReportProcessTracking(tracking);
                                                setShowSubmitReport(true);
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {/* Expanded Process Details */}
                            {expandedProcess?._id === pa._id && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
                                    {/* Expected Output Section */}
                                    {pa.expectedOutput && pa.expectedOutput.outputType !== 'none' && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <TrendingUp size={14} className="text-blue-600" />
                                                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide">Expected Output</h4>
                                                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                                    pa.expectedOutput.outputType === 'intermediate'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {pa.expectedOutput.outputType === 'intermediate' ? 'Intermediate' : 'Final'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-blue-600 font-medium">Quantity:</span>
                                                    <span className="ml-2 text-blue-800 font-semibold">
                                                        {pa.expectedOutput.expectedQuantity?.toFixed(2) || 0} {pa.expectedOutput.unit || 'm'}
                                                    </span>
                                                </div>
                                                {pa.expectedOutput.expectedItemName && (
                                                    <div className="col-span-2">
                                                        <span className="text-blue-600 font-medium">Item:</span>
                                                        <span className="ml-2 text-blue-800">{pa.expectedOutput.expectedItemName}</span>
                                                    </div>
                                                )}
                                                {pa.expectedOutput.expectedSpecification && (
                                                    <div className="col-span-2">
                                                        <span className="text-blue-600 font-medium">Specification:</span>
                                                        <span className="ml-2 text-blue-800">{pa.expectedOutput.expectedSpecification}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actual Output Form */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <Package size={14} className="text-emerald-600" />
                                            Actual Production Output
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Produced Quantity */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Quantity
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={processForm.actualOutput.producedQuantity}
                                                        onChange={e => setProcessForm(prev => ({
                                                            ...prev,
                                                            actualOutput: { ...prev.actualOutput, producedQuantity: parseFloat(e.target.value) || 0 }
                                                        }))}
                                                        placeholder="0.00"
                                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                                    />
                                                    <span className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                                                        {pa.expectedOutput?.unit || 'm'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Item Name */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Item Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={processForm.actualOutput.producedItemName}
                                                    onChange={e => setProcessForm(prev => ({
                                                        ...prev,
                                                        actualOutput: { ...prev.actualOutput, producedItemName: e.target.value }
                                                    }))}
                                                    placeholder="e.g., Drawn wire"
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                                />
                                            </div>

                                            {/* Specification */}
                                            <div className="col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Specification
                                                </label>
                                                <input
                                                    type="text"
                                                    value={processForm.actualOutput.producedSpecification}
                                                    onChange={e => setProcessForm(prev => ({
                                                        ...prev,
                                                        actualOutput: { ...prev.actualOutput, producedSpecification: e.target.value }
                                                    }))}
                                                    placeholder="e.g., 0.5sq mm, 7 wires"
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
                                                    value={processForm.actualOutput.storageLocation}
                                                    onChange={e => setProcessForm(prev => ({
                                                        ...prev,
                                                        actualOutput: { ...prev.actualOutput, storageLocation: e.target.value }
                                                    }))}
                                                    placeholder="e.g., bobbin count 10 in shelf 2"
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                                />
                                            </div>

                                            {/* Quality Grade */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Quality Grade
                                                </label>
                                                <select
                                                    value={processForm.actualOutput.qualityGrade}
                                                    onChange={e => setProcessForm(prev => ({
                                                        ...prev,
                                                        actualOutput: { ...prev.actualOutput, qualityGrade: e.target.value }
                                                    }))}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                                >
                                                    <option value="">Select Grade</option>
                                                    <option value="A">A - Excellent</option>
                                                    <option value="B">B - Good</option>
                                                    <option value="C">C - Acceptable</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                            </div>

                                            {/* Defect Rate */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Defect Rate (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                    value={processForm.actualOutput.defectRate}
                                                    onChange={e => setProcessForm(prev => ({
                                                        ...prev,
                                                        actualOutput: { ...prev.actualOutput, defectRate: parseFloat(e.target.value) || 0 }
                                                    }))}
                                                    placeholder="0.0"
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                                />
                                            </div>

                                            {/* Notes */}
                                            <div className="col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Production Notes
                                                </label>
                                                <textarea
                                                    value={processForm.actualOutput.notes}
                                                    onChange={e => setProcessForm(prev => ({
                                                        ...prev,
                                                        actualOutput: { ...prev.actualOutput, notes: e.target.value }
                                                    }))}
                                                    placeholder="Any observations, issues, or special notes about the production..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Process Tracking Section */}
                                    {(() => {
                                        const tracking = processTrackings[pa._id];
                                        return (
                                            <div className="mt-6 border-t border-gray-200 pt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                        <Activity size={16} className="text-purple-600" />
                                                        Process Tracking & Materials
                                                    </h3>
                                                    {!tracking && (
                                                        <button
                                                            onClick={() => handleCreateProcessTracking(pa)}
                                                            className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                                                        >
                                                            <Plus size={14} />
                                                            Enable Tracking
                                                        </button>
                                                    )}
                                                </div>

                                                {tracking ? (
                                                    <div className="space-y-3">
                                                        {/* Tracking Stats */}
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                                                                <p className="text-xs text-blue-600 font-medium">Inputs</p>
                                                                <p className="text-xl font-bold text-blue-700">{tracking.inputs?.length || 0}</p>
                                                            </div>
                                                            <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                                                                <p className="text-xs text-green-600 font-medium">Outputs</p>
                                                                <p className="text-xl font-bold text-green-700">{tracking.outputs?.length || 0}</p>
                                                            </div>
                                                            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                                                                <p className="text-xs text-purple-600 font-medium">Logs</p>
                                                                <p className="text-xl font-bold text-purple-700">{tracking.logs?.length || 0}</p>
                                                            </div>
                                                        </div>

                                                        {/* Report Submission Banner */}
                                                        {tracking.status === 'completed' && !tracking.reportUploaded && (
                                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <AlertCircle size={20} className="text-yellow-600 flex-shrink-0" />
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-yellow-800">Process Completed - Report Required</p>
                                                                            <p className="text-xs text-yellow-700 mt-0.5">Please submit a process report before the next process can begin</p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            setReportProcessTracking(tracking);
                                                                            setShowSubmitReport(true);
                                                                        }}
                                                                        className="px-4 py-2 bg-yellow-600 text-white text-sm font-semibold rounded-lg hover:bg-yellow-700 flex-shrink-0"
                                                                    >
                                                                        Submit Report
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Report Submitted Status */}
                                                        {tracking.status === 'completed' && tracking.reportUploaded && (
                                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <CheckCircle2 size={16} className="text-green-600" />
                                                                    <p className="text-sm font-semibold text-green-800">Report Submitted</p>
                                                                    {tracking.reportUrl && (
                                                                        <a
                                                                            href={tracking.reportUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs text-green-600 hover:underline ml-auto"
                                                                        >
                                                                            View Report →
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Action Buttons */}
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                onClick={() => handleOpenUpdateProgressModal(pa)}
                                                                className="px-3 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                                                            >
                                                                <Activity size={14} />
                                                                Update Status & Progress
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenInputModal(pa)}
                                                                className="px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                                                            >
                                                                <Plus size={14} />
                                                                Add Input (Consume)
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenOutputModal(pa)}
                                                                className="px-3 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                                                            >
                                                                <TrendingUp size={14} />
                                                                Add Output (Produce)
                                                            </button>
                                                            <button
                                                                onClick={() => navigate(`/process-tracking/${tracking._id}`)}
                                                                className="px-3 py-2 text-sm font-semibold bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                                                            >
                                                                <ExternalLink size={14} />
                                                                View Details
                                                            </button>
                                                        </div>

                                                        {/* Recent Activity Summary */}
                                                        {tracking.inputs && tracking.inputs.length > 0 && (
                                                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                                                <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Recent Inputs</p>
                                                                <div className="space-y-1">
                                                                    {tracking.inputs.slice(-2).map((input, idx) => (
                                                                        <div key={idx} className="text-xs text-blue-800">
                                                                            • {input.sourceType === 'raw-material' ? input.materialName : input.wipItemName}
                                                                            {' - '}
                                                                            <span className="font-bold">
                                                                                {input.quantityUsed?.weight || input.quantityUsed?.length || 0} {input.quantityUsed?.unit}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {tracking.outputs && tracking.outputs.length > 0 && (
                                                            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                                                                <p className="text-xs font-semibold text-green-700 uppercase mb-2">Recent Outputs</p>
                                                                <div className="space-y-1">
                                                                    {tracking.outputs.slice(-2).map((output, idx) => (
                                                                        <div key={idx} className="text-xs text-green-800">
                                                                            • {output.itemName}
                                                                            {' - '}
                                                                            <span className="font-bold">
                                                                                {output.quantity?.weight || output.quantity?.length || 0} {output.quantity?.unit}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                                        <AlertCircle size={24} className="mx-auto text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-600">
                                                            Process tracking not enabled. Enable it to track inputs, outputs, and activity logs.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

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

                                    {/* Show actual output details if any */}
                                    {pa.actualOutput && pa.actualOutput.producedQuantity > 0 && (
                                        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                                <CheckCircle2 size={12} />
                                                Actual Production Output
                                            </p>
                                            <div className="text-sm text-emerald-800 space-y-1">
                                                <p>
                                                    <strong>{pa.actualOutput.producedQuantity} {pa.expectedOutput?.unit || 'm'}</strong>
                                                    {pa.actualOutput.producedItemName && ` - ${pa.actualOutput.producedItemName}`}
                                                </p>
                                                {pa.actualOutput.producedSpecification && (
                                                    <p className="text-xs">{pa.actualOutput.producedSpecification}</p>
                                                )}
                                                {pa.actualOutput.qualityGrade && (
                                                    <p className="text-xs">
                                                        Quality: <span className={`font-semibold ${
                                                            pa.actualOutput.qualityGrade === 'A' ? 'text-green-700' :
                                                            pa.actualOutput.qualityGrade === 'B' ? 'text-blue-700' :
                                                            pa.actualOutput.qualityGrade === 'C' ? 'text-amber-700' :
                                                            'text-red-700'
                                                        }`}>Grade {pa.actualOutput.qualityGrade}</span>
                                                        {pa.actualOutput.defectRate > 0 && ` (${pa.actualOutput.defectRate}% defect rate)`}
                                                    </p>
                                                )}
                                                {pa.actualOutput.storageLocation && (
                                                    <p className="text-xs text-emerald-600 mt-1">
                                                        <MapPin size={10} className="inline mr-1" />
                                                        Stored at: {pa.actualOutput.storageLocation}
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
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Allocated Weight</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Allocated Date</th>
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

            {/* Modals */}
            {showAddInput && selectedProcessTracking && (
                <AddInputModal
                    tracking={selectedProcessTracking}
                    onClose={() => {
                        setShowAddInput(false);
                        setSelectedProcessTracking(null);
                    }}
                    onSuccess={handleInputAdded}
                />
            )}

            {showAddOutput && selectedProcessTracking && (
                <AddOutputModal
                    tracking={selectedProcessTracking}
                    onClose={() => {
                        setShowAddOutput(false);
                        setSelectedProcessTracking(null);
                    }}
                    onSuccess={handleOutputAdded}
                />
            )}

            {showUpdateProgress && selectedProcessTracking && (
                <UpdateProgressModal
                    tracking={selectedProcessTracking}
                    onClose={() => {
                        setShowUpdateProgress(false);
                        setSelectedProcessTracking(null);
                    }}
                    onSuccess={handleProgressUpdated}
                />
            )}

            {showSubmitReport && reportProcessTracking && (
                <SubmitReportModal
                    tracking={reportProcessTracking}
                    onClose={() => {
                        setShowSubmitReport(false);
                        setReportProcessTracking(null);
                    }}
                    onSuccess={() => {
                        setShowSubmitReport(false);
                        setReportProcessTracking(null);
                        fetchWorkOrder(); // Refresh to update dependency status
                    }}
                />
            )}
        </div>
    );
};

export default WorkOrderDetailPage;
