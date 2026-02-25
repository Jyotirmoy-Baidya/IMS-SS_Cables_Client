import { useState } from 'react';
import { X, AlertTriangle, Package, RotateCcw } from 'lucide-react';
import api from '../../api/axiosInstance';

const WorkOrderCancellationModal = ({ workOrder, onClose, onSuccess }) => {
    const [materialReturns, setMaterialReturns] = useState(
        workOrder.allocatedMaterials?.map(mat => ({
            ...mat,
            returnQuantity: mat.allocatedQuantity, // Default: return all
            returnAll: true
        })) || []
    );
    const [cancelling, setCancelling] = useState(false);
    const [reason, setReason] = useState('');

    const handleReturnAllToggle = (index, checked) => {
        const updated = [...materialReturns];
        updated[index].returnAll = checked;
        if (checked) {
            updated[index].returnQuantity = updated[index].allocatedQuantity;
        }
        setMaterialReturns(updated);
    };

    const handleReturnQuantityChange = (index, value) => {
        const updated = [...materialReturns];
        const quantity = parseFloat(value) || 0;
        updated[index].returnQuantity = Math.min(quantity, updated[index].allocatedQuantity);
        updated[index].returnAll = quantity === updated[index].allocatedQuantity;
        setMaterialReturns(updated);
    };

    const handleCancel = async () => {
        try {
            setCancelling(true);

            // Deallocate materials
            const allocationsToReturn = materialReturns.map(mr => ({
                materialLotId: mr.materialLotId,
                allocatedQuantity: mr.returnQuantity
            }));

            await api.post('/material-allocation/deallocate', { allocations: allocationsToReturn });

            // Update work order status to cancelled
            await api.patch(`/work-order/patch-work-order/${workOrder._id}`, {
                status: 'cancelled',
                notes: workOrder.notes + `\n\n[CANCELLED] Reason: ${reason || 'No reason provided'}`
            });

            alert('Work order cancelled successfully. Materials returned to stock.');
            onSuccess?.();
            onClose();
        } catch (err) {
            alert('Failed to cancel work order: ' + err.message);
        } finally {
            setCancelling(false);
        }
    };

    const totalAllocated = materialReturns.reduce((sum, mr) => sum + mr.allocatedQuantity, 0);
    const totalReturning = materialReturns.reduce((sum, mr) => sum + mr.returnQuantity, 0);
    const totalUsed = totalAllocated - totalReturning;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-red-50">
                    <div>
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={24} className="text-red-600" />
                            <h2 className="text-xl font-bold text-gray-800">Cancel Work Order</h2>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                            {workOrder.workOrderNumber} • Specify materials to return to stock
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-800">
                            <strong>Note:</strong> Specify how much of each material was NOT used and should be returned to stock.
                            By default, all allocated materials will be returned.
                        </p>
                    </div>

                    {/* Cancellation Reason */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Cancellation Reason
                        </label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Enter reason for cancellation..."
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                        />
                    </div>

                    {/* Materials to Return */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">Materials to Return to Stock</p>

                        {materialReturns.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-400">
                                No materials allocated to this work order
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {materialReturns.map((mat, idx) => (
                                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start gap-4">
                                            <Package size={20} className="text-gray-400 mt-1" />

                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800 mb-1">{mat.materialName}</p>
                                                <p className="text-xs text-gray-500 mb-3">
                                                    Allocated: <span className="font-semibold">{mat.allocatedQuantity} {mat.unit}</span>
                                                </p>

                                                <div className="flex items-center gap-4">
                                                    {/* Return All Checkbox */}
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={mat.returnAll}
                                                            onChange={e => handleReturnAllToggle(idx, e.target.checked)}
                                                            className="w-4 h-4 rounded"
                                                        />
                                                        <span className="text-sm text-gray-700">Return All</span>
                                                    </label>

                                                    {/* Quantity Input */}
                                                    <div className="flex-1 max-w-xs">
                                                        <label className="block text-xs text-gray-500 mb-1">
                                                            Quantity to Return ({mat.unit})
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={mat.allocatedQuantity}
                                                            step="0.01"
                                                            value={mat.returnQuantity}
                                                            onChange={e => handleReturnQuantityChange(idx, e.target.value)}
                                                            disabled={mat.returnAll}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    {materialReturns.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600 text-xs">Total Allocated</p>
                                    <p className="text-lg font-bold text-gray-800">{totalAllocated.toFixed(2)} kg</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-xs">Material Used</p>
                                    <p className="text-lg font-bold text-red-700">{totalUsed.toFixed(2)} kg</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-xs">Returning to Stock</p>
                                    <p className="text-lg font-bold text-emerald-700">{totalReturning.toFixed(2)} kg</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={cancelling}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                        Keep Work Order
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        <RotateCcw size={16} />
                        {cancelling ? 'Cancelling...' : 'Cancel Work Order & Return Materials'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderCancellationModal;
