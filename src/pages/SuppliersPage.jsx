import { useEffect, useMemo, useState } from 'react';
import {
    LayoutGrid, List, MapPin, Pencil, Phone,
    Search, Star, Trash2, User,
} from 'lucide-react';
import api from '../api/axiosInstance';
import SupplierModal from '../components/suppliers/SupplierModal';

const ROWS_PER_PAGE = 10;

const STATUS_STYLES = {
    active:      'bg-green-50 text-green-700',
    inactive:    'bg-gray-100 text-gray-500',
    blacklisted: 'bg-red-50 text-red-700',
};

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */
const SuppliersPage = () => {
    const [suppliers, setSuppliers]         = useState([]);
    const [loading, setLoading]             = useState(false);
    const [modalOpen, setModalOpen]         = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const [viewMode, setViewMode]           = useState('table');
    const [nameFilter, setNameFilter]       = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [statusFilter, setStatusFilter]   = useState('all');
    const [page, setPage]                   = useState(1);

    /* ---------- fetch ---------- */
    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/supplier/get-all-suppliers');
            setSuppliers(res.data);
        } catch (err) {
            console.error('Failed to fetch suppliers', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    /* ---------- CRUD ---------- */
    const handleAdd = async (data) => {
        try {
            await api.post('/supplier/add-supplier', data);
            fetchSuppliers();
        } catch (err) {
            alert(`Error adding supplier: ${err?.message || JSON.stringify(err)}`);
        }
    };

    const handleUpdate = async (data) => {
        try {
            await api.put(`/supplier/update-supplier/${selectedSupplier._id}`, data);
            fetchSuppliers();
            setSelectedSupplier(null);
        } catch (err) {
            alert(`Error updating supplier: ${err?.message || JSON.stringify(err)}`);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this supplier?')) return;
        try {
            await api.delete(`/supplier/delete-supplier/${id}`);
            fetchSuppliers();
        } catch (err) {
            alert(`Error deleting supplier: ${err?.message || JSON.stringify(err)}`);
        }
    };

    const openAdd = () => { setSelectedSupplier(null); setModalOpen(true); };
    const openEdit = (s) => { setSelectedSupplier(s); setModalOpen(true); };

    /* ---------- filter + paginate ---------- */
    const filtered = useMemo(() => {
        setPage(1);
        return suppliers.filter((s) => {
            const nameMatch = s.supplierName?.toLowerCase().includes(nameFilter.toLowerCase()) ||
                s.supplierCode?.toLowerCase().includes(nameFilter.toLowerCase());
            const locMatch = `${s.address?.city || ''} ${s.address?.state || ''}`
                .toLowerCase().includes(locationFilter.toLowerCase());
            const statusMatch = statusFilter === 'all' || s.status === statusFilter;
            return nameMatch && locMatch && statusMatch;
        });
    }, [suppliers, nameFilter, locationFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    const paginated  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

    /* ---------- render ---------- */
    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Suppliers</h1>
                <button
                    onClick={openAdd}
                    className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition"
                >
                    + Add Supplier
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Name / Code */}
                <div className="relative w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        placeholder="Supplier name or code"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-400"
                    />
                </div>

                {/* Location */}
                <div className="relative w-48">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        placeholder="City or state"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-400"
                    />
                </div>

                {/* Status */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="py-2 pl-3 pr-8 text-sm border border-gray-200 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-black/10 bg-white"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blacklisted">Blacklisted</option>
                </select>

                {/* View Toggle */}
                <div className="ml-auto flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-2 text-gray-600 transition ${viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50'}`}
                        title="Table view"
                    >
                        <List size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-2 text-gray-600 transition ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50'}`}
                        title="Grid view"
                    >
                        <LayoutGrid size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <p className="text-sm text-gray-500">Loading...</p>
            ) : viewMode === 'table' ? (
                <TableView
                    data={paginated}
                    all={filtered}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />
            ) : (
                <GridView
                    data={paginated}
                    all={filtered}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Modal */}
            {modalOpen && (
                <SupplierModal
                    open={modalOpen}
                    supplier={selectedSupplier}
                    onClose={() => { setModalOpen(false); setSelectedSupplier(null); }}
                    onSuccess={selectedSupplier ? handleUpdate : handleAdd}
                />
            )}
        </div>
    );
};

export default SuppliersPage;


/* ------------------------------------------------------------------ */
/*  Table View                                                          */
/* ------------------------------------------------------------------ */
const TableView = ({ data, all, page, totalPages, onPageChange, onEdit, onDelete }) => (
    <div className="bg-white border border-gray-800/50 rounded overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-800 uppercase text-xs sticky top-0 z-10 border-b border-neutral-400/20">
                    <tr>
                        <th className="px-5 py-3 text-left">Code</th>
                        <th className="px-5 py-3 text-left">Supplier</th>
                        <th className="px-5 py-3 text-left">Location</th>
                        <th className="px-5 py-3 text-left">Primary Contact</th>
                        <th className="px-5 py-3 text-left">Delivers</th>
                        <th className="px-5 py-3 text-center">Status</th>
                        <th className="px-5 py-3 text-center">Rating</th>
                        <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan="8" className="px-5 py-10 text-center text-gray-400 text-sm">
                                No suppliers found
                            </td>
                        </tr>
                    ) : (
                        data.map((s) => {
                            const primaryContact = s.contacts?.find(c => c.isPrimary) || s.contacts?.[0];
                            return (
                                <tr key={s._id} className="hover:bg-gray-50 transition">
                                    {/* Code */}
                                    <td className="px-5 py-2 font-mono text-xs text-gray-400">
                                        {s.supplierCode}
                                    </td>

                                    {/* Supplier name */}
                                    <td className="px-5 py-2 font-semibold text-gray-900">
                                        {s.supplierName}
                                    </td>

                                    {/* Location */}
                                    <td className="px-5 py-2 text-blue-900">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-gray-400" />
                                            {s.address?.city}{s.address?.state ? `, ${s.address.state}` : ''}
                                        </div>
                                    </td>

                                    {/* Primary Contact */}
                                    <td className="px-5 py-2 text-gray-600">
                                        {primaryContact ? (
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-gray-400" />
                                                <span>{primaryContact.name}</span>
                                                {primaryContact.phone && (
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Phone size={12} /> {primaryContact.phone}
                                                    </span>
                                                )}
                                            </div>
                                        ) : s.businessInfo?.phone ? (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Phone size={14} className="text-gray-400" />
                                                {s.businessInfo.phone}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>

                                    {/* Delivery types */}
                                    <td className="px-5 py-2">
                                        <div className="flex flex-wrap gap-1">
                                            {(s.deliveryTypes || []).slice(0, 3).map((dt, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                                                >
                                                    {typeof dt === 'object' ? dt.name : dt}
                                                </span>
                                            ))}
                                            {(s.deliveryTypes || []).length > 3 && (
                                                <span className="text-xs text-gray-400">
                                                    +{s.deliveryTypes.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-2 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[s.status] || 'bg-gray-100 text-gray-500'}`}>
                                            {s.status}
                                        </span>
                                    </td>

                                    {/* Rating */}
                                    <td className="px-5 py-2 text-center">
                                        <span className="flex items-center justify-center gap-1 text-xs">
                                            <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                            {(s.rating || 0).toFixed(1)}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-2">
                                        <div className="flex justify-center">
                                            <ActionButtons onEdit={() => onEdit(s)} onDelete={() => onDelete(s._id)} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>

        <Pagination data={all} page={page} totalPages={totalPages} onPageChange={onPageChange} rowsPerPage={ROWS_PER_PAGE} />
    </div>
);


/* ------------------------------------------------------------------ */
/*  Grid View                                                           */
/* ------------------------------------------------------------------ */
const GridView = ({ data, all, page, totalPages, onPageChange, onEdit, onDelete }) => (
    <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-4">
            {data.length === 0 ? (
                <p className="text-sm text-gray-400 col-span-full text-center py-10">No suppliers found</p>
            ) : (
                data.map((s) => {
                    const primaryContact = s.contacts?.find(c => c.isPrimary) || s.contacts?.[0];
                    const initials = s.supplierName?.slice(0, 2).toUpperCase() || '??';

                    return (
                        <div key={s._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                            {/* Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 leading-tight truncate">
                                        {s.supplierName}
                                    </h3>
                                    <span className="text-xs font-mono text-gray-400">{s.supplierCode}</span>
                                    {s.address?.city && (
                                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                                            <MapPin size={13} className="text-gray-400 shrink-0" />
                                            <span className="truncate">
                                                {s.address.city}{s.address.state ? `, ${s.address.state}` : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize shrink-0 ${STATUS_STYLES[s.status] || 'bg-gray-100 text-gray-500'}`}>
                                    {s.status}
                                </span>
                            </div>

                            {/* Primary Contact */}
                            {(primaryContact || s.businessInfo?.phone) && (
                                <div className="mb-3">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Contact</h4>
                                    {primaryContact ? (
                                        <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-blue-50 text-blue-700">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="opacity-70" />
                                                <span className="font-medium">{primaryContact.name}</span>
                                            </div>
                                            {primaryContact.phone && (
                                                <span className="flex items-center gap-1 text-xs">
                                                    <Phone size={12} /> {primaryContact.phone}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg">
                                            <Phone size={14} className="text-gray-400" />
                                            {s.businessInfo.phone}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Delivery Types */}
                            {(s.deliveryTypes || []).length > 0 && (
                                <div className="mb-3">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Delivers</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {s.deliveryTypes.map((dt, i) => (
                                            <span key={i} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {typeof dt === 'object' ? dt.name : dt}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rating + Actions */}
                            <div className="mt-4 flex items-center justify-between">
                                <span className="flex items-center gap-1 text-sm text-gray-600">
                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                    {(s.rating || 0).toFixed(1)}
                                </span>
                                <ActionButtons onEdit={() => onEdit(s)} onDelete={() => onDelete(s._id)} />
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* Pagination below grid */}
        <div className="bg-white border border-gray-200 rounded-lg">
            <Pagination data={all} page={page} totalPages={totalPages} onPageChange={onPageChange} rowsPerPage={ROWS_PER_PAGE} />
        </div>
    </div>
);


/* ------------------------------------------------------------------ */
/*  Pagination                                                          */
/* ------------------------------------------------------------------ */
const Pagination = ({ data, page, totalPages, onPageChange, rowsPerPage }) => {
    const start = data.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
    const end   = Math.min(page * rowsPerPage, data.length);

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        if (totalPages <= 7 || i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '…') {
            pages.push('…');
        }
    }

    return (
        <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-500">
            <span>
                Showing <span className="font-medium text-gray-700">{start}–{end}</span> of{' '}
                <span className="font-medium text-gray-700">{data.length}</span>
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    &lt;
                </button>
                {pages.map((p, i) =>
                    p === '…' ? (
                        <span key={`ellipsis-${i}`} className="px-2">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`px-3 py-1 border rounded ${p === page ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                        >
                            {p}
                        </button>
                    )
                )}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    &gt;
                </button>
            </div>
        </div>
    );
};


/* ------------------------------------------------------------------ */
/*  Action Buttons                                                      */
/* ------------------------------------------------------------------ */
const ActionButtons = ({ onEdit, onDelete }) => (
    <div className="flex gap-2">
        <button onClick={onEdit} title="Edit">
            <Pencil size={16} />
        </button>
        <button onClick={onDelete} title="Delete">
            <Trash2 size={16} className="text-red-600" />
        </button>
    </div>
);
