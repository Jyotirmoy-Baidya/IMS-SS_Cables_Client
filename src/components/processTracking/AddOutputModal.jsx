import { useState } from 'react';
import { X, Package, Box } from 'lucide-react';
import api from '../../api/axiosInstance';

const AddOutputModal = ({ tracking, onClose, onSuccess }) => {
    const [outputType, setOutputType] = useState('wip-inventory');
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState({ weight: 0, length: 0, unit: 'kg' });
    const [specifications, setSpecifications] = useState('');
    const [storageLocation, setStorageLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!itemName.trim()) {
            alert('Please enter item name');
            return;
        }

        if (quantity.weight === 0 && quantity.length === 0) {
            alert('Please enter quantity produced');
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                outputType,
                itemName: itemName.trim(),
                quantity,
                specifications: specifications.trim(),
                storageLocation: storageLocation.trim(),
                notes: notes.trim(),
                producedBy: null // Can add user context here
            };

            await api.post(`/process-tracking/${tracking._id}/outputs`, payload);
            onSuccess();
        } catch (error) {
            alert('Error adding output: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-green-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Add Output (Produce Item)</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Process: {tracking.processName}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Output Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Output Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setOutputType('wip-inventory')}
                                    className={`px-4 py-3 border-2 rounded-lg text-sm font-semibold transition ${
                                        outputType === 'wip-inventory'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Package size={16} className="inline mr-2" />
                                    WIP Inventory
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOutputType('finished-product')}
                                    className={`px-4 py-3 border-2 rounded-lg text-sm font-semibold transition ${
                                        outputType === 'finished-product'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Box size={16} className="inline mr-2" />
                                    Finished Product
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {outputType === 'wip-inventory'
                                    ? 'Item will be added to WIP inventory for use in subsequent processes'
                                    : 'Item is ready for delivery/shipment'}
                            </p>
                        </div>

                        {/* Item Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Item Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                placeholder="e.g., Insulated Wire 2.5mm, Sheathed Cable, etc."
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Quantity Produced */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Quantity Produced <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={quantity.weight}
                                        onChange={(e) => setQuantity({ ...quantity, weight: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Length (m)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={quantity.length}
                                        onChange={(e) => setQuantity({ ...quantity, length: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Unit</label>
                                    <select
                                        value={quantity.unit}
                                        onChange={(e) => setQuantity({ ...quantity, unit: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="kg">kg</option>
                                        <option value="m">m</option>
                                        <option value="pcs">pcs</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Specifications */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Specifications
                            </label>
                            <textarea
                                value={specifications}
                                onChange={(e) => setSpecifications(e.target.value)}
                                rows={2}
                                placeholder="e.g., Diameter: 2.5mm, Color: Red, Insulation thickness: 0.8mm"
                                className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                            ></textarea>
                        </div>

                        {/* Storage Location */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Storage Location
                            </label>
                            <input
                                type="text"
                                value={storageLocation}
                                onChange={(e) => setStorageLocation(e.target.value)}
                                placeholder="e.g., Warehouse A, Shelf 3, Bay 12"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Add any notes about this production..."
                                className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            {submitting ? 'Adding...' : 'Add Output'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddOutputModal;
