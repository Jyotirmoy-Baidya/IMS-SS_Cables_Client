import { useEffect, useState } from 'react';
import { Package, TrendingUp, Boxes, AlertCircle } from 'lucide-react';
import useMaterialRequirementsStore from '../../../store/materialRequirementsStore';

const MaterialSummary = ({ quotation }) => {
    const { requirements, calculateAll } = useMaterialRequirementsStore();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadMaterialRequirements = async () => {
            if (!quotation || (!quotation.cores?.length && !quotation.sheathGroups?.length)) {
                return;
            }

            setLoading(true);
            try {
                await calculateAll(quotation);
            } catch (error) {
                console.error('Error calculating material requirements:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMaterialRequirements();
    }, [quotation]); // eslint-disable-line react-hooks/exhaustive-deps

    // Calculate totals
    const totalWeight = requirements.reduce((sum, req) => sum + req.totalWeight, 0);
    const totalCost = requirements.reduce((sum, req) => sum + (req.totalCost || 0), 0);
    const freshMaterials = requirements.filter(req => req.type === 'fresh');
    const reprocessMaterials = requirements.filter(req => req.type === 'reprocess');

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (requirements.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Package size={20} className="text-gray-600" />
                    <h2 className="text-lg font-bold text-gray-800">Material Requirements</h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <AlertCircle size={16} />
                    <span>No materials calculated yet. Add cores or sheaths to see requirements.</span>
                </div>
            </div>
        );
    }

    return (
        <div id="material-summary" className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Material Requirements</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Raw materials needed for production</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xs text-gray-500">Total Weight</div>
                            <div className="text-lg font-bold text-gray-800">{totalWeight.toFixed(2)} kg</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500">Total Cost</div>
                            <div className="text-lg font-bold text-emerald-600">₹{totalCost.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 p-6 border-b border-gray-100 bg-gray-50">
                <div className="bg-white rounded-lg border border-emerald-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-emerald-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fresh Materials</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{freshMaterials.length}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {freshMaterials.reduce((sum, req) => sum + req.totalWeight, 0).toFixed(2)} kg
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-purple-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Boxes size={16} className="text-purple-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Reprocess Materials</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{reprocessMaterials.length}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {reprocessMaterials.reduce((sum, req) => sum + req.totalWeight, 0).toFixed(2)} kg
                    </div>
                </div>
            </div>

            {/* Materials Table */}
            <div className="p-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide pb-3">Material</th>
                                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide pb-3">Category</th>
                                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide pb-3">Type</th>
                                <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wide pb-3">Weight (kg)</th>
                                <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wide pb-3">Price/kg</th>
                                <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wide pb-3">Total Cost</th>
                                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide pb-3">Used In</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requirements.map((req, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3">
                                        <div className="font-medium text-gray-800">{req.materialName}</div>
                                    </td>
                                    <td className="py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            req.category === 'metal' ? 'bg-orange-100 text-orange-700' :
                                            req.category === 'insulation' ? 'bg-blue-100 text-blue-700' :
                                            'bg-purple-100 text-purple-700'
                                        }`}>
                                            {req.category}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            req.type === 'fresh' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                            {req.type}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-medium text-gray-800">
                                        {req.totalWeight.toFixed(4)}
                                    </td>
                                    <td className="py-3 text-right text-gray-600">
                                        ₹{(req.pricePerKg || 0).toFixed(2)}
                                    </td>
                                    <td className="py-3 text-right font-semibold text-emerald-600">
                                        ₹{(req.totalCost || 0).toFixed(2)}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {req.usedIn?.slice(0, 3).map((usage, i) => (
                                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                                    {usage.context?.label || 'N/A'}
                                                </span>
                                            ))}
                                            {req.usedIn?.length > 3 && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                                    +{req.usedIn.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-gray-300 font-bold">
                                <td colSpan="3" className="py-4 text-gray-800">Total</td>
                                <td className="py-4 text-right text-gray-800">{totalWeight.toFixed(4)} kg</td>
                                <td className="py-4"></td>
                                <td className="py-4 text-right text-emerald-600">₹{totalCost.toFixed(2)}</td>
                                <td className="py-4"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MaterialSummary;
