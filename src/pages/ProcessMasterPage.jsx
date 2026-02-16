import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Zap } from 'lucide-react';
import api from '../api/axiosInstance';
import ProcessModal from '../components/process/ProcessModal';

const CATEGORY_COLORS = {
    conductor:  'bg-yellow-100 text-yellow-800',
    insulation: 'bg-purple-100 text-purple-800',
    sheathing:  'bg-green-100 text-green-800',
    general:    'bg-gray-100 text-gray-700',
};

const ProcessMasterPage = () => {
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editProcess, setEditProcess] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchProcesses(); }, []);

    const fetchProcesses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/process/get-all-processes');
            setProcesses(res.data || []);
        } catch (err) {
            console.error('Failed to fetch processes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (data) => {
        try {
            await api.post('/process/add-process', data);
            fetchProcesses();
            setModalOpen(false);
        } catch (err) {
            alert('Error: ' + (err.message || 'Unknown error'));
        }
    };

    const handleUpdate = async (data) => {
        try {
            await api.put(`/process/update-process/${editProcess._id}`, data);
            fetchProcesses();
            setModalOpen(false);
            setEditProcess(null);
        } catch (err) {
            alert('Error: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this process? It will no longer appear in quotations.')) return;
        try {
            await api.delete(`/process/delete-process/${id}`);
            fetchProcesses();
        } catch (err) {
            alert('Error: ' + (err.message || 'Unknown error'));
        }
    };

    const openAdd = () => { setEditProcess(null); setModalOpen(true); };
    const openEdit = (p) => { setEditProcess(p); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditProcess(null); };

    const filtered = processes.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Process Master</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Define manufacturing processes with dynamic cost formulas</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
                >
                    <Plus size={16} /> Add Process
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {['conductor', 'insulation', 'sheathing', 'general'].map(cat => (
                    <div key={cat} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="text-sm text-gray-500 capitalize mb-1">{cat}</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {processes.filter(p => p.category === cat && p.isActive).length}
                        </div>
                        <div className="text-xs text-gray-400">active processes</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-lg mb-4 p-4">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or category..."
                    className="w-full max-w-md px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-800/50 rounded overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-100 text-gray-800 uppercase text-xs sticky top-0 z-10">
                            <th className="text-left px-5 py-3 font-semibold tracking-wide">Process</th>
                            <th className="text-left px-5 py-3 font-semibold tracking-wide">Category</th>
                            <th className="text-left px-5 py-3 font-semibold tracking-wide">Formula</th>
                            <th className="text-center px-5 py-3 font-semibold tracking-wide">Variables</th>
                            <th className="text-center px-5 py-3 font-semibold tracking-wide">Status</th>
                            <th className="text-center px-5 py-3 font-semibold tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-5 py-10 text-center text-gray-400 text-sm">
                                    {processes.length === 0
                                        ? 'No processes yet. Click "Add Process" to create one.'
                                        : 'No processes match your search.'}
                                </td>
                            </tr>
                        ) : (
                            filtered.map(p => (
                                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                <Zap size={14} className="text-gray-600" />
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
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[p.category] || CATEGORY_COLORS.general}`}>
                                            {p.category}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 max-w-xs">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 block truncate">
                                            {p.formula}
                                        </code>
                                        {p.formulaNote && (
                                            <div className="text-xs text-gray-400 mt-1">{p.formulaNote}</div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                            {p.variables?.length || 0}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {p.isActive ? 'Active' : 'Inactive'}
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
            <ProcessModal
                open={modalOpen}
                onClose={closeModal}
                onSuccess={editProcess ? handleUpdate : handleAdd}
                process={editProcess}
            />
        </div>
    );
};

export default ProcessMasterPage;
