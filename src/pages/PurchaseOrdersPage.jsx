import { useState, useEffect, Fragment } from 'react';
import { Plus, Search, FileText, CheckCircle, XCircle, Trash2, Download } from 'lucide-react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import api from '../api/axiosInstance';
import PurchaseOrderPDF from '../components/PurchaseOrderPDF.jsx';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  ordered: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

const emptyItem = () => ({
  materialId: '',
  quantity: { weight: '', length: '' },
  pricing: { pricePerKg: '', pricePerKm: '', totalCost: '' },
  storage: { location: '', locationDetails: '', containerCount: 1 },
  notes: '',
  _key: Math.random()
});

const PurchaseOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [pdfModal, setPdfModal] = useState(null);
  const [receiveModal, setReceiveModal] = useState(null);
  const [receiveForm, setReceiveForm] = useState({ invoiceNumber: '', invoiceDate: '' });
  const [openItemsRow, setOpenItemsRow] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: '',
    status: 'draft',
    notes: '',
    items: [emptyItem()]
  });

  // Per-item supplier suggestions
  const [itemSuggestions, setItemSuggestions] = useState({}); // { itemKey: {preferred, others} }

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [ordersRes, materialsRes, suppliersRes] = await Promise.all([
        api.get('/purchase-order/get-all'),
        api.get('/raw-material/get-all-materials'),
        api.get('/supplier/get-all-suppliers')
      ]);
      setOrders(ordersRes.data || []);
      setRawMaterials(materialsRes.data || []);
      setAllSuppliers(suppliersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // When material is selected for an item, load supplier suggestions
  const handleMaterialChange = async (itemKey, materialId) => {
    updateItem(itemKey, 'materialId', materialId);

    if (!materialId) {
      setItemSuggestions(prev => { const n = { ...prev }; delete n[itemKey]; return n; });
      return;
    }

    try {
      const res = await api.get(`/purchase-order/suggested-suppliers/${materialId}`);
      setItemSuggestions(prev => ({ ...prev, [itemKey]: res.data }));

      // Auto-set supplierId from first preferred supplier if form supplier is empty
      if (!formData.supplierId && res.data?.preferred?.length > 0) {
        setFormData(prev => ({ ...prev, supplierId: res.data.preferred[0]._id }));
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const updateItem = (itemKey, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item._key !== itemKey) return item;
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          return { ...item, [parent]: { ...item[parent], [child]: value } };
        }
        return { ...item, [field]: value };
      })
    }));
  };

  // Auto-calculate total cost for an item
  const recalcTotal = (itemKey) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item._key !== itemKey) return item;
        const weight = parseFloat(item.quantity.weight) || 0;
        const pricePerKg = parseFloat(item.pricing.pricePerKg) || 0;
        const totalCost = weight * pricePerKg;
        return { ...item, pricing: { ...item.pricing, totalCost: totalCost.toFixed(2) } };
      })
    }));
  };

  const addItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItem = (itemKey) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item._key !== itemKey)
    }));
    setItemSuggestions(prev => { const n = { ...prev }; delete n[itemKey]; return n; });
  };

  const totalOrderAmount = formData.items.reduce(
    (sum, item) => sum + (parseFloat(item.pricing.totalCost) || 0), 0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      totalAmount: totalOrderAmount,
      items: formData.items.map(({ _key, ...item }) => ({
        ...item,
        quantity: {
          weight: parseFloat(item.quantity.weight) || 0,
          length: parseFloat(item.quantity.length) || 0
        },
        pricing: {
          pricePerKg: parseFloat(item.pricing.pricePerKg) || 0,
          pricePerKm: parseFloat(item.pricing.pricePerKm) || 0,
          totalCost: parseFloat(item.pricing.totalCost) || 0
        },
        storage: {
          ...item.storage,
          containerCount: parseInt(item.storage.containerCount) || 1
        }
      }))
    };

    try {
      await api.post('/purchase-order/create', payload);
      fetchAll();
      resetForm();
    } catch (error) {
      alert('Error creating PO: ' + (error?.message || JSON.stringify(error)));
    }
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: '',
      status: 'draft',
      notes: '',
      items: [emptyItem()]
    });
    setItemSuggestions({});
    setShowForm(false);
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/purchase-order/receive/${receiveModal._id}`, {
        invoiceNumber: receiveForm.invoiceNumber,
        invoiceDate: receiveForm.invoiceDate
      });
      fetchAll();
      setReceiveModal(null);
    } catch (error) {
      alert('Error receiving PO: ' + (error?.message || JSON.stringify(error)));
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this purchase order?')) return;
    try {
      await api.post(`/purchase-order/cancel/${id}`);
      fetchAll();
    } catch (error) {
      alert('Error cancelling PO: ' + (error?.message || JSON.stringify(error)));
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplierId?.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const generateInvoiceNumber = (order) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    // Extract numeric sequence from PO number e.g. "PO-00003" → "003"
    const poSeq = (order.poNumber || '').replace(/^PO-0*/, '').padStart(3, '0') || '001';
    return `INV-${yyyy}${mm}${dd}-${poSeq}`;
  };

  const openReceiveModal = (order) => {
    setReceiveModal(order);
    setReceiveForm({
      invoiceNumber: generateInvoiceNumber(order),
      invoiceDate: new Date().toISOString().slice(0, 10),
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Purchase Orders</h1>
          <p className="text-gray-600">Manage raw material procurement</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={20} /> New Purchase Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search PO number or supplier..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {['draft', 'ordered', 'received', 'cancelled'].map(s => (
          <div key={s} className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1 capitalize">{s}</div>
            <div className="text-2xl font-bold">{orders.filter(o => o.status === s).length}</div>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">PO Number</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Supplier</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Items</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Total</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Date</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No purchase orders found</td>
              </tr>
            ) : filtered.map(order => (
              <Fragment key={order._id}>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm">{order.poNumber}</td>
                <td className="px-6 py-4">{order.supplierId?.supplierName || '—'}</td>
                <td
                  className="px-6 py-4 text-sm text-gray-600 cursor-pointer select-none"
                  onClick={() => setOpenItemsRow(openItemsRow === order._id ? null : order._id)}
                >
                  <div className="font-medium text-gray-700">
                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {order.items?.map((item, i) => {
                      const name = item.materialId?.name || '—';
                      const dims = item.materialId?.specifications?.dimensions;
                      const qty = item.quantity?.weight > 0
                        ? `${item.quantity.weight} kg`
                        : item.quantity?.length > 0
                          ? `${item.quantity.length} m`
                          : '';
                      return (
                        <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                          {name}{dims ? ` · ${dims}` : ''}{qty ? ` · ${qty}` : ''}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(order.orderDate).toLocaleDateString('en-IN')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setPdfModal(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      title="View Invoice PDF"
                    >
                      <FileText size={16} />
                    </button>
                    {(order.status === 'draft' || order.status === 'ordered') && (
                      <button
                        onClick={() => openReceiveModal(order)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                        title="Mark as Received"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {order.status !== 'received' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(order._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Cancel"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>

              {/* Expanded items dropdown row */}
              {openItemsRow === order._id && (
                <tr className="bg-blue-50 border-b border-blue-100">
                  <td colSpan="7" className="px-6 py-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {order.items?.map((item, i) => (
                        <div key={i} className="bg-white rounded-md border border-blue-100 px-3 py-2 text-xs">
                          <div className="font-semibold text-gray-800 mb-1">
                            {item.materialId?.name || '—'}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-gray-500">
                            {item.quantity?.weight > 0 && <span>{item.quantity.weight} kg</span>}
                            {item.quantity?.length > 0 && <span>{item.quantity.length} m</span>}
                            {item.pricing?.pricePerKg > 0 && <span>₹{item.pricing.pricePerKg}/kg</span>}
                            <span className="font-medium text-gray-700">
                              ₹{(item.pricing?.totalCost || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          {item.storage?.location && (
                            <div className="text-gray-400 mt-0.5 capitalize">
                              {item.storage.location}{item.storage.locationDetails ? ` — ${item.storage.locationDetails}` : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* === CREATE PO FORM MODAL === */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col">

            {/* ── Modal Header ── */}
            <div className="bg-blue-700 rounded-t-xl px-7 py-5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">New Purchase Order</h2>
                <p className="text-blue-200 text-xs mt-0.5">Fill in the details below to create a procurement order</p>
              </div>
              <button onClick={resetForm} className="text-blue-200 hover:text-white text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-7 space-y-7">

                {/* ── Section 1: Order Info ── */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-blue-600 rounded-full" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Order Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Supplier <span className="text-red-500">*</span></label>
                      <select
                        value={formData.supplierId}
                        onChange={e => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                        required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">— Select a supplier —</option>
                        {allSuppliers.filter(s => s.status === 'active').map(s => (
                          <option key={s._id} value={s._id}>{s.supplierName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Order Date</label>
                      <input
                        type="date"
                        value={formData.orderDate}
                        onChange={e => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Expected Delivery</label>
                      <input
                        type="date"
                        value={formData.expectedDeliveryDate}
                        onChange={e => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="draft">Draft</option>
                        <option value="ordered">Ordered</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
                      <input
                        type="text"
                        value={formData.notes}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional remarks"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Items ── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 bg-blue-600 rounded-full" />
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Line Items
                        <span className="ml-2 text-xs font-normal text-gray-400 normal-case">({formData.items.length} item{formData.items.length !== 1 ? 's' : ''})</span>
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus size={13} /> Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.items.map((item, idx) => {
                      const suggestions = itemSuggestions[item._key];
                      return (
                        <div key={item._key} className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Item card header */}
                          <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span className="text-sm font-semibold text-gray-600">Line Item</span>
                            </div>
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(item._key)}
                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                            )}
                          </div>

                          <div className="p-4 space-y-4">
                            {/* Material */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Raw Material <span className="text-red-500">*</span></label>
                              <select
                                value={item.materialId}
                                onChange={e => handleMaterialChange(item._key, e.target.value)}
                                required
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="">— Select raw material —</option>
                                {rawMaterials.map(m => (
                                  <option key={m._id} value={m._id}>
                                    {m.name}{m.specifications?.dimensions ? ` (${m.specifications.dimensions})` : ''}
                                  </option>
                                ))}
                              </select>
                              {suggestions && (
                                <div className="mt-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs">
                                  {suggestions.preferred?.length > 0 && (
                                    <div className="mb-1">
                                      <span className="text-blue-700 font-semibold">Preferred: </span>
                                      {suggestions.preferred.map((s, i) => (
                                        <button key={s._id} type="button"
                                          onClick={() => setFormData(prev => ({ ...prev, supplierId: s._id }))}
                                          className="text-blue-600 underline hover:text-blue-800">
                                          {s.supplierName}{i < suggestions.preferred.length - 1 ? ', ' : ''}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  {suggestions.others?.length > 0 && (
                                    <div>
                                      <span className="text-gray-500 font-semibold">Also supplies: </span>
                                      {suggestions.others.map((s, i) => (
                                        <button key={s._id} type="button"
                                          onClick={() => setFormData(prev => ({ ...prev, supplierId: s._id }))}
                                          className="text-gray-600 underline hover:text-gray-800">
                                          {s.supplierName}{i < suggestions.others.length - 1 ? ', ' : ''}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  {suggestions.preferred?.length === 0 && suggestions.others?.length === 0 && (
                                    <span className="text-gray-400 italic">No linked suppliers yet — will be auto-linked on save</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Quantity & Pricing */}
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Quantity & Pricing</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Weight (kg)</label>
                                  <input type="number" value={item.quantity.weight}
                                    onChange={e => { updateItem(item._key, 'quantity.weight', e.target.value); setTimeout(() => recalcTotal(item._key), 0); }}
                                    min="0" step="0.01" placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Length (m)</label>
                                  <input type="number" value={item.quantity.length}
                                    onChange={e => updateItem(item._key, 'quantity.length', e.target.value)}
                                    min="0" step="0.01" placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Rate / kg (₹)</label>
                                  <input type="number" value={item.pricing.pricePerKg}
                                    onChange={e => { updateItem(item._key, 'pricing.pricePerKg', e.target.value); setTimeout(() => recalcTotal(item._key), 0); }}
                                    min="0" step="0.01" placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Line Total (₹)</label>
                                  <div className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm bg-blue-50 text-blue-800 font-semibold">
                                    {(parseFloat(item.pricing.totalCost) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Storage */}
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Storage Details</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Location Type</label>
                                  <select value={item.storage.location}
                                    onChange={e => updateItem(item._key, 'storage.location', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                    <option value="">— Select —</option>
                                    <option value="sac">Sac</option>
                                    <option value="drum">Drum</option>
                                    <option value="bobbin">Bobbin</option>
                                    <option value="rack">Rack</option>
                                    <option value="warehouse">Warehouse</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Location Details</label>
                                  <input type="text" value={item.storage.locationDetails}
                                    onChange={e => updateItem(item._key, 'storage.locationDetails', e.target.value)}
                                    placeholder="e.g. Shelf A3"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Container Count</label>
                                  <input type="number" value={item.storage.containerCount}
                                    onChange={e => updateItem(item._key, 'storage.containerCount', e.target.value)}
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* ── Sticky Footer ── */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-7 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Order Total</span>
                  <span className="text-xl font-bold text-blue-700">
                    ₹{totalOrderAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={resetForm}
                    className="px-5 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
                    Create Purchase Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === PDF INVOICE PREVIEW MODAL === */}
      {pdfModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl flex flex-col" style={{ height: '92vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-lg shrink-0">
              <div>
                <h2 className="text-lg font-semibold">Invoice — {pdfModal.poNumber}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {pdfModal.supplierId?.supplierName} ·{' '}
                  <span className={`capitalize font-medium ${
                    pdfModal.status === 'received' ? 'text-green-600' :
                    pdfModal.status === 'ordered' ? 'text-blue-600' :
                    pdfModal.status === 'cancelled' ? 'text-red-600' : 'text-gray-600'
                  }`}>{pdfModal.status}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <PDFDownloadLink
                  document={<PurchaseOrderPDF order={pdfModal} />}
                  fileName={`${pdfModal.poNumber}-invoice.pdf`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 no-underline"
                >
                  {({ loading }) => (
                    <>
                      <Download size={15} />
                      {loading ? 'Preparing...' : 'Download PDF'}
                    </>
                  )}
                </PDFDownloadLink>
                <button
                  onClick={() => setPdfModal(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden rounded-b-lg">
              <PDFViewer width="100%" height="100%" style={{ border: 'none', borderRadius: '0 0 8px 8px' }}>
                <PurchaseOrderPDF order={pdfModal} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}

      {/* === RECEIVE PO MODAL === */}
      {receiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Receive {receiveModal.poNumber}</h2>
            </div>
            <form onSubmit={handleReceive} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                This will create inventory lots for all {receiveModal.items?.length} item(s) and update stock levels.
                Make sure storage locations are set for each item.
              </p>
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={receiveForm.invoiceNumber}
                  onChange={e => setReceiveForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  placeholder="e.g., INV-20260217-001"
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Auto-suggested from today's date · {receiveModal.items?.length || 0} item(s) · {receiveModal.poNumber}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={receiveForm.invoiceDate}
                  onChange={e => setReceiveForm(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setReceiveModal(null)} className="px-4 py-2 border rounded-md hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrdersPage;
