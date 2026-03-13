import { useState, useEffect } from 'react';
import { X, Package, MapPin } from 'lucide-react';
import api from '../../api/axiosInstance';

const CreateOutputProductModal = ({ process, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        itemName: '',
        specifications: '',
        storageLocation: '',
        quantity: 0
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (process) {
            setFormData({
                itemName: process.output?.calculatedItemName || '',
                specifications: process.output?.calculatedSpecification || '',
                storageLocation: '',
                quantity: process.output?.calculatedQuantity || 0
            });
        }
    }, [process]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.itemName.trim()) {
            alert('Item name is required');
            return;
        }

        if (!formData.storageLocation.trim()) {
            alert('Storage location is required');
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/process-in-work-order/${process._id}/create-output-product`, formData);
            alert(`${process.output?.outputType === 'intermediate' ? 'WIP Inventory' : 'Finished Good'} created successfully!`);
            if (onSuccess) onSuccess();
        } catch (err) {
            alert('Failed to create output product: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!process) return null;

    const outputType = process.output?.outputType || 'none';
    const productLabel = outputType === 'intermediate' ? 'WIP Inventory Item' : 'Finished Good';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Package size={20} className="text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Create {productLabel}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Process: {process.processName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Info Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> This will create a {productLabel.toLowerCase()} that can be used as input for subsequent processes or final delivery.
                        </p>
                    </div>

                    {/* Item Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Item Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.itemName}
                            onChange={e => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                            placeholder="e.g., Drawn 100 sq mm wire"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                            required
                        />
                    </div>

                    {/* Specifications */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Specifications
                        </label>
                        <textarea
                            value={formData.specifications}
                            onChange={e => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
                            placeholder="e.g., 24 sq mm, 7 wires"
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 resize-none"
                        />
                    </div>

                    {/* Initial Quantity */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Initial Quantity ({process.output?.unit || 'm'})
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.quantity}
                            onChange={e => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Expected: {process.output?.calculatedQuantity || 0} {process.output?.unit || 'm'}
                        </p>
                    </div>

                    {/* Storage Location */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <MapPin size={14} />
                            Storage Location <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.storageLocation}
                            onChange={e => setFormData(prev => ({ ...prev, storageLocation: e.target.value }))}
                            placeholder="e.g., Warehouse A, Shelf 3, Bin 12"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                            required
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={submitting}
                        >
                            {submitting ? 'Creating...' : `Create ${productLabel}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateOutputProductModal;
