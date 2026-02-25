import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Phone, MapPin, Settings } from 'lucide-react';
import api from '../../api/axiosInstance';

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-700' },
    { value: 'salesperson', label: 'Salesperson', color: 'bg-blue-100 text-blue-700' },
    { value: 'employee', label: 'Employee', color: 'bg-emerald-100 text-emerald-700' },
];

const UserModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        role: 'employee',
        phoneNumbers: [{ number: '', label: 'Primary', isPrimary: true }],
        address: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India',
        },
        processes: [], // Array of Process IDs (for employees only)
        isActive: true,
    });

    const [saving, setSaving] = useState(false);
    const [processList, setProcessList] = useState([]);
    const [loadingProcesses, setLoadingProcesses] = useState(false);

    // Fetch process master list
    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                setLoadingProcesses(true);
                const res = await api.get('/process/get-all-processes?isActive=true');
                setProcessList(res.data || []);
            } catch (err) {
                console.error('Failed to fetch processes:', err);
            } finally {
                setLoadingProcesses(false);
            }
        };
        fetchProcesses();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                role: user.role || 'employee',
                phoneNumbers: user.phoneNumbers?.length > 0
                    ? user.phoneNumbers
                    : [{ number: '', label: 'Primary', isPrimary: true }],
                address: user.address || {
                    line1: '',
                    line2: '',
                    city: '',
                    state: '',
                    pincode: '',
                    country: 'India',
                },
                processes: user.processes?.map(p => typeof p === 'object' ? p._id : p) || [],
                isActive: user.isActive !== false,
            });
        }
    }, [user]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddressChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [field]: value },
        }));
    };

    const handlePhoneChange = (index, field, value) => {
        const updatedPhones = [...formData.phoneNumbers];
        updatedPhones[index][field] = value;

        // If setting as primary, unset others
        if (field === 'isPrimary' && value === true) {
            updatedPhones.forEach((p, i) => {
                if (i !== index) p.isPrimary = false;
            });
        }

        setFormData(prev => ({ ...prev, phoneNumbers: updatedPhones }));
    };

    const handleAddPhone = () => {
        setFormData(prev => ({
            ...prev,
            phoneNumbers: [...prev.phoneNumbers, { number: '', label: '', isPrimary: false }],
        }));
    };

    const handleRemovePhone = (index) => {
        if (formData.phoneNumbers.length === 1) {
            alert('At least one phone number is required');
            return;
        }
        const updatedPhones = formData.phoneNumbers.filter((_, i) => i !== index);
        // If removed phone was primary, make first one primary
        if (!updatedPhones.some(p => p.isPrimary)) {
            updatedPhones[0].isPrimary = true;
        }
        setFormData(prev => ({ ...prev, phoneNumbers: updatedPhones }));
    };

    const handleProcessToggle = (processId) => {
        setFormData(prev => ({
            ...prev,
            processes: prev.processes.includes(processId)
                ? prev.processes.filter(id => id !== processId)
                : [...prev.processes, processId],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            alert('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {user ? 'Edit User' : 'Add New User'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">

                    {/* Name + Role */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => handleInputChange('name', e.target.value)}
                                placeholder="Enter full name"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                Role *
                            </label>
                            <select
                                required
                                value={formData.role}
                                onChange={e => handleInputChange('role', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                                {ROLE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Phone Numbers */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                <Phone size={11} />
                                Phone Numbers *
                            </label>
                            <button
                                type="button"
                                onClick={handleAddPhone}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                                <Plus size={12} /> Add Phone
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.phoneNumbers.map((phone, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input
                                        type="tel"
                                        required
                                        value={phone.number}
                                        onChange={e => handlePhoneChange(idx, 'number', e.target.value)}
                                        placeholder="Phone number"
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                    <input
                                        type="text"
                                        value={phone.label}
                                        onChange={e => handlePhoneChange(idx, 'label', e.target.value)}
                                        placeholder="Label (optional)"
                                        className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                    <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={phone.isPrimary}
                                            onChange={e => handlePhoneChange(idx, 'isPrimary', e.target.checked)}
                                            className="w-4 h-4 rounded"
                                        />
                                        Primary
                                    </label>
                                    {formData.phoneNumbers.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePhone(idx)}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <MapPin size={11} />
                            Address
                        </label>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={formData.address.line1}
                                onChange={e => handleAddressChange('line1', e.target.value)}
                                placeholder="Address Line 1"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                            <input
                                type="text"
                                value={formData.address.line2}
                                onChange={e => handleAddressChange('line2', e.target.value)}
                                placeholder="Address Line 2 (optional)"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="text"
                                    value={formData.address.city}
                                    onChange={e => handleAddressChange('city', e.target.value)}
                                    placeholder="City"
                                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                                <input
                                    type="text"
                                    value={formData.address.state}
                                    onChange={e => handleAddressChange('state', e.target.value)}
                                    placeholder="State"
                                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                                <input
                                    type="text"
                                    value={formData.address.pincode}
                                    onChange={e => handleAddressChange('pincode', e.target.value)}
                                    placeholder="Pincode"
                                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Process Assignment (Employee only) */}
                    {formData.role === 'employee' && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                                    <Settings size={12} className="text-gray-500" />
                                    Assigned Processes
                                </label>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Select processes this employee can handle from Process Master
                                </p>
                            </div>
                            <div className="bg-white p-4">
                                {loadingProcesses ? (
                                    <p className="text-sm text-gray-400 italic text-center py-4">Loading processes…</p>
                                ) : processList.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic text-center py-4">No processes available in Process Master</p>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-white border-b border-gray-100">
                                                <tr>
                                                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase w-8"></th>
                                                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Process Name</th>
                                                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Type</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {processList.map(process => {
                                                    const isSelected = formData.processes.includes(process._id);
                                                    return (
                                                        <tr
                                                            key={process._id}
                                                            onClick={() => handleProcessToggle(process._id)}
                                                            className={`cursor-pointer transition-colors ${
                                                                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <td className="py-2.5 px-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleProcessToggle(process._id)}
                                                                    className="w-4 h-4 rounded border-gray-300"
                                                                    onClick={e => e.stopPropagation()}
                                                                />
                                                            </td>
                                                            <td className={`py-2.5 px-2 font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                                                {process.name}
                                                            </td>
                                                            <td className="py-2.5 px-2 text-gray-500">
                                                                {process.processType || '—'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {formData.processes.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                        <span className="text-gray-500">
                                            {formData.processes.length} process{formData.processes.length !== 1 ? 'es' : ''} selected
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleInputChange('processes', [])}
                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Active Status */}
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={e => handleInputChange('isActive', e.target.checked)}
                            className="w-4 h-4 rounded"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                            Active User
                        </label>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : user ? 'Update User' : 'Create User'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserModal;
