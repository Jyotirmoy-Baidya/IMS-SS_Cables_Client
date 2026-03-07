import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const CATEGORY_OPTIONS = [
    { value: 'conductor', label: 'Conductor (drawn/stranded wire)' },
    { value: 'core', label: 'Core (insulated conductor)' },
    { value: 'cable', label: 'Cable (cabled cores)' },
    { value: 'armoured', label: 'Armoured (with armour layer)' },
    { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

const IntermediateProductModal = ({ open, onClose, onSuccess, product: editProduct }) => {
    const [form, setForm] = useState({
        code: '',
        name: '',
        description: '',
        category: 'other',
        unit: 'kg',
        status: 'active',
        specifications: {}
    });

    const [specKey, setSpecKey] = useState('');
    const [specValue, setSpecValue] = useState('');

    useEffect(() => {
        if (editProduct) {
            setForm({
                code: editProduct.code || '',
                name: editProduct.name || '',
                description: editProduct.description || '',
                category: editProduct.category || 'other',
                unit: editProduct.unit || 'kg',
                status: editProduct.status || 'active',
                specifications: editProduct.specifications || {}
            });
        } else {
            setForm({
                code: '',
                name: '',
                description: '',
                category: 'other',
                unit: 'kg',
                status: 'active',
                specifications: {}
            });
        }
        setSpecKey('');
        setSpecValue('');
    }, [editProduct, open]);

    if (!open) return null;

    const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const addSpecification = () => {
        if (!specKey.trim() || !specValue.trim()) return;
        setForm(f => ({
            ...f,
            specifications: { ...f.specifications, [specKey.trim()]: specValue.trim() }
        }));
        setSpecKey('');
        setSpecValue('');
    };

    const removeSpecification = (key) => {
        const newSpecs = { ...form.specifications };
        delete newSpecs[key];
        setForm(f => ({ ...f, specifications: newSpecs }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.code.trim() || !form.name.trim()) {
            alert('Please fill in code and name');
            return;
        }
        onSuccess(form);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-4">
                {/* Header */}
                <div className="border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        {editProduct ? 'Edit Intermediate Product' : 'Add Intermediate Product'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Code & Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Product Code *</label>
                            <input
                                type="text"
                                required
                                value={form.code}
                                onChange={e => setField('code', e.target.value.toUpperCase())}
                                placeholder="e.g., WIP-001"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Product Name *</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={e => setField('name', e.target.value)}
                                placeholder="e.g., Drawn Copper Wire"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                        </div>
                    </div>

                    {/* Category & Unit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Category *</label>
                            <select
                                value={form.category}
                                onChange={e => setField('category', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            >
                                {CATEGORY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Unit of Measure *</label>
                            <input
                                type="text"
                                required
                                value={form.unit}
                                onChange={e => setField('unit', e.target.value)}
                                placeholder="e.g., kg, m, pcs"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setField('description', e.target.value)}
                            placeholder="Optional description..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                        />
                    </div>

                    {/* Specifications */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Specifications (Optional)</label>
                        <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                            {/* Add Specification */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={specKey}
                                    onChange={e => setSpecKey(e.target.value)}
                                    placeholder="Key (e.g., Diameter)"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                                />
                                <input
                                    type="text"
                                    value={specValue}
                                    onChange={e => setSpecValue(e.target.value)}
                                    placeholder="Value (e.g., 2.5mm)"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={addSpecification}
                                    disabled={!specKey.trim() || !specValue.trim()}
                                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add
                                </button>
                            </div>

                            {/* List Specifications */}
                            {Object.entries(form.specifications).length > 0 ? (
                                <div className="space-y-1 mt-2">
                                    {Object.entries(form.specifications).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-2 text-sm">
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-700">{key}:</span>{' '}
                                                <span className="text-gray-600">{value}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeSpecification(key)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-2">No specifications added yet</p>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Status *</label>
                        <select
                            value={form.status}
                            onChange={e => setField('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-700"
                        >
                            {editProduct ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IntermediateProductModal;
