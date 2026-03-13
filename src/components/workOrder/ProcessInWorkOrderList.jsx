import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, MapPin, ChevronDown, ChevronUp, Package, AlertCircle, Activity,
    TrendingUp, Plus, ExternalLink, CheckCircle2, Clock
} from 'lucide-react';
import api from '../../api/axiosInstance';
import AddInputModal from '../processTracking/AddInputModal';
import AddOutputModal from '../processTracking/AddOutputModal';
import UpdateProgressModal from '../processTracking/UpdateProgressModal';
import SubmitReportModal from '../processTracking/SubmitReportModal';
import ProcessStatusBanner from '../processTracking/ProcessStatusBanner';

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700' },
    'in-progress': { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-700' },
    completed: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    'on-hold': { label: 'On Hold', bg: 'bg-gray-100', text: 'text-gray-700' },
};

const ProcessInWorkOrderList = ({ workOrderId, onRefresh }) => {
    const navigate = useNavigate();
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProcess, setExpandedProcess] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Process state
    const [selectedProcess, setSelectedProcess] = useState(null);
    const [showAddInput, setShowAddInput] = useState(false);
    const [showAddOutput, setShowAddOutput] = useState(false);
    const [showUpdateProgress, setShowUpdateProgress] = useState(false);

    // Report and dependency state
    const [processDependencies, setProcessDependencies] = useState({});
    const [showSubmitReport, setShowSubmitReport] = useState(false);
    const [reportProcess, setReportProcess] = useState(null);

    // Process update form
    const [processForm, setProcessForm] = useState({
        status: '',
        progressPercentage: 0,
        producedOutput: {
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

    const fetchProcesses = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/process-in-work-order/get-all-processes?workOrderId=${workOrderId}`);
            setProcesses(res.data || []);
        } catch (err) {
            console.error('Failed to fetch processes:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkProcessDependency = async (process) => {
        try {
            const response = await api.post('/process-in-work-order/check-dependencies', {
                workOrderId: workOrderId,
                processId: process._id
            });

            setProcessDependencies(prev => ({
                ...prev,
                [process._id]: response.data
            }));
        } catch (error) {
            console.error('Error checking dependencies:', error);
        }
    };

    useEffect(() => {
        if (workOrderId) {
            fetchProcesses();
        }
    }, [workOrderId]);

    useEffect(() => {
        if (processes && processes.length > 0) {
            processes.forEach(process => {
                checkProcessDependency(process);
            });
        }
    }, [processes]);

    const handleExpandProcess = (process) => {
        if (expandedProcess?._id === process._id) {
            setExpandedProcess(null);
        } else {
            setExpandedProcess(process);
            setProcessForm({
                status: process.status || 'pending',
                progressPercentage: process.progressPercentage || 0,
                producedOutput: {
                    producedQuantity: process.producedOutputDetails?.producedQuantity || 0,
                    producedItemName: process.producedOutputDetails?.producedItemName || '',
                    producedSpecification: process.producedOutputDetails?.producedSpecification || '',
                    storageLocation: process.producedOutputDetails?.storageLocation || '',
                    qualityGrade: process.producedOutputDetails?.qualityGrade || '',
                    defectRate: process.producedOutputDetails?.defectRate || 0,
                    notes: process.producedOutputDetails?.notes || ''
                },
                notes: process.notes || '',
            });
        }
    };

    const handleOpenInputModal = (process) => {
        if (!process) {
            alert('Process data not available');
            return;
        }
        setSelectedProcess(process);
        setShowAddInput(true);
    };

    const handleOpenOutputModal = (process) => {
        if (!process) {
            alert('Process data not available');
            return;
        }
        setSelectedProcess(process);
        setShowAddOutput(true);
    };

    const handleInputAdded = () => {
        setShowAddInput(false);
        setSelectedProcess(null);
        fetchProcesses();
        if (onRefresh) onRefresh();
    };

    const handleOutputAdded = () => {
        setShowAddOutput(false);
        setSelectedProcess(null);
        fetchProcesses();
        if (onRefresh) onRefresh();
    };

    const handleOpenUpdateProgressModal = (process) => {
        if (!process) {
            alert('Process data not available');
            return;
        }
        setSelectedProcess(process);
        setShowUpdateProgress(true);
    };

    const handleProgressUpdated = () => {
        setShowUpdateProgress(false);
        setSelectedProcess(null);
        fetchProcesses();
        if (onRefresh) onRefresh();
    };

    const handleUpdateProcess = async (processId) => {
        try {
            setUpdating(true);

            await api.post(`/process-in-work-order/${processId}/update-progress`, {
                status: processForm.status,
                progressPercentage: processForm.progressPercentage,
                notes: processForm.notes,
                producedOutputDetails: processForm.producedOutput,
            });

            alert('Process updated successfully!');
            fetchProcesses();
            setExpandedProcess(null);
            if (onRefresh) onRefresh();
        } catch (err) {
            alert('Failed to update process: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32 text-gray-400">
                Loading processes...
            </div>
        );
    }

    if (!processes || processes.length === 0) {
        return (
            <div className="text-center text-gray-400 py-8">
                No processes found for this work order
            </div>
        );
    }

    return (
        <>
            <div className="divide-y divide-gray-100">
                {processes.map((process, idx) => {
                    const sequence = idx + 1;
                    return (
                        <div key={process._id} className="border-b border-gray-100 last:border-b-0">
                            {/* Process Header - Clickable */}
                            <div
                                onClick={() => handleExpandProcess(process)}
                                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Process Number */}
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold">
                                            {sequence}
                                        </div>

                                        {/* Process Info */}
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-800 mb-1">{process.processName}</div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <User size={12} />
                                                    {process.assignedEmployeeId?.name || '—'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-32">
                                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                                <span>Progress</span>
                                                <span className="font-semibold">{process.progressPercentage || 0}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all"
                                                    style={{ width: `${process.progressPercentage || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[process.status]?.bg} ${STATUS_CONFIG[process.status]?.text}`}>
                                            {STATUS_CONFIG[process.status]?.label}
                                        </div>
                                    </div>

                                    {/* Expand Icon */}
                                    <div className="ml-4">
                                        {expandedProcess?._id === process._id ? (
                                            <ChevronUp size={18} className="text-gray-400" />
                                        ) : (
                                            <ChevronDown size={18} className="text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Process Dependency Status Banner */}
                            {processDependencies[process._id] && (
                                <div className="px-6 pt-4">
                                    <ProcessStatusBanner
                                        dependencyStatus={processDependencies[process._id]}
                                        processName={process.processName}
                                        onSubmitReport={() => {
                                            if (process.status === 'completed' && !process.reportUploaded) {
                                                setReportProcess(process);
                                                setShowSubmitReport(true);
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {/* Expanded Process Details */}
                            {expandedProcess?._id === process._id && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
                                    {/* Block Reason Banner */}
                                    {!process.canStart && process.blockReason && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle size={16} className="text-red-600" />
                                                <p className="text-sm font-semibold text-red-800">Cannot Start</p>
                                            </div>
                                            <p className="text-xs text-red-700 mt-1">{process.blockReason}</p>
                                        </div>
                                    )}

                                    {/* Expected Output Section */}
                                    {process.output && process.output.calculatedQuantity > 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <TrendingUp size={14} className="text-blue-600" />
                                                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide">Expected Output</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-blue-600 font-medium">Quantity:</span>
                                                    <span className="ml-2 text-blue-800 font-semibold">
                                                        {process.output.calculatedQuantity?.toFixed(2) || 0} {process.output.unit || 'm'}
                                                    </span>
                                                </div>
                                                {process.output.calculatedItemName && (
                                                    <div className="col-span-2">
                                                        <span className="text-blue-600 font-medium">Item:</span>
                                                        <span className="ml-2 text-blue-800">{process.output.calculatedItemName}</span>
                                                    </div>
                                                )}
                                                {process.output.calculatedSpecification && (
                                                    <div className="col-span-2">
                                                        <span className="text-blue-600 font-medium">Specification:</span>
                                                        <span className="ml-2 text-blue-800">{process.output.calculatedSpecification}</span>
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
                                                        value={processForm.producedOutput.producedQuantity}
                                                        onChange={e => setProcessForm(prev => ({
                                                            ...prev,
                                                            producedOutput: { ...prev.producedOutput, producedQuantity: parseFloat(e.target.value) || 0 }
                                                        }))}
                                                        placeholder="0.00"
                                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                                    />
                                                    <span className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                                                        {process.output?.unit || 'm'}
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
                                                    value={processForm.producedOutput.producedItemName}
                                                    onChange={e => setProcessForm(prev => ({
                                                        ...prev,
                                                        producedOutput: { ...prev.producedOutput, producedItemName: e.target.value }
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
                                                    value={processForm.producedOutput.producedSpecification}
                                                    onChange={e => setProcessForm(prev => ({
                                                        ...prev,
                                                        producedOutput: { ...prev.producedOutput, producedSpecification: e.target.value }
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
                                                    value={processForm.producedOutput.storageLocation}
                                                    onChange={e => setProcessForm(prev => ({
                                                        ...prev,
                                                        producedOutput: { ...prev.producedOutput, storageLocation: e.target.value }
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
                                                    value={processForm.producedOutput.qualityGrade}
                                                    onChange={e => setProcessForm(prev => ({
                                                        ...prev,
                                                        producedOutput: { ...prev.producedOutput, qualityGrade: e.target.value }
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
                                                    value={processForm.producedOutput.defectRate}
                                                    onChange={e => setProcessForm(prev => ({
                                                        ...prev,
                                                        producedOutput: { ...prev.producedOutput, defectRate: parseFloat(e.target.value) || 0 }
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
                                                    value={processForm.producedOutput.notes}
                                                    onChange={e => setProcessForm(prev => ({
                                                        ...prev,
                                                        producedOutput: { ...prev.producedOutput, notes: e.target.value }
                                                    }))}
                                                    placeholder="Any observations, issues, or special notes about the production..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Process Tracking Section */}
                                    <div className="mt-6 border-t border-gray-200 pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                <Activity size={16} className="text-purple-600" />
                                                Process Tracking & Materials
                                            </h3>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Tracking Stats */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-blue-600 font-medium">Inputs</p>
                                                    <p className="text-xl font-bold text-blue-700">{process.inputs?.length || 0}</p>
                                                </div>
                                                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-purple-600 font-medium">Logs</p>
                                                    <p className="text-xl font-bold text-purple-700">{process.logs?.length || 0}</p>
                                                </div>
                                                <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-green-600 font-medium">Report Status</p>
                                                    <p className="text-xs font-bold text-green-700 mt-1">
                                                        {process.reportUploaded ? 'Uploaded' : process.reportReceived ? 'Received' : 'Pending'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Report Submission Banner */}
                                            {process.status === 'completed' && !process.reportUploaded && process.addReportAfter && (
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
                                                                setReportProcess(process);
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
                                            {process.status === 'completed' && process.reportUploaded && (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 size={16} className="text-green-600" />
                                                        <p className="text-sm font-semibold text-green-800">Report Submitted</p>
                                                        {process.reportUrl && (
                                                            <a
                                                                href={process.reportUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-green-600 hover:underline ml-auto"
                                                            >
                                                                View Report →
                                                            </a>
                                                        )}
                                                    </div>
                                                    {process.reportUploadedAt && (
                                                        <p className="text-xs text-green-600 mt-1">
                                                            Uploaded on {new Date(process.reportUploadedAt).toLocaleString('en-IN')}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => handleOpenUpdateProgressModal(process)}
                                                    disabled={!process.canStart}
                                                    className="px-3 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <Activity size={14} />
                                                    Update Status & Progress
                                                </button>
                                                <button
                                                    onClick={() => handleOpenInputModal(process)}
                                                    disabled={!process.canStart}
                                                    className="px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={14} />
                                                    Add Input (Consume)
                                                </button>
                                                <button
                                                    onClick={() => handleOpenOutputModal(process)}
                                                    disabled={!process.canStart}
                                                    className="px-3 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <TrendingUp size={14} />
                                                    Add Output (Produce)
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/process-in-work-order/${process._id}`)}
                                                    className="px-3 py-2 text-sm font-semibold bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2"
                                                >
                                                    <ExternalLink size={14} />
                                                    View Details
                                                </button>
                                            </div>

                                            {/* Recent Activity Summary */}
                                            {process.inputs && process.inputs.length > 0 && (
                                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Recent Inputs</p>
                                                    <div className="space-y-1">
                                                        {process.inputs.slice(-2).map((input, idx) => (
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

                                            {process.producedOutputDetails && process.producedOutputDetails.producedQuantity > 0 && (
                                                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                                                    <p className="text-xs font-semibold text-green-700 uppercase mb-2">Produced Output</p>
                                                    <div className="text-xs text-green-800">
                                                        • {process.producedOutputDetails.producedItemName || 'Output'}
                                                        {' - '}
                                                        <span className="font-bold">
                                                            {process.producedOutputDetails.producedQuantity} {process.output?.unit || 'm'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
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
                                            onClick={() => handleUpdateProcess(process._id)}
                                            disabled={updating || !process.canStart}
                                            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {updating ? 'Updating...' : 'Update Process'}
                                        </button>
                                    </div>

                                    {/* Show actual output details if any */}
                                    {process.producedOutputDetails && process.producedOutputDetails.producedQuantity > 0 && (
                                        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                                <CheckCircle2 size={12} />
                                                Actual Production Output
                                            </p>
                                            <div className="text-sm text-emerald-800 space-y-1">
                                                <p>
                                                    <strong>{process.producedOutputDetails.producedQuantity} {process.output?.unit || 'm'}</strong>
                                                    {process.producedOutputDetails.producedItemName && ` - ${process.producedOutputDetails.producedItemName}`}
                                                </p>
                                                {process.producedOutputDetails.producedSpecification && (
                                                    <p className="text-xs">{process.producedOutputDetails.producedSpecification}</p>
                                                )}
                                                {process.producedOutputDetails.qualityGrade && (
                                                    <p className="text-xs">
                                                        Quality: <span className={`font-semibold ${process.producedOutputDetails.qualityGrade === 'A' ? 'text-green-700' :
                                                            process.producedOutputDetails.qualityGrade === 'B' ? 'text-blue-700' :
                                                                process.producedOutputDetails.qualityGrade === 'C' ? 'text-amber-700' :
                                                                    'text-red-700'
                                                            }`}>Grade {process.producedOutputDetails.qualityGrade}</span>
                                                        {process.producedOutputDetails.defectRate > 0 && ` (${process.producedOutputDetails.defectRate}% defect rate)`}
                                                    </p>
                                                )}
                                                {process.producedOutputDetails.storageLocation && (
                                                    <p className="text-xs text-emerald-600 mt-1">
                                                        <MapPin size={10} className="inline mr-1" />
                                                        Stored at: {process.producedOutputDetails.storageLocation}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            {showAddInput && selectedProcess && (
                <AddInputModal
                    tracking={selectedProcess}
                    onClose={() => {
                        setShowAddInput(false);
                        setSelectedProcess(null);
                    }}
                    onSuccess={handleInputAdded}
                />
            )}

            {showAddOutput && selectedProcess && (
                <AddOutputModal
                    tracking={selectedProcess}
                    onClose={() => {
                        setShowAddOutput(false);
                        setSelectedProcess(null);
                    }}
                    onSuccess={handleOutputAdded}
                />
            )}

            {showUpdateProgress && selectedProcess && (
                <UpdateProgressModal
                    tracking={selectedProcess}
                    onClose={() => {
                        setShowUpdateProgress(false);
                        setSelectedProcess(null);
                    }}
                    onSuccess={handleProgressUpdated}
                />
            )}

            {showSubmitReport && reportProcess && (
                <SubmitReportModal
                    tracking={reportProcess}
                    onClose={() => {
                        setShowSubmitReport(false);
                        setReportProcess(null);
                    }}
                    onSuccess={() => {
                        setShowSubmitReport(false);
                        setReportProcess(null);
                        fetchProcesses();
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </>
    );
};

export default ProcessInWorkOrderList;
