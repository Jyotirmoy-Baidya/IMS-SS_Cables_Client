import { useState, useEffect } from 'react';
import api from '../../../api/axiosInstance';

/**
 * CustomerSelector component
 * Displays a customer selection dropdown with customer details preview
 *
 * @param {Object} props
 * @param {string} props.selectedCustomerId - Currently selected customer ID
 * @param {Function} props.setSelectedCustomerId - Callback to update selected customer ID
 */
const CustomerSelector = ({ selectedCustomerId, setSelectedCustomerId }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch customers on component mount
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get('customer/get-all-customer');
                setCustomers(response.data || []);
            } catch (err) {
                console.error('Error fetching customers:', err);
                setError(err.message || 'Failed to load customers');
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    // Get selected customer details
    const selectedCustomer = customers.find(c => c._id === selectedCustomerId);
    const primaryContact = selectedCustomer?.contacts?.find(ct => ct.isPrimary) || selectedCustomer?.contacts?.[0];

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Customer
                    </label>
                    {loading ? (
                        <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-400">
                            Loading customers...
                        </div>
                    ) : error ? (
                        <div className="w-full px-3 py-2.5 border border-red-200 rounded-lg text-sm bg-red-50 text-red-600">
                            {error}
                        </div>
                    ) : (
                        <select
                            value={selectedCustomerId}
                            onChange={e => setSelectedCustomerId(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">— Select customer (optional) —</option>
                            {customers.filter(c => c.isActive !== false).map(c => (
                                <option key={c._id} value={c._id}>{c.companyName}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Customer Details Preview */}
                {selectedCustomerId && selectedCustomer && (
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-600 min-w-48">
                        <p className="font-semibold text-gray-800 mb-1">{selectedCustomer.companyName}</p>
                        {selectedCustomer.address?.city && (
                            <p>
                                {selectedCustomer.address.city}
                                {selectedCustomer.address.state ? `, ${selectedCustomer.address.state}` : ''}
                            </p>
                        )}
                        {primaryContact?.phone && <p>{primaryContact.phone}</p>}
                        {primaryContact?.email && <p className="truncate">{primaryContact.email}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerSelector;
