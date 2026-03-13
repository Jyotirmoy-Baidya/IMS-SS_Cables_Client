import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Zap } from 'lucide-react';
import api from '../api/axiosInstance';
import CoreModal from '../components/core/CoreModal';

const CoreMasterPage = () => {
    const [cores, setCores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editCore, setEditCore] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchCores(); }, []);

    const fetchCores = async () => {
        try {
            setLoading(true);
            const res = await api.get('/core/get-all-cores');
            setCores(res.data || []);
        } catch (err) {
            console.error('Failed to fetch cores:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (data) => {
        try {
            await api.post('/core/add-core', data);
            fetchCores();
            setModalOpen(false);
        } catch (err) {
            alert('Error: ' + (err.message || 'Unknown error'));
        }
    };

    const handleUpdate = async (data) => {
        try {
            await api.put(`/core/update-core/${editCore._id}`, data);
            fetchCores();
            setModalOpen(false);
            setEditCore(null);
        } catch (err) {
            alert('Error: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this core configuration?')) return;
        try {
            await api.delete(`/core/delete-core/${id}`);
            fetchCores();
        } catch (err) {
            alert('Error: ' + (err.message || 'Unknown error'));
        }
    };

    const openAdd = () => { setEditCore(null); setModalOpen(true); };
    const openEdit = (c) => { setEditCore(c); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditCore(null); };

    const filtered = cores.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.code?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Core Master</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Define standard cable core configurations</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
                >
                    <Plus size={16} /> Add Core
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500 mb-1">Total Cores</div>
                    <div className="text-2xl font-bold text-gray-900">{cores.length}</div>
                    <div className="text-xs text-gray-400">configurations</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500 mb-1">Active</div>
                    <div className="text-2xl font-bold text-green-600">
                        {cores.filter(c => c.status === 'active').length}
                    </div>
                    <div className="text-xs text-gray-400">ready to use</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500 mb-1">Inactive</div>
                    <div className="text-2xl font-bold text-gray-400">
                        {cores.filter(c => c.status === 'inactive').length}
                    </div>
                    <div className="text-xs text-gray-400">archived</div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-lg mb-4 p-4">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by code or name..."
                    className="w-full max-w-md px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-800/50 rounded overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-100 text-gray-800 uppercase text-xs sticky top-0 z-10">
                            <th className="text-left px-5 py-3 font-semibold tracking-wide">Code</th>
                            <th className="text-left px-5 py-3 font-semibold tracking-wide">Core Name</th>
                            <th className="text-left px-5 py-3 font-semibold tracking-wide">Conductor</th>
                            <th className="text-left px-5 py-3 font-semibold tracking-wide">Insulation</th>
                            <th className="text-center px-5 py-3 font-semibold tracking-wide">Area (mm²)</th>
                            <th className="text-center px-5 py-3 font-semibold tracking-wide">Wire Count</th>
                            <th className="text-center px-5 py-3 font-semibold tracking-wide">Status</th>
                            <th className="text-center px-5 py-3 font-semibold tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-5 py-10 text-center text-gray-400 text-sm">
                                    {cores.length === 0
                                        ? 'No cores yet. Click "Add Core" to create one.'
                                        : 'No cores match your search.'}
                                </td>
                            </tr>
                        ) : (
                            filtered.map(c => (
                                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4">
                                        <code className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                            {c.code}
                                        </code>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                <Zap size={14} className="text-gray-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-gray-900">{c.name}</div>
                                                {c.description && (
                                                    <div className="text-xs text-gray-500">{c.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="text-sm text-gray-700">
                                            {c.conductor?.materialTypeId?.name || c.conductor?.materialName || 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Density: {c.conductor?.materialDensity || 0}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="text-sm text-gray-700">
                                            {c.insulation?.materialTypeId?.name || c.insulation?.materialTypeName || 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {c.insulation?.thickness || 0}mm thick
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="text-sm font-medium text-gray-900">
                                            {c.conductor?.totalCoreArea || 0}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                            {c.conductor?.wireCount || 1}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {c.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => openEdit(c)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit"
                                            >
                                                <Edit size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c._id)}
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
            <CoreModal
                open={modalOpen}
                onClose={closeModal}
                onSuccess={editCore ? handleUpdate : handleAdd}
                core={editCore}
            />
        </div>
    );
};

export default CoreMasterPage;
