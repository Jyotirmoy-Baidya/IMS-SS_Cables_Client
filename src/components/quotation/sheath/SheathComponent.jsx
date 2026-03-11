import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Layers, CheckCircle, AlertTriangle, Package, Minimize2, Maximize2, Save } from 'lucide-react';
import ProcessSelector from '../processes/ProcessSelector';
import api from '../../../api/axiosInstance';

const fmtN = (n, d = 3) => Number(n || 0).toFixed(d);
const fmtCur = (n) => '₹' + Number(n || 0).toFixed(2);

const StatBox = ({ label, value, accent }) => (
    <div className={`rounded-lg px-3 py-2 ${accent ? 'bg-teal-50 border border-teal-100' : 'bg-gray-50 border border-gray-100'}`}>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm font-bold ${accent ? 'text-teal-700' : 'text-gray-700'}`}>{value}</p>
    </div>
);

const FieldLabel = ({ children }) => (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{children}</label>
);

const InputField = ({ className = '', ...props }) => (
    <input
        {...props}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition ${className}`}
    />
);

const SelectField = ({ className = '', children, ...props }) => (
    <select
        {...props}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition ${className}`}
    >
        {children}
    </select>
);

// Default initial sheath structure
const getDefaultSheath = (id) => ({
    id: id || Date.now(),
    coreIds: [],
    sheathIds: [],
    materialTypeId: null,
    materialTypeName: '',
    materialId: null,
    reprocessMaterialId: null,
    thickness: 1.0,
    density: 1.4,
    freshPercent: 60,
    reprocessPercent: 40,
    wastagePercent: 0,
    sheathLength: null,
    processes: [],
    materialRequired: []
});

const SheathComponent = ({
    sheathGroup: providedSheath,
    index,
    cableLength,
    quotationId,
    cores = [],
    sheathGroups = [],
    onDeleteFromParent
}) => {
    // Merge provided sheath with defaults to ensure all required fields exist
    const initialSheath = useMemo(() => {
        if (!providedSheath) return getDefaultSheath();

        return {
            ...getDefaultSheath(providedSheath.id),
            ...providedSheath
        };
    }, [providedSheath]);

    // Local sheath state
    const [sheath, setSheath] = useState(initialSheath);

    // UI state
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(!!initialSheath._id);

    // Material data
    const [insulationTypes, setInsulationTypes] = useState([]);
    const [insulationRawMaterials, setInsulationRawMaterials] = useState([]);
    const [processMasterList, setProcessMasterList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch materials and processes on mount
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const [typesRes, insulMatRes, processRes] = await Promise.all([
                    api.get('/material-type/get-all-material-types'),
                    api.get('/raw-material/get-all-materials'),
                    api.get('/process/get-all-processes?isActive=true')
                ]);

                const allTypes = typesRes.data || [];
                setInsulationTypes(allTypes.filter(t => t.category === 'insulation' || t.category === 'plastic'));
                const allMats = insulMatRes.data || [];
                setInsulationRawMaterials(allMats.filter(m => m.category === 'insulation' || m.category === 'plastic'));
                setProcessMasterList(processRes.data || []);
            } catch (err) {
                console.error('Failed to fetch materials:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, []);

    // Sync with parent sheath changes
    useEffect(() => {
        setSheath(initialSheath);
        setIsSaved(!!initialSheath._id);
    }, [initialSheath]);

    // Update local sheath state
    const handleSheathUpdate = (field, value) => {
        setIsSaved(false);

        // Auto-adjust complementary percentage for fresh/reprocess
        if (field === 'freshPercent') {
            const freshVal = Math.max(0, Math.min(100, value));
            setSheath(prev => ({
                ...prev,
                freshPercent: freshVal,
                reprocessPercent: 100 - freshVal
            }));
        } else if (field === 'reprocessPercent') {
            const reprocessVal = Math.max(0, Math.min(100, value));
            setSheath(prev => ({
                ...prev,
                reprocessPercent: reprocessVal,
                freshPercent: 100 - reprocessVal
            }));
        } else {
            setSheath(prev => ({ ...prev, [field]: value }));
        }
    };

    // Save sheath to backend
    const handleSave = async () => {
        if (!quotationId) {
            alert('No quotation ID found. Please refresh the page.');
            return;
        }

        setIsSaving(true);
        try {
            let response;
            if (sheath._id) {
                // Update existing sheath
                response = await api.put(`/quotation/${quotationId}/sheaths/${sheath._id}`, sheath);
            } else {
                // Create new sheath
                response = await api.post(`/quotation/${quotationId}/sheaths`, sheath);
            }

            // Update local state with saved sheath data (including _id)
            setSheath(prev => ({ ...prev, _id: response.data._id }));
            setIsSaved(true);
        } catch (error) {
            console.error('Failed to save sheath:', error);
            alert('Failed to save sheath: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    // Delete sheath
    const handleDelete = async () => {
        // If sheath is saved to backend, delete it from there
        if (sheath._id && quotationId) {
            try {
                await api.delete(`/quotation/${quotationId}/sheaths/${sheath._id}`);
            } catch (err) {
                console.error('Failed to delete sheath from backend:', err);
                alert('Failed to delete sheath: ' + (err.message || 'Unknown error'));
                return;
            }
        }

        // Notify parent to update state
        if (onDeleteFromParent) {
            onDeleteFromParent(sheath.id);
        }
    };

    // Process management
    const addProcess = (entry) => {
        setIsSaved(false);
        setSheath(prev => ({
            ...prev,
            processes: [...(prev.processes || []), entry]
        }));
    };

    const removeProcess = (processId) => {
        setIsSaved(false);
        setSheath(prev => ({
            ...prev,
            processes: (prev.processes || []).filter(p => p.id !== processId)
        }));
    };

    const updateProcessVariable = (processId, varName, value) => {
        setIsSaved(false);
        setSheath(prev => ({
            ...prev,
            processes: (prev.processes || []).map(p => {
                if (p.id !== processId) return p;
                return {
                    ...p,
                    variables: p.variables.map(v =>
                        v.name === varName ? { ...v, value } : v
                    )
                };
            })
        }));
    };

    // Build quote context for process variable calculations
    const quoteContext = {
        cableLength,
        sheathThickness: sheath.thickness || 0,
        sheathDensity: sheath.density || 1.4
    };

    const handleInsulationTypeSelect = (typeId) => {
        setIsSaved(false);
        if (!typeId) {
            setSheath(prev => ({
                ...prev,
                materialTypeId: null,
                materialTypeName: '',
                materialId: null,
                density: 1.4
            }));
            return;
        }
        const type = insulationTypes.find(t => t._id === typeId);
        if (!type) return;
        setSheath(prev => ({
            ...prev,
            materialTypeId: typeId,
            materialTypeName: type.name,
            materialId: null,
            density: type.density || 1.4
        }));
    };

    const handleSheathMaterialSelect = (materialId) => {
        setIsSaved(false);
        if (!materialId) {
            setSheath(prev => ({
                ...prev,
                materialId: null
            }));
            return;
        }
        const material = insulationRawMaterials.find(m => m._id === materialId);
        if (!material) return;
        setSheath(prev => ({
            ...prev,
            materialId: material._id
        }));
    };

    const handleReprocessMaterialSelect = (materialId) => {
        setIsSaved(false);
        if (!materialId) {
            setSheath(prev => ({
                ...prev,
                reprocessMaterialId: null
            }));
            return;
        }
        const material = insulationRawMaterials.find(m => m._id === materialId);
        if (!material) return;
        setSheath(prev => ({
            ...prev,
            reprocessMaterialId: material._id
        }));
    };

    // Helper to check which cores are available (not used in any sheath)
    const getAvailableCores = () => {
        const usedCoreIds = new Set();
        sheathGroups.forEach(sg => {
            if (sg.id !== sheath.id) {
                (sg.coreIds || []).forEach(cid => usedCoreIds.add(cid));
            }
        });
        return cores.filter(c => !usedCoreIds.has(c.id) && !usedCoreIds.has(c._id));
    };

    // Helper to check which sheaths are available (not used in any other sheath, no circular refs)
    const getAvailableSheaths = () => {
        const usedSheathIds = new Set();
        sheathGroups.forEach(sg => {
            if (sg.id !== sheath.id) {
                (sg.sheathIds || []).forEach(sid => usedSheathIds.add(sid));
            }
        });
        // Also exclude self
        usedSheathIds.add(sheath.id);
        usedSheathIds.add(sheath._id);
        return sheathGroups.filter(sg => !usedSheathIds.has(sg.id) && !usedSheathIds.has(sg._id));
    };

    const toggleCore = (coreId) => {
        setIsSaved(false);
        const currentCoreIds = sheath.coreIds || [];
        if (currentCoreIds.includes(coreId)) {
            setSheath(prev => ({
                ...prev,
                coreIds: currentCoreIds.filter(id => id !== coreId)
            }));
        } else {
            setSheath(prev => ({
                ...prev,
                coreIds: [...currentCoreIds, coreId]
            }));
        }
    };

    const toggleSheath = (sheathId) => {
        setIsSaved(false);
        const currentSheathIds = sheath.sheathIds || [];
        if (currentSheathIds.includes(sheathId)) {
            setSheath(prev => ({
                ...prev,
                sheathIds: currentSheathIds.filter(id => id !== sheathId)
            }));
        } else {
            setSheath(prev => ({
                ...prev,
                sheathIds: [...currentSheathIds, sheathId]
            }));
        }
    };

    // Calculate process cost for this sheath
    const processCost = (sheath.processes || []).reduce((sum, process) => {
        const scope = {};
        (process.variables || []).forEach(v => {
            scope[v.name] = parseFloat(v.value) || 0;
        });
        try {
            if (!process.formula || !process.formula.trim()) return sum;
            // eslint-disable-next-line no-new-func
            const fn = new Function(...Object.keys(scope), `return (${process.formula})`);
            const result = fn(...Object.values(scope));
            return sum + (typeof result === 'number' && isFinite(result) ? result : 0);
        } catch {
            return sum;
        }
    }, 0);

    const filteredInsulationMaterials = sheath.materialTypeId
        ? insulationRawMaterials.filter(m => {
            const mtId = typeof m.materialTypeId === 'object' ? m.materialTypeId?._id : m.materialTypeId;
            return mtId === sheath.materialTypeId;
        })
        : [];

    const availableCores = getAvailableCores();
    const availableSheaths = getAvailableSheaths();

    const selectedCoreCount = (sheath.coreIds || []).length;
    const selectedSheathCount = (sheath.sheathIds || []).length;
    const totalInnerElements = selectedCoreCount + selectedSheathCount;

    if (loading) {
        return (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                            <Layers size={20} className="text-teal-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Sheath Group {index + 1}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {totalInnerElements} element{totalInnerElements !== 1 ? 's' : ''} • {sheath.materialTypeName || 'No material selected'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Save Status */}
                        {!isSaved && !isSaving && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                                <AlertTriangle size={12} />
                                Unsaved
                            </span>
                        )}
                        {isSaved && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                <CheckCircle size={12} />
                                Saved
                            </span>
                        )}

                        {/* Save Button */}
                        {!isSaved && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    isSaving
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-teal-600 text-white hover:bg-teal-700'
                                }`}
                            >
                                <Save size={14} />
                                {isSaving ? 'Saving...' : 'Save Sheath'}
                            </button>
                        )}

                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title={isCollapsed ? 'Expand' : 'Collapse'}
                        >
                            {isCollapsed ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-600 transition-colors"
                            title="Remove sheath group"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {!isCollapsed && (
                <div className="p-6 space-y-6">
                    {/* Core Selection */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <FieldLabel>Select Cores for this Sheath</FieldLabel>
                        {availableCores.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No cores available. All cores are already assigned to other sheaths.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {availableCores.map((core, idx) => {
                                    const coreId = core._id || core.id;
                                    const isSelected = (sheath.coreIds || []).includes(coreId);
                                    return (
                                        <label
                                            key={coreId}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition ${
                                                isSelected
                                                    ? 'bg-blue-100 border-blue-400 text-blue-800'
                                                    : 'bg-white border-gray-200 hover:border-blue-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleCore(coreId)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-300"
                                            />
                                            <span className="text-sm font-medium">Core {idx + 1}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Nested Sheath Selection */}
                    {availableSheaths.length > 0 && (
                        <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
                            <FieldLabel>Select Nested Sheaths (Optional)</FieldLabel>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {availableSheaths.map((sg, idx) => {
                                    const sgId = sg._id || sg.id;
                                    const isSelected = (sheath.sheathIds || []).includes(sgId);
                                    return (
                                        <label
                                            key={sgId}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition ${
                                                isSelected
                                                    ? 'bg-teal-100 border-teal-400 text-teal-800'
                                                    : 'bg-white border-gray-200 hover:border-teal-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSheath(sgId)}
                                                className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-300"
                                            />
                                            <span className="text-sm font-medium">Sheath {idx + 1}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Material Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>Sheath Material Type</FieldLabel>
                            <SelectField
                                value={sheath.materialTypeId || ''}
                                onChange={(e) => handleInsulationTypeSelect(e.target.value)}
                            >
                                <option value="">-- Select Type --</option>
                                {insulationTypes.map(type => (
                                    <option key={type._id} value={type._id}>
                                        {type.name} (ρ={type.density})
                                    </option>
                                ))}
                            </SelectField>
                        </div>
                        <div>
                            <FieldLabel>Fresh Material</FieldLabel>
                            <SelectField
                                value={sheath.materialId || ''}
                                onChange={(e) => handleSheathMaterialSelect(e.target.value)}
                                disabled={!sheath.materialTypeId}
                            >
                                <option value="">-- Select Material --</option>
                                {filteredInsulationMaterials.map(mat => (
                                    <option key={mat._id} value={mat._id}>
                                        {mat.name}
                                    </option>
                                ))}
                            </SelectField>
                        </div>
                    </div>

                    {/* Sheath Specifications */}
                    <div className="space-y-4">
                        <div>
                            <FieldLabel>Thickness (mm)</FieldLabel>
                            <InputField
                                type="number"
                                step="0.1"
                                value={sheath.thickness || ''}
                                onChange={(e) => handleSheathUpdate('thickness', parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        {/* Fresh / Reprocess Mix Slider */}
                        <div>
                            <FieldLabel>
                                Fresh / Reprocess Mix
                                <span className="ml-2 text-emerald-600 font-normal">{sheath.freshPercent}% fresh</span>
                                <span className="mx-1 text-gray-400">/</span>
                                <span className="text-purple-600 font-normal">{sheath.reprocessPercent}% reprocess</span>
                            </FieldLabel>
                            <div className="space-y-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={sheath.freshPercent}
                                    onChange={(e) => handleSheathUpdate('freshPercent', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gradient-to-r from-emerald-200 via-emerald-300 to-purple-300 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${sheath.freshPercent}%, #a855f7 ${sheath.freshPercent}%, #a855f7 100%)`
                                    }}
                                />
                                <div className="flex justify-between text-xs">
                                    <span className="text-emerald-600 font-medium">100% Fresh</span>
                                    <span className="text-gray-500">50/50</span>
                                    <span className="text-purple-600 font-medium">100% Reprocess</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reprocess Material */}
                    {sheath.reprocessPercent > 0 && (
                        <div>
                            <FieldLabel>Reprocess Material (Optional)</FieldLabel>
                            <SelectField
                                value={sheath.reprocessMaterialId || ''}
                                onChange={(e) => handleReprocessMaterialSelect(e.target.value)}
                            >
                                <option value="">-- Use same as fresh --</option>
                                {filteredInsulationMaterials.map(mat => (
                                    <option key={mat._id} value={mat._id}>
                                        {mat.name}
                                    </option>
                                ))}
                            </SelectField>
                        </div>
                    )}

                    {/* Wastage */}
                    <div>
                        <FieldLabel>Wastage %</FieldLabel>
                        <InputField
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={sheath.wastagePercent || ''}
                            onChange={(e) => handleSheathUpdate('wastagePercent', parseFloat(e.target.value) || 0)}
                        />
                    </div>

                    {/* Process Management */}
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Sheath Processes</h4>
                            <span className="text-sm text-gray-500">
                                {(sheath.processes || []).length} process{(sheath.processes || []).length !== 1 ? 'es' : ''}
                            </span>
                        </div>
                        <ProcessSelector
                            processes={sheath.processes || []}
                            processMasterList={processMasterList}
                            quoteContext={quoteContext}
                            onAdd={addProcess}
                            onRemove={removeProcess}
                            onUpdateVariable={updateProcessVariable}
                        />
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <StatBox
                            label="Inner Elements"
                            value={`${selectedCoreCount} cores, ${selectedSheathCount} sheaths`}
                            accent={false}
                        />
                        <StatBox
                            label="Process Cost"
                            value={fmtCur(processCost)}
                            accent={false}
                        />
                        <StatBox
                            label="Status"
                            value={isSaved ? 'Saved' : 'Unsaved'}
                            accent={!isSaved}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SheathComponent;
