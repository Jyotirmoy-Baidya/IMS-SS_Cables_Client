import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, MapPin, X } from 'lucide-react';
import api from '../api/axiosInstance';

const LocationsPage = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [formData, setFormData] = useState({ name: '', address: '', isActive: true });
    const [saving, setSaving] = useState(false);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/location/get-all-locations');
            setLocations(res.data || []);
        } catch (err) {
            console.error('Failed to fetch locations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handleCreate = () => {
        setEditingLocation(null);
        setFormData({ name: '', address: '', isActive: true });
        setShowModal(true);
    };

    const handleEdit = (location) => {
        setEditingLocation(location);
        setFormData({
            name: location.name || '',
            address: location.address || '',
            isActive: location.isActive !== false,
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingLocation) {
                await api.put(`/location/update-location/${editingLocation._id}`, formData);
            } else {
                await api.post('/location/create-location', formData);
            }
            fetchLocations();
            setShowModal(false);
        } catch (err) {
            alert('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this location? This cannot be undone.')) return;
        try {
            await api.delete(`/location/delete-location/${id}`);
            fetchLocations();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-400">
            Loading locations…
        </div>
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Locations</h1>
                    <p className="text-sm text-gray-500">Manage production facility locations</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 border"
                >
                    <Plus size={16} /> Add Location
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Location Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {locations.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                    No locations yet. Click "Add Location" to create one.
                                </td>
                            </tr>
                        ) : locations.map(loc => (
                            <tr key={loc._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-gray-400" />
                                        <span className="font-medium text-gray-800">{loc.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {loc.address || <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {loc.isActive ? (
                                        <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 rounded-full">
                                            Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => handleEdit(loc)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                                            title="Edit Location"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(loc._id)}
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingLocation ? 'Edit Location' : 'Add New Location'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Location Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Paglahar, Park Circus"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Address (Optional)
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Enter full address..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                    className="w-4 h-4 rounded"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                    Active Location
                                </label>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : editingLocation ? 'Update Location' : 'Create Location'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationsPage;
