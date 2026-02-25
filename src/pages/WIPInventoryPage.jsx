import { useState, useEffect } from 'react';
import { Search, Package, MapPin, Clock, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

const WIPInventoryPage = () => {
    const navigate = useNavigate();
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');
    const [locations, setLocations] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [woRes, locRes] = await Promise.all([
                api.get('/work-order/get-all-work-orders'),
                api.get('/location/get-all-locations?isActive=true'),
            ]);
            setWorkOrders(woRes.data || []);
            setLocations(locRes.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Extract all intermediate products from work orders
    const intermediateProducts = workOrders.flatMap(wo =>
        wo.processAssignments
            ?.filter(pa => pa.producedQuantity > 0)
            .map(pa => ({
                ...pa,
                workOrderNumber: wo.workOrderNumber,
                workOrderId: wo._id,
                quoteNumber: wo.quoteNumber,
                customer: wo.customerId?.companyName,
                cableLength: wo.cableLength,
            })) || []
    );

    // Apply filters
    const filtered = intermediateProducts.filter(ip => {
        const matchLocation = locationFilter === 'all' || ip.locationId === locationFilter;
        const matchSearch = !search ||
            ip.processName?.toLowerCase().includes(search.toLowerCase()) ||
            ip.producedSpec?.toLowerCase().includes(search.toLowerCase()) ||
            ip.workOrderNumber?.toLowerCase().includes(search.toLowerCase()) ||
            ip.storageLocation?.toLowerCase().includes(search.toLowerCase());
        return matchLocation && matchSearch;
    });

    // Group by process
    const groupedByProcess = filtered.reduce((acc, ip) => {
        const processName = ip.processName || 'Unknown Process';
        if (!acc[processName]) acc[processName] = [];
        acc[processName].push(ip);
        return acc;
    }, {});

    // Calculate totals
    const totalQuantity = filtered.reduce((sum, ip) => sum + (ip.producedQuantity || 0), 0);
    const uniqueProcesses = Object.keys(groupedByProcess).length;
    const uniqueLocations = [...new Set(filtered.map(ip => ip.locationName).filter(Boolean))].length;

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-400">
            Loading WIP inventory…
        </div>
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">WIP Inventory</h1>
                <p className="text-sm text-gray-500">Work in Progress - Intermediate Products from Production</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by process, spec, WO#, or storage..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => setLocationFilter('all')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            locationFilter === 'all'
                                ? 'bg-slate-800 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        All Locations
                    </button>
                    {locations.map(loc => (
                        <button
                            key={loc._id}
                            onClick={() => setLocationFilter(loc._id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                locationFilter === loc._id
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {loc.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Items</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{filtered.length}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total Quantity</p>
                    <p className="text-2xl font-bold text-blue-800 mt-1">{totalQuantity.toLocaleString()} m</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Process Types</p>
                    <p className="text-2xl font-bold text-purple-800 mt-1">{uniqueProcesses}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Locations</p>
                    <p className="text-2xl font-bold text-emerald-800 mt-1">{uniqueLocations}</p>
                </div>
            </div>

            {/* Grouped by Process */}
            {Object.keys(groupedByProcess).length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
                    {search || locationFilter !== 'all'
                        ? 'No intermediate products match your filters.'
                        : 'No intermediate products yet. Complete work order processes to see items here.'}
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedByProcess).map(([processName, items]) => (
                        <div key={processName} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            {/* Process Header */}
                            <div className="px-6 py-3 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center">
                                        <Package size={16} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{processName}</h3>
                                        <p className="text-xs text-gray-500">
                                            {items.length} item{items.length !== 1 ? 's' : ''} • {items.reduce((sum, i) => sum + i.producedQuantity, 0).toLocaleString()}m total
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Work Order</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Specification</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Storage Location</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            {/* Work Order */}
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-mono text-xs font-semibold text-gray-700">
                                                        {item.workOrderNumber}
                                                    </p>
                                                    {item.customer && (
                                                        <p className="text-xs text-gray-400 mt-0.5">{item.customer}</p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Specification */}
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                                                    {item.producedSpec || '—'}
                                                </span>
                                            </td>

                                            {/* Quantity */}
                                            <td className="px-4 py-3 text-right">
                                                <span className="font-bold text-gray-800">
                                                    {item.producedQuantity?.toLocaleString()} m
                                                </span>
                                                {item.cableLength && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {Math.round((item.producedQuantity / item.cableLength) * 100)}% of total
                                                    </p>
                                                )}
                                            </td>

                                            {/* Storage Location */}
                                            <td className="px-4 py-3">
                                                {item.storageLocation ? (
                                                    <span className="text-sm text-gray-700">{item.storageLocation}</span>
                                                ) : (
                                                    <span className="text-gray-300 text-xs">Not specified</span>
                                                )}
                                            </td>

                                            {/* Location */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <MapPin size={12} />
                                                    <span className="text-xs">{item.locationName || '—'}</span>
                                                </div>
                                            </td>

                                            {/* Employee */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <User size={12} />
                                                    <span className="text-xs">{item.assignedEmployeeId?.name || '—'}</span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => navigate(`/work-order/${item.workOrderId}`)}
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

export default WIPInventoryPage;
