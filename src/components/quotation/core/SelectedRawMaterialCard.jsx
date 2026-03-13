import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../../api/axiosInstance';

/**
 * SelectedRawMaterialCard - Displays raw material details with pricing
 * @param {string} materialId - Raw Material ObjectId
 * @param {string} variant - Display variant: 'full' | 'compact' (default: 'full')
 */
const SelectedRawMaterialCard = ({ materialId, variant = 'full' }) => {
    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {

        if (!materialId) {
            setMaterial(null);
            setError(null);
            return;
        }

        const fetchMaterial = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/raw-material/get-one-material/${materialId}`);
                setMaterial(response.data);
            } catch (err) {
                console.error('Error fetching material:', err);
                setError(err.message || 'Failed to load material');
            } finally {
                setLoading(false);
            }
        };

        fetchMaterial();
    }, [materialId]);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
                <Loader2 size={13} className="animate-spin" />
                Loading material...
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                <AlertTriangle size={13} />
                {error}
            </div>
        );
    }

    // No material ID provided
    if (!materialId) {
        return (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                <AlertTriangle size={13} />
                No material selected — material cost will be ₹0.
            </div>
        );
    }

    // Material not found
    if (!material) {
        return null;
    }

    // Compact variant
    if (variant === 'compact') {
        return (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">{material.name}</span>
                </div>
                <p className="text-xs font-bold text-blue-700">₹{(material.inventory?.avgPricePerKg || 0).toFixed(2)}/kg</p>
            </div>
        );
    }

    // Full variant (default)
    return (
        <div className="flex items-start justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
            <div>
                <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">{material.name}</span>
                </div>
                {material.specifications?.dimensions && (
                    <p className="text-xs text-blue-500 mt-0.5 ml-5">{material.specifications.dimensions}</p>
                )}
            </div>
            <div className="text-right shrink-0 ml-4">
                <p className="text-xs font-bold text-blue-700">₹{(material.inventory?.avgPricePerKg || 0).toFixed(2)}/kg</p>
                {material.inventory?.lastPricePerKg > 0 && (
                    <p className="text-xs text-gray-400">Last: ₹{material.inventory.lastPricePerKg}/kg</p>
                )}
            </div>
        </div>
    );
};

export default SelectedRawMaterialCard;
