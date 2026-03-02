import { useState, useEffect } from 'react';
import { Search, Package, MapPin, Clock, Truck, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

const FinishedGoodsPage = () => {
    const navigate = useNavigate();
    const [finishedGoods, setFinishedGoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [workOrderFilter, setWorkOrderFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/finished-goods');
            setFinishedGoods(response.data || []);
        } catch (err) {
            console.error('Failed to fetch finished goods:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Get unique work orders for filter
    const uniqueWorkOrders = [...new Set(finishedGoods.map(item => item.workOrderNumber))];

    // Apply filters
    const filtered = finishedGoods.filter(item => {
        const matchWO = workOrderFilter === 'all' || item.workOrderNumber === workOrderFilter;
        const matchStatus = statusFilter === 'all' || item.deliveryStatus === statusFilter;
        const matchSearch = !search ||
            item.itemName?.toLowerCase().includes(search.toLowerCase()) ||
            item.processName?.toLowerCase().includes(search.toLowerCase()) ||
            item.workOrderNumber?.toLowerCase().includes(search.toLowerCase()) ||
            item.specifications?.toLowerCase().includes(search.toLowerCase()) ||
            item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
            item.storageLocation?.toLowerCase().includes(search.toLowerCase());
        return matchWO && matchStatus && matchSearch && item.isActive;
    });

    // Group by work order
    const groupedByWO = filtered.reduce((acc, item) => {
        const woNum = item.workOrderNumber || 'Unknown WO';
        if (!acc[woNum]) acc[woNum] = [];
        acc[woNum].push(item);
        return acc;
    }, {});

    // Calculate totals
    const totalWeight = filtered.reduce((sum, item) => sum + (item.quantity?.weight || 0), 0);
    const totalLength = filtered.reduce((sum, item) => sum + (item.quantity?.length || 0), 0);
    const uniqueWOs = Object.keys(groupedByWO).length;
    const readyCount = filtered.filter(item => item.deliveryStatus === 'ready').length;
    const dispatchedCount = filtered.filter(item => item.deliveryStatus === 'dispatched').length;
    const deliveredCount = filtered.filter(item => item.deliveryStatus === 'delivered').length;

    const getStatusBadge = (status) => {
        const badges = {
            'ready': { bg: 'bg-blue-50', text: 'text-blue-700', icon: Package, label: 'Ready' },
            'dispatched': { bg: 'bg-orange-50', text: 'text-orange-700', icon: Truck, label: 'Dispatched' },
            'delivered': { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle, label: 'Delivered' }
        };
        const badge = badges[status] || badges.ready;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 ${badge.bg} ${badge.text} text-xs font-semibold rounded`}>
                <Icon size={12} />
                {badge.label}
            </span>
        );
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-400">
            Loading finished goods…
        </div>
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Finished Goods</h1>
                <p className="text-sm text-gray-500">Completed products ready for delivery</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by item name, customer, WO#, or storage..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div className="flex gap-1.5">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="all">All Statuses</option>
                        <option value="ready">Ready</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                    </select>
                    <button
                        onClick={() => setWorkOrderFilter('all')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            workOrderFilter === 'all'
                                ? 'bg-slate-800 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        All Work Orders
                    </button>
                    {uniqueWorkOrders.map(woNum => (
                        <button
                            key={woNum}
                            onClick={() => setWorkOrderFilter(woNum)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                workOrderFilter === woNum
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {woNum}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-6 gap-3 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Items</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{filtered.length}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total Weight</p>
                    <p className="text-2xl font-bold text-blue-800 mt-1">{totalWeight.toFixed(2)} kg</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Total Length</p>
                    <p className="text-2xl font-bold text-purple-800 mt-1">{totalLength.toFixed(2)} m</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Ready</p>
                    <p className="text-2xl font-bold text-emerald-800 mt-1">{readyCount}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Dispatched</p>
                    <p className="text-2xl font-bold text-orange-800 mt-1">{dispatchedCount}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Delivered</p>
                    <p className="text-2xl font-bold text-green-800 mt-1">{deliveredCount}</p>
                </div>
            </div>

            {/* Grouped by Work Order */}
            {Object.keys(groupedByWO).length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
                    {search || workOrderFilter !== 'all' || statusFilter !== 'all'
                        ? 'No finished goods match your filters.'
                        : 'No finished goods yet. Add outputs with type "Finished Product" from process tracking.'}
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedByWO).map(([workOrderNumber, items]) => (
                        <div key={workOrderNumber} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            {/* Work Order Header */}
                            <div className="px-6 py-3 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center">
                                        <Package size={16} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Work Order: {workOrderNumber}</h3>
                                        <p className="text-xs text-gray-500">
                                            {items.length} item{items.length !== 1 ? 's' : ''} • {
                                                items[0]?.customerName || 'Customer N/A'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Item Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Process</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Specification</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Storage</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                            {/* Item Name */}
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-800">{item.itemName}</p>
                                            </td>

                                            {/* Process */}
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded">
                                                    {item.processName || '—'}
                                                </span>
                                            </td>

                                            {/* Specification */}
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-gray-600">
                                                    {item.specifications || '—'}
                                                </span>
                                            </td>

                                            {/* Quantity */}
                                            <td className="px-4 py-3 text-right">
                                                <div className="font-bold text-gray-800">
                                                    {item.quantity?.weight > 0 && (
                                                        <span className="block">{item.quantity.weight} kg</span>
                                                    )}
                                                    {item.quantity?.length > 0 && (
                                                        <span className="block">{item.quantity.length} m</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Storage Location */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <MapPin size={12} />
                                                    <span className="text-xs">{item.storageLocation || 'Not specified'}</span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                {getStatusBadge(item.deliveryStatus)}
                                            </td>

                                            {/* Created Date */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <Clock size={12} />
                                                    <span className="text-xs">
                                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => navigate(`/work-order/${item.workOrderId._id || item.workOrderId}`)}
                                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    View WO
                                                    <ArrowRight size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FinishedGoodsPage;
