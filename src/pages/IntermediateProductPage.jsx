import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import api from '../api/axiosInstance';
import IntermediateProductModal from '../components/intermediateProduct/IntermediateProductModal';

const CATEGORY_COLORS = {
    conductor: 'bg-yellow-100 text-yellow-800',
    core: 'bg-blue-100 text-blue-800',
    cable: 'bg-purple-100 text-purple-800',
    armoured: 'bg-green-100 text-green-800',
    other: 'bg-gray-100 text-gray-700',
};

const IntermediateProductPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/intermediate-product/get-all-intermediate-products');
            setProducts(res.data || []);
        } catch (err) {
            console.error('Failed to fetch intermediate products:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (data) => {
        try {
            await api.post('/intermediate-product/add-intermediate-product', data);
            fetchProducts();
            setModalOpen(false);
        } catch (err) {
            alert('Error: ' + (err.message || 'Unknown error'));
        }
    };

    const handleUpdate = async (data) => {
        try {
            await api.put(`/intermediate-product/update-intermediate-product/${editProduct._id}`, data);
            fetchProducts();
            setModalOpen(false);
            setEditProduct(null);
        } catch (err) {
            alert('Error: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this intermediate product?')) return;
        try {
            await api.delete(`/intermediate-product/delete-intermediate-product/${id}`);
            fetchProducts();
        } catch (err) {
            alert('Error: ' + (err.message || 'Unknown error'));
        }
    };

    const openAdd = () => { setEditProduct(null); setModalOpen(true); };
    const openEdit = (p) => { setEditProduct(p); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditProduct(null); };

    const filtered = products.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.code?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Intermediate Products Master</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Define WIP items produced during manufacturing</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
                >
                    <Plus size={16} /> Add Intermediate Product
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {['conductor', 'core', 'cable', 'armoured', 'other'].map(cat => (
                    <div key={cat} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="text-sm text-gray-500 capitalize mb-1">{cat}</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {products.filter(p => p.category === cat && p.status === 'active').length}
                        </div>
                        <div className="text-xs text-gray-400">active items</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-lg mb-4 p-4">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by code, name or category..."
                    className="w-full max-w-md px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-800/50 rounded overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-100 text-gray-800 uppercase text-xs sticky top-0 z-10">
                            <th className="text-left px-5 py-3 font-semibold tracking-wide">Code</th>
                            <th className="text-left px-5 py-3 font-semibold tracking-wide">Product Name</th>
                            <th className="text-left px-5 py-3 font-semibold tracking-wide">Category</th>
                            <th className="text-left px-5 py-3 font-semibold tracking-wide">Unit</th>
                            <th className="text-left px-5 py-3 font-semibold tracking-wide">Specifications</th>
                            <th className="text-center px-5 py-3 font-semibold tracking-wide">Status</th>
                            <th className="text-center px-5 py-3 font-semibold tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-5 py-10 text-center text-gray-400 text-sm">
                                    {products.length === 0
                                        ? 'No intermediate products yet. Click "Add Intermediate Product" to create one.'
                                        : 'No products match your search.'}
                                </td>
                            </tr>
                        ) : (
                            filtered.map(p => (
                                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4">
                                        <code className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                            {p.code}
                                        </code>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                <Package size={14} className="text-gray-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-gray-900">{p.name}</div>
                                                {p.description && (
                                                    <div className="text-xs text-gray-500">{p.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other}`}>
                                            {p.category}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-sm text-gray-700">{p.unit}</span>
                                    </td>
                                    <td className="px-5 py-4 max-w-xs">
                                        {p.specifications && Object.keys(p.specifications).length > 0 ? (
                                            <div className="text-xs text-gray-600">
                                                {Object.entries(p.specifications).slice(0, 2).map(([key, value]) => (
                                                    <div key={key} className="truncate">
                                                        <span className="font-medium">{key}:</span> {value}
                                                    </div>
                                                ))}
                                                {Object.keys(p.specifications).length > 2 && (
                                                    <div className="text-gray-400">+{Object.keys(p.specifications).length - 2} more</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">No specs</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {p.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => openEdit(p)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit"
                                            >
                                                <Edit size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p._id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                                title="Delete"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <IntermediateProductModal
                open={modalOpen}
                onClose={closeModal}
                onSuccess={editProduct ? handleUpdate : handleAdd}
                product={editProduct}
            />
        </div>
    );
};

export default IntermediateProductPage;
