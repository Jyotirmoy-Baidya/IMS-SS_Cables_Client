import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import api from '../../api/axiosInstance';

const InventoryItemDisplay = ({ wipInventoryItemId, finishedGoodId }) => {
    const [itemData, setItemData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchItemData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (wipInventoryItemId) {
                    const response = await api.get(`/wip-inventory/${wipInventoryItemId}`);
                    setItemData({ type: 'WIP Inventory', data: response.data });
                } else if (finishedGoodId) {
                    const response = await api.get(`/finished-goods/${finishedGoodId}`);
                    setItemData({ type: 'Finished Good', data: response.data });
                }
            } catch (err) {
                setError(err.message || 'Failed to fetch item data');
            } finally {
                setLoading(false);
            }
        };

        if (wipInventoryItemId || finishedGoodId) {
            fetchItemData();
        }
    }, [wipInventoryItemId, finishedGoodId]);

    if (!wipInventoryItemId && !finishedGoodId) {
        return null;
    }

    if (loading) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500">Loading inventory item...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-600">Error: {error}</p>
            </div>
        );
    }

    if (!itemData) {
        return null;
    }

    const { type, data } = itemData;
    const item = data.data || data;

    return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
                <Package size={14} className="text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700 uppercase">
                    {type} Created
                </p>
            </div>
            <div className="text-xs text-emerald-800 space-y-1">
                <p className="font-mono text-emerald-600">
                    ID: {wipInventoryItemId || finishedGoodId}
                </p>
                <p className="font-medium">
                    {item.itemName || item.productName || 'N/A'}
                </p>
                {item.specifications && (
                    <p className="text-emerald-700">
                        Spec: {item.specifications}
                    </p>
                )}
                {item.quantity && (
                    <p className="text-emerald-700">
                        Quantity: {item.quantity.length || item.quantity.produced || 0} {item.quantity.unit || 'm'}
                    </p>
                )}
                {item.storageLocation && (
                    <p className="text-emerald-700">
                        Location: {item.storageLocation}
                    </p>
                )}
                <p className="mt-1 text-emerald-600 italic">
                    Quantity updates automatically when you update progress
                </p>
            </div>
        </div>
    );
};

export default InventoryItemDisplay;
