import { useEffect, useState } from 'react';
import { Package, TrendingUp, Boxes, AlertCircle } from 'lucide-react';
import useMaterialRequirementsStore from '../../../store/materialRequirementsStore';

const MaterialSummary = ({ quotation }) => {
    const { materialsRequiredInQuotation, calculateAll } = useMaterialRequirementsStore();
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
                console.error('Error calculating material materialsRequiredInQuotation:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMaterialRequirements();
    }, [quotation]); // eslint-disable-line react-hooks/exhaustive-deps




    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (materialsRequiredInQuotation.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Package size={20} className="text-gray-600" />
                    <h2 className="text-lg font-bold text-gray-800">Material Requirements</h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <AlertCircle size={16} />
                    <span>No materials calculated yet. Add cores or sheaths to see materialsRequiredInQuotation.</span>
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
                                <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wide pb-3">Used In</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {materialsRequiredInQuotation.map((req, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3">
                                        <div className="font-medium text-gray-800">{req.materialName}</div>
                                    </td>
                                    <td className="py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${req.category === 'metal' ? 'bg-orange-100 text-orange-700' :
                                            req.category === 'insulation' || req.category == 'plastic' ? 'bg-blue-100 text-blue-700' :
                                                'bg-purple-100 text-purple-700'
                                            }`}>
                                            {req.category}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${req.type === 'fresh' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {req.type}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-medium text-gray-800">
                                        {req.weight}
                                    </td>
                                    <td className="py-3 text-right text-gray-600">
                                        ₹{(req.pricePerKg || 0).toFixed(2)}
                                    </td>
                                    <td className="py-3 text-right font-semibold text-emerald-600">
                                        ₹{(req.totalCost || 0).toFixed(2)}
                                    </td>
                                    <td className="flex justify-end py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-200 text-blue-900 ml-auto`}>
                                            {req.coreName}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            </div>
        </div >
    );
};

export default MaterialSummary;
