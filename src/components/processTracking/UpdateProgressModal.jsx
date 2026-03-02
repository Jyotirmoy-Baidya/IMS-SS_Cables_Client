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
            <div className="bg-white rounded-xl max-w-md w-full">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Update Progress</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="on-hold">On Hold</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">
                            Progress: {formData.progressPercentage}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.progressPercentage}
                            onChange={(e) => setFormData({ ...formData, progressPercentage: parseInt(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateProgressModal;
