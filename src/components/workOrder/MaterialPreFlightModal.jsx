import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Package, Loader } from 'lucide-react';
import api from '../../api/axiosInstance';

const MaterialPreFlightModal = ({ quotation, onClose, onProceed }) => {
    const [checking, setChecking] = useState(true);
    const [availability, setAvailability] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkMaterialAvailability();
    }, []);

    const checkMaterialAvailability = async () => {
        try {
            setChecking(true);
            setError(null);

            // Use stored required materials from quotation
            const materialRequirements = quotation.requiredMaterialsQuantity || [];

            if (materialRequirements.length === 0) {
                setError('No materials found in quotation');
                return;
            }

            // Check availability for these materials
            const availRes = await api.post('/material-allocation/check-availability', {
                materialRequirements: materialRequirements.map(mat => ({
                    materialId: mat.materialId,
                    requiredWeight: mat.requiredWeight
                }))
            });

            setAvailability(availRes);
        } catch (err) {
            setError(err.message || 'Failed to check material availability');
        } finally {
            setChecking(false);
        }
    };

    const handleProceed = async () => {
        const allSufficient = availability?.data?.allSufficient;
        if (!allSufficient) {
            const confirmed = window.confirm(
                'Warning: Some materials are insufficient. Do you want to proceed anyway? ' +
                'The work order will be created but materials may not be fully allocated.'
            );
            if (!confirmed) return;
        }
        onProceed();
    };

    if (checking) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
                    <div className="flex flex-col items-center gap-4">
                        <Loader size={48} className="text-blue-600 animate-spin" />
                        <p className="text-lg font-semibold text-gray-800">Checking Material Availability...</p>
                        <p className="text-sm text-gray-500">Please wait while we verify stock levels</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle size={32} className="text-red-600" />
                            <h2 className="text-xl font-bold text-gray-800">Error</h2>
                        </div>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const allSufficient = availability?.data?.allSufficient;
    const materials = availability?.data?.materialTypes || [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Material Availability Check</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Quotation: {quotation.quoteNumber} • {availability?.processCount || 0} processes
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Status Banner */}
                <div className={`px-6 py-4 ${allSufficient ? 'bg-emerald-50 border-b border-emerald-200' : 'bg-red-50 border-b border-red-200'}`}>
                    <div className="flex items-center gap-3">
                        {allSufficient ? (
                            <>
                                <CheckCircle2 size={24} className="text-emerald-600" />
                                <div>
                                    <p className="font-semibold text-emerald-900">All Materials Sufficient</p>
                                    <p className="text-xs text-emerald-700">You can proceed with work order creation</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={24} className="text-red-600" />
                                <div>
                                    <p className="font-semibold text-red-900">Insufficient Materials</p>
                                    <p className="text-xs text-red-700">Some materials are not available in sufficient quantity</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Materials Table */}
                <div className="flex-1 overflow-y-auto p-6">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Material</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Required</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Available</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Allocated</th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Lots</th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {materials.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                                        No materials required for this work order
                                    </td>
                                </tr>
                            ) : materials.map((mat, idx) => (
                                <tr key={idx} className={mat.isSufficient ? '' : 'bg-red-50'}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Package size={14} className="text-gray-400" />
                                            <span className="font-medium text-gray-800">{mat.materialName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded capitalize">
                                            {mat.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-blue-700">
                                        {mat.requiredWeight?.toFixed(2) || '0.00'} kg
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`font-semibold ${mat.isSufficient ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {mat.totalAvailable.toFixed(2)} kg
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-amber-600">
                                        {mat.totalAllocated.toFixed(2)} kg
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600">
                                        {mat.lotCount}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {mat.isSufficient ? (
                                            <CheckCircle2 size={18} className="text-emerald-600 inline" />
                                        ) : (
                                            <AlertTriangle size={18} className="text-red-600 inline" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleProceed}
                        className={`px-5 py-2 text-sm font-semibold rounded-lg ${
                            allSufficient
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-amber-600 text-white hover:bg-amber-700'
                        }`}
                    >
                        {allSufficient ? 'Proceed with Work Order' : 'Proceed Anyway'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaterialPreFlightModal;
