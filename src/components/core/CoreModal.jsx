import { useState, useEffect } from 'react';

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

const CoreModal = ({ open, onClose, onSuccess, core: editCore }) => {
    const [rawMaterials, setRawMaterials] = useState([]);
    const [form, setForm] = useState({
        code: '',
        name: '',
        description: '',
        conductor: {
            materialTypeId: '',
            materialName: '',
            materialDensity: 8.96,
            totalCoreArea: 8,
            wireCount: 16,
            wastagePercent: 5,
            selectedRod: null,
            hasAnnealing: false
        },
        insulation: {
            materialTypeId: '',
            materialTypeName: '',
            density: 1.4,
            thickness: 0.5,
            freshPercent: 70,
            reprocessPercent: 30,
            freshPricePerKg: 0,
            reprocessMaterialTypeId: '',
            reprocessMaterialTypeName: '',
            reprocessDensity: null,
            reprocessPricePerKg: 0
        },
        status: 'active'
    });

    // Fetch raw materials on mount
    useEffect(() => {
        fetchRawMaterials();
    }, []);

    const fetchRawMaterials = async () => {
        try {
            const api = (await import('../../api/axiosInstance')).default;
            const res = await api.get('/raw-material/get-all-raw-materials');
            setRawMaterials(res.data || []);
        } catch (err) {
            console.error('Failed to fetch materials:', err);
        }
    };

    useEffect(() => {
        if (editCore) {
            setForm({
                code: editCore.code || '',
                name: editCore.name || '',
                description: editCore.description || '',
                conductor: {
                    materialTypeId: editCore.conductor?.materialTypeId?._id || editCore.conductor?.materialTypeId || '',
                    materialName: editCore.conductor?.materialName || '',
                    materialDensity: editCore.conductor?.materialDensity || 8.96,
                    totalCoreArea: editCore.conductor?.totalCoreArea || 8,
                    wireCount: editCore.conductor?.wireCount || 16,
                    wastagePercent: editCore.conductor?.wastagePercent || 5,
                    selectedRod: editCore.conductor?.selectedRod || null,
                    hasAnnealing: editCore.conductor?.hasAnnealing || false
                },
                insulation: {
                    materialTypeId: editCore.insulation?.materialTypeId?._id || editCore.insulation?.materialTypeId || '',
                    materialTypeName: editCore.insulation?.materialTypeName || '',
                    density: editCore.insulation?.density || 1.4,
                    thickness: editCore.insulation?.thickness || 0.5,
                    freshPercent: editCore.insulation?.freshPercent || 70,
                    reprocessPercent: editCore.insulation?.reprocessPercent || 30,
                    freshPricePerKg: editCore.insulation?.freshPricePerKg || 0,
                    reprocessMaterialTypeId: editCore.insulation?.reprocessMaterialTypeId?._id || editCore.insulation?.reprocessMaterialTypeId || '',
                    reprocessMaterialTypeName: editCore.insulation?.reprocessMaterialTypeName || '',
                    reprocessDensity: editCore.insulation?.reprocessDensity || null,
                    reprocessPricePerKg: editCore.insulation?.reprocessPricePerKg || 0
                },
                status: editCore.status || 'active'
            });
        } else {
            setForm({
                code: '',
                name: '',
                description: '',
                conductor: {
                    materialTypeId: '',
                    materialName: '',
                    materialDensity: 8.96,
                    totalCoreArea: 8,
                    wireCount: 16,
                    wastagePercent: 5,
                    selectedRod: null,
                    hasAnnealing: false
                },
                insulation: {
                    materialTypeId: '',
                    materialTypeName: '',
                    density: 1.4,
                    thickness: 0.5,
                    freshPercent: 70,
                    reprocessPercent: 30,
                    freshPricePerKg: 0,
                    reprocessMaterialTypeId: '',
                    reprocessMaterialTypeName: '',
                    reprocessDensity: null,
                    reprocessPricePerKg: 0
                },
                status: 'active'
            });
        }
    }, [editCore, open]);

    if (!open) return null;

    const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));
    const setConductorField = (field, value) => setForm(f => ({
        ...f,
        conductor: { ...f.conductor, [field]: value }
    }));
    const setInsulationField = (field, value) => setForm(f => ({
        ...f,
        insulation: { ...f.insulation, [field]: value }
    }));

    const handleConductorMaterialChange = (materialId) => {
        const material = rawMaterials.find(m => m._id === materialId);
        setConductorField('materialTypeId', materialId);
        if (material) {
            setConductorField('materialName', material.name);
            if (material.category === 'metal' && material.dimensions?.density) {
                setConductorField('materialDensity', material.dimensions.density);
            }
        }
    };

    const handleInsulationMaterialChange = (materialId) => {
        const material = rawMaterials.find(m => m._id === materialId);
        setInsulationField('materialTypeId', materialId);
        if (material) {
            setInsulationField('materialTypeName', material.name);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.code.trim() || !form.name.trim()) {
            alert('Please fill in code and name');
            return;
        }
        if (!form.conductor.materialTypeId) {
            alert('Please select conductor material');
            return;
        }

        const totalPercent = form.insulation.freshPercent + form.insulation.reprocessPercent;
        if (totalPercent !== 100 && totalPercent !== 0) {
            alert('Fresh and reprocess percentages must sum to 100%');
            return;
        }

        onSuccess(form);
    };

    const metalMaterials = rawMaterials.filter(m => m.category === 'metal');
    const insulationMaterials = rawMaterials.filter(m => m.category === 'plastic' || m.category === 'insulation');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-4">
                {/* Header */}
                <div className="border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        {editCore ? 'Edit Core' : 'Add Core'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Code *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.code}
                                    onChange={e => setField('code', e.target.value.toUpperCase())}
                                    placeholder="e.g., CORE-001"
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={e => setField('name', e.target.value)}
                                    placeholder="e.g., 16 AWG Stranded Copper Core"
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setField('description', e.target.value)}
                                    placeholder="Optional description..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Conductor Section */}
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Conductor Specifications</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Conductor Material *</label>
                                <select
                                    value={form.conductor.materialTypeId}
                                    onChange={e => handleConductorMaterialChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                    required
                                >
                                    <option value="">Select material...</option>
                                    {metalMaterials.map(m => (
                                        <option key={m._id} value={m._id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Density (g/cm³)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.conductor.materialDensity}
                                    onChange={e => setConductorField('materialDensity', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Core Area (mm²) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={form.conductor.totalCoreArea}
                                    onChange={e => setConductorField('totalCoreArea', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Wire Count *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={form.conductor.wireCount}
                                    onChange={e => setConductorField('wireCount', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Wastage %</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={form.conductor.wastagePercent}
                                    onChange={e => setConductorField('wastagePercent', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={form.conductor.hasAnnealing}
                                        onChange={e => setConductorField('hasAnnealing', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span>Has Annealing</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Insulation Section */}
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Insulation Specifications</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Insulation Material</label>
                                <select
                                    value={form.insulation.materialTypeId}
                                    onChange={e => handleInsulationMaterialChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                >
                                    <option value="">Select material...</option>
                                    {insulationMaterials.map(m => (
                                        <option key={m._id} value={m._id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Density (g/cm³)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.insulation.density}
                                    onChange={e => setInsulationField('density', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Thickness (mm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={form.insulation.thickness}
                                    onChange={e => setInsulationField('thickness', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Fresh %</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={form.insulation.freshPercent}
                                    onChange={e => setInsulationField('freshPercent', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Reprocess %</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={form.insulation.reprocessPercent}
                                    onChange={e => setInsulationField('reprocessPercent', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Fresh Price/kg</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.insulation.freshPricePerKg}
                                    onChange={e => setInsulationField('freshPricePerKg', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            value={form.status}
                            onChange={e => setField('status', e.target.value)}
                            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded text-sm"
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
                            {editCore ? 'Update Core' : 'Create Core'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CoreModal;
