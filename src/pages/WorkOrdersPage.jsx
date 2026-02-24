import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Trash2, User, CheckCircle2, Clock, XCircle, LayoutGrid } from 'lucide-react';
import api from '../api/axiosInstance';

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    'in-progress': { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
    completed: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
};

const WorkOrdersPage = () => {
    const navigate = useNavigate();
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchWorkOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/work-order/get-all-work-orders');
            setWorkOrders(res.data || []);
        } catch (err) {
            console.error('Failed to fetch work orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkOrders();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Delete this work order? This cannot be undone.')) return;
        try {
            await api.delete(`/work-order/delete-work-order/${id}`);
            setWorkOrders(prev => prev.filter(wo => wo._id !== id));
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await api.patch(`/work-order/patch-work-order/${id}`, { status: newStatus });
            setWorkOrders(prev => prev.map(wo => wo._id === id ? res.data : wo));
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
    };

    const filtered = workOrders.filter(wo => {
        const matchStatus = statusFilter === 'all' || wo.status === statusFilter;
        const matchSearch = !search ||
            wo.workOrderNumber?.toLowerCase().includes(search.toLowerCase()) ||
            wo.quoteNumber?.toLowerCase().includes(search.toLowerCase()) ||
            wo.customerId?.companyName?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-400">
            Loading work orders…
        </div>
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Work Orders</h1>
                    <p className="text-sm text-gray-500">Track production and employee assignments</p>
                </div>
                <button
                    onClick={() => navigate('/work-orders/kanban')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-sm font-semibold rounded-lg hover:bg-gray-50"
                >
                    <LayoutGrid size={16} />
                    Kanban View
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by WO#, Quote#, or customer…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div className="flex gap-1.5">
                    {['all', 'pending', 'in-progress', 'completed', 'cancelled'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                                statusFilter === s
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {['pending', 'in-progress', 'completed', 'cancelled'].map(s => {
                    const count = workOrders.filter(wo => wo.status === s).length;
                    const cfg = STATUS_CONFIG[s];
                    return (
                        <div key={s} className={`rounded-xl border px-4 py-3 ${cfg.bg} border-opacity-50`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>{cfg.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${cfg.text}`}>{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">WO #</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Quote #</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Length</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Processes</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                                    {search || statusFilter !== 'all'
                                        ? 'No work orders match your filters.'
                                        : 'No work orders yet. Convert approved quotations to create work orders.'}
                                </td>
                            </tr>
                        ) : filtered.map(wo => (
                            <tr key={wo._id} className="hover:bg-gray-50 transition-colors">
                                {/* WO # */}
                                <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">
                                    {wo.workOrderNumber}
                                </td>

                                {/* Quote # */}
                                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                    {wo.quoteNumber}
                                </td>

                                {/* Customer */}
                                <td className="px-4 py-3">
                                    {wo.customerId ? (
                                        <div>
                                            <p className="font-medium text-gray-800 text-sm">{wo.customerId.companyName}</p>
                                            {wo.customerId.address?.city && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {wo.customerId.address.city}
                                                    {wo.customerId.address.state ? `, ${wo.customerId.address.state}` : ''}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">No customer</span>
                                    )}
                                </td>

                                {/* Length */}
                                <td className="px-4 py-3 text-right text-sm text-gray-600">
                                    {wo.cableLength?.toLocaleString()} m
                                </td>

                                {/* Processes */}
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {wo.processAssignments?.slice(0, 3).map((pa, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                                            >
                                                <User size={10} />
                                                <span>{pa.processName}</span>
                                            </div>
                                        ))}
                                        {wo.processAssignments?.length > 3 && (
                                            <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-full">
                                                +{wo.processAssignments.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3 text-center">
                                    <select
                                        value={wo.status}
                                        onChange={e => handleStatusChange(wo._id, e.target.value)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 ${STATUS_CONFIG[wo.status]?.bg} ${STATUS_CONFIG[wo.status]?.text}`}
                                    >
                                        {Object.keys(STATUS_CONFIG).map(s => (
                                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                        ))}
                                    </select>
                                </td>

                                {/* Created */}
                                <td className="px-4 py-3 text-xs text-gray-500">
                                    {new Date(wo.createdAt).toLocaleDateString('en-IN')}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => navigate(`/work-order/${wo._id}`)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                                            title="View Details"
                                        >
                                            <Eye size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(wo._id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                                            title="Delete"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WorkOrdersPage;
