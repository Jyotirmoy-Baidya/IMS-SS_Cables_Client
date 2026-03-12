import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, DollarSign } from 'lucide-react';
import api from '../../../api/axiosInstance.js';

/**
 * MaterialCostDisplay - Fetches material and displays cost based on weight
 * @param {string} materialId - Raw Material ObjectId
 * @param {number} weight - Material weight in kg
 * @param {string} type - Material type: 'fresh' | 'reprocess'
 * @param {string} variant - Display variant: 'full' | 'compact' (default: 'full')
 */
const MaterialCostDisplay = ({ materialId, weight = 0, type = 'fresh', variant = 'full' }) => {
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

    // Calculate price and cost
    const pricePerKg = type === 'reprocess'
        ? (material?.reprocessInventory?.avgPricePerKg || 0)
        : (material?.inventory?.avgPricePerKg || 0);
    const totalCost = pricePerKg * weight;

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 size={12} className="animate-spin" />
                Loading...
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle size={12} />
                Error
            </div>
        );
    }

    // No material
    if (!materialId || !material) {
        return (
            <div className="text-xs text-gray-400">
                ₹0.00
            </div>
        );
    }

    // Compact variant - just show the total cost
    if (variant === 'compact') {
        return (
            <div className="text-xs font-semibold text-gray-800">
                ₹{totalCost.toFixed(2)}
            </div>
        );
    }

    // Full variant - show details
    return (
        <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <DollarSign size={12} className="text-blue-500" />
                <span>{material.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs ml-4">
                <span className="text-gray-500">
                    {weight.toFixed(2)} kg × ₹{pricePerKg.toFixed(2)}/kg
                </span>
                <span className="font-bold text-blue-700">
                    ₹{totalCost.toFixed(2)}
                </span>
            </div>
        </div>
    );
};

export default MaterialCostDisplay;
