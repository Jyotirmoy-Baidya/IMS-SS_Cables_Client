import { useState } from 'react';
import { X, FileText, Upload } from 'lucide-react';
import api from '../../api/axiosInstance';

const SubmitReportModal = ({ tracking, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        reportUrl: '',
        reportNotes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.reportUrl.trim() && !formData.reportNotes.trim()) {
            alert('Please provide a report URL or notes');
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/process-tracking/${tracking._id}/submit-report`, {
                ...formData,
                userId: null // Add user context here
            });
            onSuccess();
        } catch (error) {
            alert('Error submitting report: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-indigo-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Submit Process Report</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Process: {tracking.processName}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 flex items-start gap-2">
                            <FileText size={16} className="mt-0.5 flex-shrink-0" />
                            <div>
                                <strong>Process Completed!</strong>
                                <p className="mt-1">Please submit the process report before proceeding to the next process.</p>
                            </div>
                        </div>

                        {/* Report URL */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Report URL <span className="text-gray-400">(Optional)</span>
                            </label>
                            <div className="relative">
                                <Upload size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="url"
                                    value={formData.reportUrl}
                                    onChange={(e) => setFormData({ ...formData, reportUrl: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Link to Google Drive, Dropbox, or other file storage
                            </p>
                        </div>

                        {/* Report Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Report Notes <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.reportNotes}
                                onChange={(e) => setFormData({ ...formData, reportNotes: e.target.value })}
                                rows={5}
                                placeholder="Summary of work completed, observations, issues encountered, quality checks..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                required
                            ></textarea>
                            <p className="text-xs text-gray-500 mt-1">
                                Provide details about the process execution, quality, and any important notes
                            </p>
                        </div>

                        {/* Work Order Info */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-500">Work Order:</span>
                                    <span className="ml-2 font-semibold text-gray-800">{tracking.workOrderNumber}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Status:</span>
                                    <span className="ml-2 font-semibold text-green-600">Completed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            {submitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmitReportModal;
