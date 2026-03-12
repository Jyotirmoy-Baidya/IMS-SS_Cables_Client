import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Check } from 'lucide-react';
import api from '../../../api/axiosInstance.js';

/**
 * RawMaterialSelector - Grid selector for raw materials by type
 * @param {string} materialTypeId - Raw Material Type ObjectId
 * @param {string} selectedMaterialId - Currently selected material ID
 * @param {function} onSelect - Callback when material is selected: (material) => void
 * @param {boolean} show - Whether to show the selector
 */
const RawMaterialSelector = ({ materialTypeId, selectedMaterialId, onSelect, show }) => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    useEffect(() => {
        if (!show || !materialTypeId) {
            setMaterials([]);
            setError(null);
            return;
        }

        const fetchMaterials = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/raw-material/get-by-type/${materialTypeId}`);
                setMaterials(response.data || []);
            } catch (err) {
                console.error('Error fetching materials:', err);
                setError(err.message || 'Failed to load materials');
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, [materialTypeId, show]);

    const handleSelectMaterial = (material) => {
        setSelectedMaterial(material);
    };

    const handleSave = () => {
        if (selectedMaterial && onSelect) {
            onSelect(selectedMaterial);
            setSelectedMaterial(null); // Reset after save
        }
    };

    if (!show) return null;

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-8 mb-3">
                <Loader2 size={16} className="animate-spin" />
                Loading materials...
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                <AlertTriangle size={16} />
                {error}
            </div>
        );
    }

    // No materials found
    if (materials.length === 0) {
        return (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
                <AlertTriangle size={16} />
                No materials found for this type.
            </div>
        );
    }

    return (
        <div className="mb-3">
            <div className="grid grid-cols-2 gap-2 mb-3">
                {materials.map(material => (
                    <button
                        key={material._id}
                        onClick={() => handleSelectMaterial(material)}
                        className={`p-2.5 border-2 rounded-lg text-left text-sm transition-colors ${
                            selectedMaterial?._id === material._id
                                ? 'bg-blue-50 border-blue-500'
                                : selectedMaterialId === material._id
                                ? 'bg-green-50 border-green-500'
                                : 'bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                        }`}
                    >
                        <div className="font-semibold text-gray-800">{material.name}</div>
                        {material.specifications?.dimensions && (
                            <div className="text-xs text-gray-500 mt-0.5">{material.specifications.dimensions}</div>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs font-bold text-blue-700">
                                ₹{(material.inventory?.avgPricePerKg || 0).toFixed(2)}/kg
                            </span>
                            {material.inventory?.totalWeight > 0 && (
                                <span className="text-xs text-emerald-600 font-medium">
                                    {material.inventory.totalWeight.toFixed(1)} kg
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {selectedMaterial && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-300 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                        <Check size={16} className="text-blue-600" />
                        <span>Selected: <strong>{selectedMaterial.name}</strong></span>
                    </div>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Save Selection
                    </button>
                </div>
            )}
        </div>
    );
};

export default RawMaterialSelector;
