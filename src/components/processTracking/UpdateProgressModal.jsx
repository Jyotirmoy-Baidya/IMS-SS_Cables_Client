import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axiosInstance';

const UpdateProgressModal = ({ tracking, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        progressPercentage: tracking.progressPercentage || 0,
        status: tracking.status || 'pending'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/process-tracking/${tracking._id}/progress`, formData);
            onSuccess();
        } catch (error) {
            alert('Error updating progress: ' + error.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-purple-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Update Process Status & Progress</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Process: {tracking.processName}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Status Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                            >
                                <option value="pending">⏸️ Pending - Not Started</option>
                                <option value="in-progress">▶️ In Progress - Working</option>
                                <option value="completed">✅ Completed - Finished</option>
                                <option value="on-hold">⏯️ On Hold - Paused</option>
                            </select>
                        </div>

                        {/* Progress Percentage */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Progress Percentage
                            </label>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-purple-600">
                                        {formData.progressPercentage}%
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {formData.progressPercentage === 0 && 'Not Started'}
                                        {formData.progressPercentage > 0 && formData.progressPercentage < 100 && 'In Progress'}
                                        {formData.progressPercentage === 100 && 'Complete'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={formData.progressPercentage}
                                    onChange={(e) => setFormData({ ...formData, progressPercentage: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>0%</span>
                                    <span>25%</span>
                                    <span>50%</span>
                                    <span>75%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                            <strong>Note:</strong> This only updates the process status and progress.
                            To record produced items, use "Add Output (Produce)" button.
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
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                        >
                            Update Status & Progress
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateProgressModal;
