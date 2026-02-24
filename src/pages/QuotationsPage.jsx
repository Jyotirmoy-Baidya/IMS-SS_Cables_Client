import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Pencil, Trash2, FileText,
    MapPin, Calendar, Truck, StickyNote, X, Check, ClipboardCheck
} from 'lucide-react';
import api from '../api/axiosInstance';
import ConvertToWorkOrderModal from '../components/quotation/ConvertToWorkOrderModal';

const STATUS_CONFIG = {
    enquired: { label: 'Enquired',  bg: 'bg-blue-100',   text: 'text-blue-700'   },
    pending:  { label: 'Pending',   bg: 'bg-amber-100',  text: 'text-amber-700'  },
    approved: { label: 'Approved',  bg: 'bg-emerald-100',text: 'text-emerald-700'},
    rejected: { label: 'Rejected',  bg: 'bg-red-100',    text: 'text-red-700'    },
};

const DELIVERY_TYPES = ['drum', 'bobbin', 'coil', 'packed', 'other'];

const fmtINR = (n) =>
    '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const QuotationsPage = () => {
    const navigate = useNavigate();
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Notes modal state
    const [notesModal, setNotesModal] = useState(null); // { quotation }
    const [notesForm, setNotesForm] = useState({
        deliveryType: '',
        deliveryQuantity: '',
        expectedDelivery: '',
        sameAsCustomerAddress: false,
        deliveryAddress: { line1: '', city: '', state: '', pincode: '', country: 'India' },
        notes: '',
    });
    const [savingNotes, setSavingNotes] = useState(false);

    // Convert to work order modal state
    const [convertModal, setConvertModal] = useState(null); // quotation to convert

    const fetchQuotations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/quotation/get-all-quotations');
            setQuotations(res.data || []);
        } catch (err) {
            console.error('Failed to fetch quotations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await api.patch(`/quotation/patch-quotation/${id}`, { status: newStatus });
            setQuotations(prev => prev.map(q => q._id === id ? res.data : q));
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this quotation? This cannot be undone.')) return;
        try {
            await api.delete(`/quotation/delete-quotation/${id}`);
            setQuotations(prev => prev.filter(q => q._id !== id));
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    const openNotesModal = (quotation) => {
        setNotesModal(quotation);
        setNotesForm({
            deliveryType:    quotation.deliveryType    || '',
            deliveryQuantity: quotation.deliveryQuantity || '',
            expectedDelivery: quotation.expectedDelivery
                ? new Date(quotation.expectedDelivery).toISOString().slice(0, 10)
                : '',
            sameAsCustomerAddress: quotation.sameAsCustomerAddress || false,
            deliveryAddress: {
                line1:   quotation.deliveryAddress?.line1   || '',
                city:    quotation.deliveryAddress?.city    || '',
                state:   quotation.deliveryAddress?.state   || '',
                pincode: quotation.deliveryAddress?.pincode || '',
                country: quotation.deliveryAddress?.country || 'India',
            },
            notes: quotation.notes || '',
        });
    };

    const handleSameAsCustomer = (checked) => {
        setNotesForm(prev => {
            const updated = { ...prev, sameAsCustomerAddress: checked };
            if (checked && notesModal?.customerId?.address) {
                const addr = notesModal.customerId.address;
                updated.deliveryAddress = {
                    line1:   addr.line1   || '',
                    city:    addr.city    || '',
                    state:   addr.state   || '',
                    pincode: addr.pincode || '',
                    country: addr.country || 'India',
                };
            }
            return updated;
        });
    };

    const handleSaveNotes = async () => {
        setSavingNotes(true);
        try {
            const res = await api.patch(`/quotation/patch-quotation/${notesModal._id}`, {
                deliveryType:          notesForm.deliveryType,
                deliveryQuantity:      notesForm.deliveryQuantity,
                expectedDelivery:      notesForm.expectedDelivery || null,
                sameAsCustomerAddress: notesForm.sameAsCustomerAddress,
                deliveryAddress:       notesForm.deliveryAddress,
                notes:                 notesForm.notes,
            });
            setQuotations(prev => prev.map(q => q._id === notesModal._id ? res.data : q));
            setNotesModal(null);
        } catch (err) {
            alert('Failed to save: ' + err.message);
        } finally {
            setSavingNotes(false);
        }
    };

    const filtered = quotations.filter(q => {
        const matchStatus = statusFilter === 'all' || q.status === statusFilter;
        const matchSearch = !search ||
            q.quoteNumber?.toLowerCase().includes(search.toLowerCase()) ||
            q.customerId?.companyName?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-400">
            Loading quotations…
        </div>
    );

    return (
        <div className="p-6">
            {/* ── Header ── */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Quotations</h1>
                    <p className="text-sm text-gray-500">Manage cable quotations and enquiries</p>
                </div>
                <button
                    onClick={() => navigate('/quotation/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
                >
                    <Plus size={16} /> New Quotation
                </button>
            </div>

            {/* ── Filters ── */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by quote # or customer…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div className="flex gap-1.5">
                    {['all', 'enquired', 'pending', 'approved', 'rejected'].map(s => (
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

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {['enquired', 'pending', 'approved', 'rejected'].map(s => {
                    const count = quotations.filter(q => q.status === s).length;
                    const cfg = STATUS_CONFIG[s];
                    return (
                        <div key={s} className={`rounded-xl border px-4 py-3 ${cfg.bg} border-opacity-50`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>{cfg.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${cfg.text}`}>{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* ── Table ── */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Quote #</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Length</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Material</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Process</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Profit %</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Final Price</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="px-6 py-12 text-center text-gray-400">
                                    {search || statusFilter !== 'all'
                                        ? 'No quotations match your filters.'
                                        : 'No quotations yet. Click "New Quotation" to create one.'}
                                </td>
                            </tr>
                        ) : filtered.map(q => (
                            <tr key={q._id} className="hover:bg-gray-50 transition-colors">
                                {/* Quote # */}
                                <td className="px-4 py-3">
                                    <div className="font-mono text-xs font-semibold text-gray-700">
                                        {q.quoteNumber}
                                    </div>
                                    {q.workOrderId && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                                                WO: {q.workOrderId.workOrderNumber}
                                            </span>
                                        </div>
                                    )}
                                </td>

                                {/* Customer */}
                                <td className="px-4 py-3">
                                    {q.customerId ? (
                                        <div>
                                            <p className="font-medium text-gray-800 text-sm">{q.customerId.companyName}</p>
                                            {q.customerId.address?.city && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {q.customerId.address.city}
                                                    {q.customerId.address.state ? `, ${q.customerId.address.state}` : ''}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">No customer</span>
                                    )}
                                </td>

                                {/* Length */}
                                <td className="px-4 py-3 text-right text-sm text-gray-600">
                                    {q.cableLength?.toLocaleString()} m
                                </td>

                                {/* Material cost */}
                                <td className="px-4 py-3 text-right text-sm text-gray-700">
                                    {fmtINR(q.materialCost)}
                                </td>

                                {/* Process cost */}
                                <td className="px-4 py-3 text-right text-sm text-gray-700">
                                    {q.processCost > 0 ? fmtINR(q.processCost) : <span className="text-gray-300">—</span>}
                                </td>

                                {/* Profit % */}
                                <td className="px-4 py-3 text-right">
                                    {q.profitMarginPercent > 0 ? (
                                        <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                                            {q.profitMarginPercent}%
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs">—</span>
                                    )}
                                </td>

                                {/* Final price */}
                                <td className="px-4 py-3 text-right">
                                    <span className="text-sm font-bold text-emerald-700">{fmtINR(q.finalPrice)}</span>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3 text-center">
                                    <select
                                        value={q.status}
                                        onChange={e => handleStatusChange(q._id, e.target.value)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 ${STATUS_CONFIG[q.status]?.bg} ${STATUS_CONFIG[q.status]?.text}`}
                                    >
                                        {Object.keys(STATUS_CONFIG).map(s => (
                                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                        ))}
                                    </select>
                                </td>

                                {/* Date */}
                                <td className="px-4 py-3 text-xs text-gray-500">
                                    <div>{new Date(q.createdAt).toLocaleDateString('en-IN')}</div>
                                    {q.deliveryType && (
                                        <div className="flex items-center gap-1 mt-0.5 text-gray-400">
                                            <Truck size={10} />
                                            <span className="capitalize">{q.deliveryType}</span>
                                        </div>
                                    )}
                                    {q.expectedDelivery && (
                                        <div className="flex items-center gap-1 mt-0.5 text-gray-400">
                                            <Calendar size={10} />
                                            <span>{new Date(q.expectedDelivery).toLocaleDateString('en-IN')}</span>
                                        </div>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => openNotesModal(q)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                                            title="Delivery Notes"
                                        >
                                            <StickyNote size={15} />
                                        </button>
                                        {q.status === 'approved' && (
                                            <button
                                                onClick={() => !q.workOrderId && setConvertModal(q)}
                                                disabled={!!q.workOrderId}
                                                className={`p-1.5 rounded-md ${
                                                    q.workOrderId
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                                }`}
                                                title={q.workOrderId ? 'Already converted to work order' : 'Convert to Work Order'}
                                            >
                                                <ClipboardCheck size={15} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => navigate(`/quotation/edit/${q._id}`)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                                            title="Edit Quotation"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(q._id)}
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

            {/* ── Delivery Notes Modal ── */}
            {notesModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div>
                                <h3 className="font-bold text-gray-800">Delivery Notes</h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {notesModal.quoteNumber}
                                    {notesModal.customerId ? ` · ${notesModal.customerId.companyName}` : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => setNotesModal(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6 space-y-5">

                            {/* Delivery Type + Quantity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        <Truck size={11} className="inline mr-1" />
                                        Packing Type
                                    </label>
                                    <select
                                        value={notesForm.deliveryType}
                                        onChange={e => setNotesForm(prev => ({ ...prev, deliveryType: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    >
                                        <option value="">— Select —</option>
                                        {DELIVERY_TYPES.map(t => (
                                            <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Qty / Description
                                    </label>
                                    <input
                                        type="text"
                                        value={notesForm.deliveryQuantity}
                                        onChange={e => setNotesForm(prev => ({ ...prev, deliveryQuantity: e.target.value }))}
                                        placeholder="e.g. 2 drums × 500m"
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                            </div>

                            {/* Expected Delivery */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    <Calendar size={11} className="inline mr-1" />
                                    Expected Delivery Date
                                </label>
                                <input
                                    type="date"
                                    value={notesForm.expectedDelivery}
                                    onChange={e => setNotesForm(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>

                            {/* Delivery Address */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        <MapPin size={11} className="inline mr-1" />
                                        Delivery Address
                                    </label>
                                    {notesModal.customerId?.address && (
                                        <label className="flex items-center gap-1.5 text-xs text-blue-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notesForm.sameAsCustomerAddress}
                                                onChange={e => handleSameAsCustomer(e.target.checked)}
                                                className="w-3.5 h-3.5 rounded"
                                            />
                                            Same as customer address
                                        </label>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={notesForm.deliveryAddress.line1}
                                        onChange={e => setNotesForm(prev => ({ ...prev, deliveryAddress: { ...prev.deliveryAddress, line1: e.target.value } }))}
                                        placeholder="Address line 1"
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            value={notesForm.deliveryAddress.city}
                                            onChange={e => setNotesForm(prev => ({ ...prev, deliveryAddress: { ...prev.deliveryAddress, city: e.target.value } }))}
                                            placeholder="City"
                                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                        <input
                                            type="text"
                                            value={notesForm.deliveryAddress.state}
                                            onChange={e => setNotesForm(prev => ({ ...prev, deliveryAddress: { ...prev.deliveryAddress, state: e.target.value } }))}
                                            placeholder="State"
                                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                        <input
                                            type="text"
                                            value={notesForm.deliveryAddress.pincode}
                                            onChange={e => setNotesForm(prev => ({ ...prev, deliveryAddress: { ...prev.deliveryAddress, pincode: e.target.value } }))}
                                            placeholder="Pincode"
                                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    <FileText size={11} className="inline mr-1" />
                                    Additional Notes
                                </label>
                                <textarea
                                    rows={3}
                                    value={notesForm.notes}
                                    onChange={e => setNotesForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Special instructions, conditions, remarks…"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setNotesModal(null)}
                                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveNotes}
                                disabled={savingNotes}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Check size={14} />
                                {savingNotes ? 'Saving…' : 'Save Notes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Convert to Work Order Modal ── */}
            {convertModal && (
                <ConvertToWorkOrderModal
                    quotation={convertModal}
                    onClose={() => setConvertModal(null)}
                    onSuccess={() => {
                        setConvertModal(null);
                        alert('Work order created successfully!');
                        fetchQuotations();
                    }}
                />
            )}
        </div>
    );
};

export default QuotationsPage;
