import { useState, useEffect } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import api from '../../../api/axiosInstance';

const AddInputModal = ({ process, onClose, onSuccess }) => {
    const [sourceType, setSourceType] = useState('raw-material');
    const [allocatedMaterials, setAllocatedMaterials] = useState([]);
    const [wipItems, setWIPItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [selectedWIP, setSelectedWIP] = useState(null);
    const [quantityUsed, setQuantityUsed] = useState({ weight: 0, length: 0, unit: 'kg' });
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchData();
    }, [process.workOrderId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Extract workOrderId - handle both string and object cases
            const workOrderId = typeof process.workOrderId === 'object'
                ? process.workOrderId._id || process.workOrderId
                : process.workOrderId;

            console.log('Fetching for work order ID:', workOrderId);

            // Fetch work order to get allocated materials
            const woRes = await api.get(`/work-order/get-work-order/${workOrderId}`);
            console.log('Work Order Response:', woRes);

            const workOrder = woRes.data || woRes;
            setAllocatedMaterials(workOrder.allocatedMaterials || []);

            // Fetch WIP inventory for this work order
            const wipRes = await api.get(`/wip-inventory?workOrderId=${workOrderId}`);
            const wipData = wipRes.data || wipRes;
            setWIPItems(Array.isArray(wipData) ? wipData : []);
        } catch (err) {
            console.error('Error fetching data:', err);
            alert('Error loading materials: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (sourceType === 'raw-material' && !selectedMaterial) {
            alert('Please select a material');
            return;
        }

        if (sourceType === 'wip-inventory' && !selectedWIP) {
            alert('Please select a WIP item');
            return;
        }

        if (quantityUsed.weight === 0 && quantityUsed.length === 0) {
            alert('Please enter quantity used');
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                sourceType,
                quantityUsed,
                notes
            };

            if (sourceType === 'raw-material') {
                payload.allocatedMaterialId = selectedMaterial._id;
                payload.materialId = selectedMaterial.materialId?._id || selectedMaterial.materialId;
                payload.materialName = selectedMaterial.materialId?.name || selectedMaterial.materialName;
                payload.lotId = selectedMaterial.materialLotId?._id || selectedMaterial.materialLotId;
                payload.lotNumber = selectedMaterial.materialLotId?.lotNumber || selectedMaterial.lotNumber;
            } else {
                payload.wipInventoryId = selectedWIP._id;
                payload.wipItemName = selectedWIP.itemName;
            }

            // Use new route format: /:id/add-input
            await api.post(`/process-in-work-order/${process._id}/add-input`, payload);
            alert('Input added successfully');
            onSuccess();
        } catch (error) {
            alert('Error adding input: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleMaterialSelect = (material) => {
        setSelectedMaterial(material);
        // Set initial quantity to allocated amount
        const availableWeight = (material.allocatedWeight || 0) - (material.consumedQuantity?.weight || 0);
        const availableLength = (material.allocatedLength || 0) - (material.consumedQuantity?.length || 0);

        setQuantityUsed({
            weight: availableWeight > 0 ? availableWeight : 0,
            length: availableLength > 0 ? availableLength : 0,
            unit: 'kg'
        });
    };

    const handleWeightChange = (value) => {
        if (!selectedMaterial) {
            setQuantityUsed({ ...quantityUsed, weight: value });
            return;
        }

        const maxWeight = (selectedMaterial.allocatedWeight || 0) - (selectedMaterial.consumedQuantity?.weight || 0);

        if (value > maxWeight) {
            alert(`Cannot exceed available weight: ${maxWeight.toFixed(2)} kg`);
            setQuantityUsed({ ...quantityUsed, weight: maxWeight });
        } else {
            setQuantityUsed({ ...quantityUsed, weight: value });
        }
    };

    const handleLengthChange = (value) => {
        if (!selectedMaterial) {
            setQuantityUsed({ ...quantityUsed, length: value });
            return;
        }

        const maxLength = (selectedMaterial.allocatedLength || 0) - (selectedMaterial.consumedQuantity?.length || 0);

        if (value > maxLength) {
            alert(`Cannot exceed available length: ${maxLength.toFixed(2)} m`);
            setQuantityUsed({ ...quantityUsed, length: maxLength });
        } else {
            setQuantityUsed({ ...quantityUsed, length: value });
        }
    };

    const handleWIPSelect = (wip) => {
        setSelectedWIP(wip);
        setQuantityUsed({
            weight: wip.quantity?.weight || 0,
            length: wip.quantity?.length || 0,
            unit: wip.quantity?.unit || 'kg'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Add Input (Consume Material)</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Process: {process.processName}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Source Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Source Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSourceType('raw-material');
                                        setSelectedMaterial(null);
                                        setSelectedWIP(null);
                                    }}
                                    className={`px-4 py-3 border-2 rounded-lg text-sm font-semibold transition ${sourceType === 'raw-material'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Package size={16} className="inline mr-2" />
                                    Raw Material (Allocated)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSourceType('wip-inventory');
                                        setSelectedMaterial(null);
                                        setSelectedWIP(null);
                                    }}
                                    className={`px-4 py-3 border-2 rounded-lg text-sm font-semibold transition ${sourceType === 'wip-inventory'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Package size={16} className="inline mr-2" />
                                    WIP Inventory
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-sm text-gray-500 mt-2">Loading materials...</p>
                            </div>
                        ) : (
                            <>
                                {/* Raw Material Selection */}
                                {sourceType === 'raw-material' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Select Allocated Material
                                        </label>
                                        {allocatedMaterials.length === 0 ? (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                                                <AlertCircle size={24} className="mx-auto text-amber-600 mb-2" />
                                                <p className="text-sm text-amber-700">No materials allocated to this work order</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                                                {allocatedMaterials.map((material) => (
                                                    <div
                                                        key={material._id}
                                                        onClick={() => handleMaterialSelect(material)}
                                                        className={`p-3 border-2 rounded-lg cursor-pointer transition ${selectedMaterial?._id === material._id
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-semibold text-gray-800">
                                                                    {material.materialId?.name || material.materialName || 'Unknown Material'}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Lot: {material.materialLotId?.lotNumber || material.lotNumber || 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-bold text-blue-700">
                                                                    {material.allocatedWeight?.toFixed(2) || 0} kg
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Consumed: {material.consumedQuantity?.weight?.toFixed(2) || 0} kg
                                                                </p>
                                                                {material.isConsumed && (
                                                                    <span className="text-xs text-emerald-600">Fully Consumed</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* WIP Selection */}
                                {sourceType === 'wip-inventory' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Select WIP Item
                                        </label>
                                        {wipItems.length === 0 ? (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                                                <AlertCircle size={24} className="mx-auto text-amber-600 mb-2" />
                                                <p className="text-sm text-amber-700">No WIP items available for this work order</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                                                {wipItems.map((wip) => (
                                                    <div
                                                        key={wip._id}
                                                        onClick={() => handleWIPSelect(wip)}
                                                        className={`p-3 border-2 rounded-lg cursor-pointer transition ${selectedWIP?._id === wip._id
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-semibold text-gray-800">{wip.itemName}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {wip.processName} • {wip.specifications}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-bold text-green-700">
                                                                    {wip.quantity?.weight?.toFixed(2) || wip.quantity?.length?.toFixed(2) || 0} {wip.quantity?.unit}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Quantity Used */}
                                {(selectedMaterial || selectedWIP) && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity Used</label>
                                        {selectedMaterial && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                                                <p className="text-xs text-blue-700">
                                                    <strong>Available:</strong> {((selectedMaterial.allocatedWeight || 0) - (selectedMaterial.consumedQuantity?.weight || 0)).toFixed(2)} kg •
                                                    {((selectedMaterial.allocatedLength || 0) - (selectedMaterial.consumedQuantity?.length || 0)).toFixed(2)} m
                                                </p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Weight (kg)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={selectedMaterial ? (selectedMaterial.allocatedWeight || 0) - (selectedMaterial.consumedQuantity?.weight || 0) : undefined}
                                                    value={quantityUsed.weight}
                                                    onChange={(e) => sourceType === 'raw-material' ? handleWeightChange(parseFloat(e.target.value) || 0) : setQuantityUsed({ ...quantityUsed, weight: parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Length (m)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={selectedMaterial ? (selectedMaterial.allocatedLength || 0) - (selectedMaterial.consumedQuantity?.length || 0) : undefined}
                                                    value={quantityUsed.length}
                                                    onChange={(e) => sourceType === 'raw-material' ? handleLengthChange(parseFloat(e.target.value) || 0) : setQuantityUsed({ ...quantityUsed, length: parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Unit</label>
                                                <select
                                                    value={quantityUsed.unit}
                                                    onChange={(e) => setQuantityUsed({ ...quantityUsed, unit: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                >
                                                    <option value="kg">kg</option>
                                                    <option value="m">m</option>
                                                    <option value="pcs">pcs</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                        placeholder="Add any notes about this consumption..."
                                        className="w-full px-3 py-2 border rounded-lg resize-none"
                                    ></textarea>
                                </div>
                            </>
                        )}
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
                            disabled={submitting || (!selectedMaterial && !selectedWIP)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            {submitting ? 'Adding...' : 'Add Input'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddInputModal;
