import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import api from '../api/axiosInstance';
import UserModal from '../components/users/UserModal';

const ROLE_CONFIG = {
    admin: { label: 'Admin', bg: 'bg-purple-100', text: 'text-purple-700' },
    salesperson: { label: 'Salesperson', bg: 'bg-blue-100', text: 'text-blue-700' },
    employee: { label: 'Employee', bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

const RoleBadge = ({ role }) => {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.employee;
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
};

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/user/get-all-users');
            setUsers(res.data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = () => {
        setEditingUser(null);
        setShowModal(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setShowModal(true);
    };

    const handleSave = async (formData) => {
        try {
            if (editingUser) {
                await api.put(`/user/update-user/${editingUser._id}`, formData);
            } else {
                await api.post('/user/create-user', formData);
            }
            fetchUsers();
            setShowModal(false);
        } catch (err) {
            throw new Error(err.message || 'Failed to save user');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this user? This cannot be undone.')) return;
        try {
            await api.delete(`/user/delete-user/${id}`);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    const filtered = users.filter(u => {
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        const matchSearch = !search ||
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.phoneNumbers?.some(p => p.number?.includes(search));
        return matchRole && matchSearch;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-400">
            Loading users…
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Users & Team</h1>
                    <p className="text-sm text-gray-500">Manage system users with role-based access</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 border"
                >
                    <Plus size={16} /> Add User
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or phone…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div className="flex gap-1.5">
                    {['all', 'admin', 'salesperson', 'employee'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRoleFilter(r)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${roleFilter === r
                                ? 'bg-slate-800 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {r === 'all' ? 'All' : ROLE_CONFIG[r].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-linear-to-r from-gray-50 to-gray-100 border-neutral-400/40 rounded-xl border px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{users.length}</p>
                </div>
                {['admin', 'salesperson', 'employee'].map(role => {
                    const count = users.filter(u => u.role === role).length;
                    const cfg = ROLE_CONFIG[role];
                    return (
                        <div key={role} className={`rounded-xl border px-4 py-3 ${cfg.bg} border-neutral-400/40`}>
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
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Primary Phone</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                    {search || roleFilter !== 'all'
                                        ? 'No users match your filters.'
                                        : 'No users yet. Click "Add User" to create one.'}
                                </td>
                            </tr>
                        ) : filtered.map(u => (
                            <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                {/* Name */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                            {u.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-gray-800">{u.name}</span>
                                    </div>
                                </td>

                                {/* Role */}
                                <td className="px-4 py-3">
                                    <RoleBadge role={u.role} />
                                </td>

                                {/* Primary Phone */}
                                <td className="px-4 py-3 text-gray-600">
                                    {u.primaryPhone || '—'}
                                </td>

                                {/* Location */}
                                <td className="px-4 py-3 text-gray-600">
                                    {u.address?.city && u.address?.state
                                        ? `${u.address.city}, ${u.address.state}`
                                        : u.address?.city || '—'}
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3 text-center">
                                    {u.isActive ? (
                                        <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 rounded-full">
                                            Inactive
                                        </span>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => handleEdit(u)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                                            title="Edit User"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u._id)}
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

            {/* Modal */}
            {showModal && (
                <UserModal
                    user={editingUser}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default UsersPage;
