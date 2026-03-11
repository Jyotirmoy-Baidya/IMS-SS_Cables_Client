import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Zap, Package, Layers, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Copy, Minimize2, Maximize2 } from 'lucide-react';
import {
    calculateWireDimensions,
    calculateDrawingLength,
    calculateMaterialWeight,
    calculateCoreDiameter,
    calculateInsulation,
    calculateOuterArea
} from '../../../utils/cableCalculations';
import ProcessSelector from '../processes/ProcessSelector';
import api from '../../../api/axiosInstance';

const fmtN = (n, d = 3) => Number(n || 0).toFixed(d);
const fmtCur = (n) => '₹' + Number(n || 0).toFixed(2);

const StatBox = ({ label, value, accent }) => (
    <div className={`rounded-lg px-3 py-2 ${accent ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm font-bold ${accent ? 'text-blue-700' : 'text-gray-700'}`}>{value}</p>
    </div>
);

const FieldLabel = ({ children }) => (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{children}</label>
);

const InputField = ({ className = '', ...props }) => (
    <input
        {...props}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition ${className}`}
    />
);

const SelectField = ({ className = '', children, ...props }) => (
    <select
        {...props}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition ${className}`}
    >
        {children}
    </select>
);

// Default initial core structure
const getDefaultCore = (id) => ({
    id: id || Date.now(),
    materialTypeId: null,
    materialTypeName: '',
    materialId: null,
    materialDensity: 8.96,
    totalCoreArea: 8,
    wireCount: 16,
    wastagePercent: 5,
    selectedRod: null,
    hasAnnealing: false,
    hasInsulation: false,
    coreLength: null,
    insulation: {
        materialTypeId: null,
        materialTypeName: '',
        materialId: null,
        reprocessMaterialId: null,
        thickness: 1,
        density: 1.4,
        freshPercent: 100,
        reprocessPercent: 0,
        wastagePercent: 5
    },
    processes: [],
    materialRequired: []
});

const CoreComponent = ({
    core: providedCore,
    index,
    cableLength,
    quotationId,
    onDeleteFromParent,
    onDuplicate
}) => {
    // Merge provided core with defaults to ensure all required fields exist
    const initialCore = useMemo(() => {
        if (!providedCore) return getDefaultCore();

        return {
            ...getDefaultCore(providedCore.id),
            ...providedCore,
            insulation: {
                ...getDefaultCore().insulation,
                ...(providedCore.insulation || {})
            }
        };
    }, [providedCore]);

    // Local core state
    const [core, setCore] = useState(initialCore);

    // UI state
    const [showRodSelection, setShowRodSelection] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(!!initialCore._id);

    // Material data
    const [metalTypes, setMetalTypes] = useState([]);
    const [insulationTypes, setInsulationTypes] = useState([]);
    const [metalRawMaterials, setMetalRawMaterials] = useState([]);
    const [insulationRawMaterials, setInsulationRawMaterials] = useState([]);
    const [processMasterList, setProcessMasterList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch materials and processes on mount
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const [typesRes, metalMatRes, insulMatRes, processRes] = await Promise.all([
                    api.get('/material-type/get-all-material-types'),
                    api.get('/raw-material/get-all-materials?category=metal'),
                    api.get('/raw-material/get-all-materials'),
                    api.get('/process/get-all-processes?isActive=true')
                ]);

                const allTypes = typesRes.data || [];
                setMetalTypes(allTypes.filter(t => t.category === 'metal'));
                setInsulationTypes(allTypes.filter(t => t.category === 'insulation' || t.category === 'plastic'));
                setMetalRawMaterials(metalMatRes.data || []);
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

    // Sync with parent core changes
    useEffect(() => {
        setCore(initialCore);
        setIsSaved(!!initialCore._id);
    }, [initialCore]);

    // Update local core state
    const handleCoreUpdate = (field, value) => {
        setIsSaved(false);
        setCore(prev => ({ ...prev, [field]: value }));
    };

    // Toggle insulation on/off
    const handleInsulationToggle = (enabled) => {
        setIsSaved(false);
        if (!enabled) {
            // Clear insulation data when disabling
            setCore(prev => ({
                ...prev,
                hasInsulation: false,
                insulation: {
                    materialTypeId: null,
                    materialTypeName: '',
                    materialId: null,
                    reprocessMaterialId: null,
                    thickness: 1,
                    density: 1.4,
                    freshPercent: 100,
                    reprocessPercent: 0,
                    wastagePercent: 5
                }
            }));
        } else {
            setCore(prev => ({ ...prev, hasInsulation: true }));
        }
    };

    const handleInsulationUpdate = (field, value) => {
        setIsSaved(false);

        // Auto-adjust complementary percentage for fresh/reprocess
        if (field === 'freshPercent') {
            const freshVal = Math.max(0, Math.min(100, value));
            setCore(prev => ({
                ...prev,
                insulation: {
                    ...prev.insulation,
                    freshPercent: freshVal,
                    reprocessPercent: 100 - freshVal
                }
            }));
        } else if (field === 'reprocessPercent') {
            const reprocessVal = Math.max(0, Math.min(100, value));
            setCore(prev => ({
                ...prev,
                insulation: {
                    ...prev.insulation,
                    reprocessPercent: reprocessVal,
                    freshPercent: 100 - reprocessVal
                }
            }));
        } else {
            setCore(prev => ({
                ...prev,
                insulation: { ...prev.insulation, [field]: value }
            }));
        }
    };

    // Save core to backend
    const handleSave = async () => {
        if (!quotationId) {
            alert('No quotation ID found. Please refresh the page.');
            return;
        }
        console.log(core);
        setIsSaving(true);
        try {
            let response;
            if (core._id) {
                // Update existing core
                response = await api.put(`/quotation/${quotationId}/cores/${core._id}`, core);
            } else {
                // Create new core
                response = await api.post(`/quotation/${quotationId}/cores`, core);
            }

            // Update local state with saved core data (including _id)
            setCore(prev => ({ ...prev, _id: response.data._id }));
            setIsSaved(true);
        } catch (error) {
            console.error('Failed to save core:', error);
            alert('Failed to save core: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    // Delete core
    const handleDelete = async () => {
        // If core is saved to backend, delete it from there
        if (core._id && quotationId) {
            try {
                await api.delete(`/quotation/${quotationId}/cores/${core._id}`);
            } catch (err) {
                console.error('Failed to delete core from backend:', err);
                alert('Failed to delete core: ' + (err.message || 'Unknown error'));
                return;
            }
        }

        // Notify parent to update state (remove from cores array and sheathGroups)
        if (onDeleteFromParent) {
            onDeleteFromParent(core.id);
        }
    };

    // Process management
    const addProcess = (entry) => {
        setIsSaved(false);
        setCore(prev => ({
            ...prev,
            processes: [...(prev.processes || []), entry]
        }));
    };

    const removeProcess = (processId) => {
        setIsSaved(false);
        setCore(prev => ({
            ...prev,
            processes: (prev.processes || []).filter(p => p.id !== processId)
        }));
    };

    const updateProcessVariable = (processId, varName, value) => {
        setIsSaved(false);
        setCore(prev => ({
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
        coreArea: core.totalCoreArea,
        wireCount: core.wireCount,
        coreDiameter: calculateCoreDiameter(
            calculateWireDimensions(core.totalCoreArea, core.wireCount).diameterPerWire,
            core.wireCount
        ),
        insulationThickness: core.insulation?.thickness || 0,
        materialDensity: core.materialDensity || 8.96,
        insulationDensity: core.insulation?.density || 1.4
    };

    const handleMaterialTypeSelect = (typeId) => {
        setIsSaved(false);
        if (!typeId) {
            setCore(prev => ({
                ...prev,
                materialTypeId: null,
                materialTypeName: '',
                materialDensity: 8.96
            }));
            return;
        }
        const type = metalTypes.find(t => t._id === typeId);
        if (!type) return;
        setCore(prev => ({
            ...prev,
            materialTypeId: typeId,
            materialTypeName: type.name,
            materialDensity: type.density || 8.96
        }));
    };

    const handleRodSelect = (rod) => {
        setIsSaved(false);
        setCore(prev => ({ ...prev, selectedRod: rod }));
        setShowRodSelection(false);
    };

    const handleInsulationTypeSelect = (typeId) => {
        setIsSaved(false);
        if (!typeId) {
            setCore(prev => ({
                ...prev,
                insulation: {
                    ...prev.insulation,
                    materialTypeId: null,
                    materialTypeName: '',
                    materialId: null,
                    material: null,
                    density: 1.4,
                    freshPricePerKg: 0,
                    reprocessPricePerKg: 0
                }
            }));
            return;
        }
        const type = insulationTypes.find(t => t._id === typeId);
        if (!type) return;
        setCore(prev => ({
            ...prev,
            insulation: {
                ...prev.insulation,
                materialTypeId: typeId,
                materialTypeName: type.name,
                materialId: null,
                material: null,
                density: type.density || 1.4,
                freshPricePerKg: 0,
                reprocessPricePerKg: 0
            }
        }));
    };

    const handleInsulationMaterialSelect = (materialId) => {
        setIsSaved(false);
        if (!materialId) {
            setCore(prev => ({
                ...prev,
                insulation: {
                    ...prev.insulation,
                    materialId: null,
                    material: null,
                    freshPricePerKg: 0,
                    reprocessPricePerKg: 0
                }
            }));
            return;
        }
        const material = insulationRawMaterials.find(m => m._id === materialId);
        if (!material) return;
        setCore(prev => ({
            ...prev,
            insulation: {
                ...prev.insulation,
                materialId: material._id,
                material: {
                    _id: material._id,
                    name: material.name,
                    category: material.category,
                    specifications: material.specifications
                },
                freshPricePerKg: material?.inventory?.avgPricePerKg || 0,
                reprocessPricePerKg: material?.reprocessInventory?.pricePerKg || 0
            }
        }));
    };

    const handleReprocessTypeSelect = (typeId) => {
        setIsSaved(false);
        if (!typeId) {
            setCore(prev => ({
                ...prev,
                insulation: {
                    ...prev.insulation,
                    reprocessMaterialTypeId: null,
                    reprocessMaterialTypeName: '',
                    reprocessMaterialId: null,
                    reprocessMaterial: null,
                    reprocessDensity: null,
                    reprocessPricePerKg: 0
                }
            }));
            return;
        }
        const type = insulationTypes.find(t => t._id === typeId);
        if (!type) return;
        setCore(prev => ({
            ...prev,
            insulation: {
                ...prev.insulation,
                reprocessMaterialTypeId: typeId,
                reprocessMaterialTypeName: type.name,
                reprocessMaterialId: null,
                reprocessMaterial: null,
                reprocessDensity: type.density || null,
                reprocessPricePerKg: 0
            }
        }));
    };

    const handleReprocessMaterialSelect = (materialId) => {
        setIsSaved(false);
        if (!materialId) {
            setCore(prev => ({
                ...prev,
                insulation: {
                    ...prev.insulation,
                    reprocessMaterialId: null,
                    reprocessMaterial: null,
                    reprocessPricePerKg: 0
                }
            }));
            return;
        }
        const material = insulationRawMaterials.find(m => m._id === materialId);
        if (!material) return;
        setCore(prev => ({
            ...prev,
            insulation: {
                ...prev.insulation,
                reprocessMaterialId: material._id,
                reprocessMaterial: {
                    _id: material._id,
                    name: material.name,
                    category: material.category,
                    specifications: material.specifications
                },
                reprocessPricePerKg: material?.reprocessInventory?.pricePerKg || 0
            }
        }));
    };

    // Calculations - use core length if set, otherwise cable length
    const effectiveCoreLength = core.coreLength ?? cableLength;
    const wireDimensions = calculateWireDimensions(core.totalCoreArea, core.wireCount);
    const drawingLength = calculateDrawingLength(core.wireCount, effectiveCoreLength);
    const materialWeight = calculateMaterialWeight(
        core.totalCoreArea, effectiveCoreLength, core.materialDensity, core.wastagePercent
    );
    const rodPrice = core.selectedRod?.inventory?.avgPricePerKg
        || core.selectedRod?.inventory?.lastPricePerKg || 0;
    const materialCost = materialWeight * rodPrice;
    const coreDiameter = calculateCoreDiameter(wireDimensions.diameterPerWire, core.wireCount);
    const insulationCalc = calculateInsulation(
        coreDiameter,
        core.insulation.thickness,
        effectiveCoreLength,
        'custom',
        core.insulation.freshPercent,
        core.insulation.reprocessPercent || 0,
        core.insulation.freshPricePerKg || 0,
        core.insulation.reprocessPricePerKg || null,
        core.insulation.density || 1.4,
        core.insulation.reprocessDensity || null,
        core.insulation.wastagePercent || 0
    );

    const filteredRods = core.materialTypeId
        ? metalRawMaterials.filter(m => {
            const mtId = typeof m.materialTypeId === 'object' ? m.materialTypeId?._id : m.materialTypeId;
            return mtId === core.materialTypeId;
        })
        : [];

    const filteredInsulationMaterials = core.insulation?.materialTypeId
        ? insulationRawMaterials.filter(m => {
            const mtId = typeof m.materialTypeId === 'object' ? m.materialTypeId?._id : m.materialTypeId;
            return mtId === core.insulation.materialTypeId;
        })
        : [];

    const filteredReprocessMaterials = core.insulation?.reprocessMaterialTypeId
        ? insulationRawMaterials.filter(m => {
            const mtId = typeof m.materialTypeId === 'object' ? m.materialTypeId?._id : m.materialTypeId;
            return mtId === core.insulation.reprocessMaterialTypeId;
        })
        : [];

    const selectedTypeName = metalTypes.find(t => t._id === core.materialTypeId)?.name || null;

    // Calculate process cost for this core
    const processCost = (core.processes || []).reduce((sum, process) => {
        try {
            const scope = {};
            (process.variables || []).forEach(v => {
                scope[v.name] = parseFloat(v.value) || parseFloat(v.defaultValue) || 0;
            });
            if (!process.formula?.trim()) return sum;
            const fn = new Function(...Object.keys(scope), `return (${process.formula})`);
            const result = fn(...Object.values(scope));
            return sum + (typeof result === 'number' && isFinite(result) ? result : 0);
        } catch {
            return sum;
        }
    }, 0);

    return (
        <div id={`core-${core.id}`} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm mb-4">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-3 bg-linear-to-r from-slate-700 to-slate-800">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white tracking-wide">Core {index + 1}</h3>
                        <div className="font-mono text-xs text-slate-300 mt-0.5">
                            {core.totalCoreArea.toFixed(1)}-{core.wireCount}/{wireDimensions.diameterPerWire.toFixed(1)}-{core.insulation.thickness.toFixed(1)}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Cost summary when collapsed */}
                    {isCollapsed && (
                        <div className="flex items-center gap-3 mr-4 text-xs font-medium">
                            <span className="text-orange-300">Metal: {fmtCur(materialCost)}</span>
                            <span className="text-blue-300">Insulation: {fmtCur(insulationCalc.totalCost)}</span>
                            <span className="text-green-300">Process: {fmtCur(processCost)}</span>
                            <span className="text-white font-bold ml-2">Total: {fmtCur(materialCost + insulationCalc.totalCost + processCost)}</span>
                        </div>
                    )}
                    {/* Save button */}
                    {quotationId && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isSaved}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isSaved
                                ? 'bg-green-500 text-white cursor-default'
                                : isSaving
                                    ? 'bg-slate-500 text-slate-300 cursor-wait'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                            title={isSaved ? 'Core saved' : 'Save core to quotation'}
                        >
                            {isSaving ? 'Saving...' : isSaved ? '✓ Saved' : 'Save Core'}
                        </button>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
                        title={isCollapsed ? "Expand core" : "Minimize core"}
                    >
                        {isCollapsed ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button
                        onClick={() => onDuplicate && onDuplicate(core.id)}
                        className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-blue-600 transition-colors"
                        title="Duplicate core"
                    >
                        <Copy size={16} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-600 transition-colors"
                        title="Remove core"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Core content - hidden when collapsed */}
            {!isCollapsed && (
                <div className="p-5 space-y-5 border-l-2">

                    {/* ── Core Length Configuration ── */}
                    <div className="bg-linear-to-r from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="text-indigo-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="21" y1="10" x2="3" y2="10" />
                                        <line x1="21" y1="6" x2="3" y2="6" />
                                        <line x1="21" y1="14" x2="3" y2="14" />
                                        <line x1="21" y1="18" x2="3" y2="18" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-indigo-900">Core Length</span>
                                    <p className="text-xs text-indigo-600 mt-0.5">
                                        {core.coreLength === null || core.coreLength === undefined
                                            ? `Using cable length (${cableLength}m)`
                                            : 'Custom length for this core'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {core.coreLength !== null && core.coreLength !== undefined ? (
                                    <>
                                        <InputField
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={core.coreLength}
                                            onChange={e => handleCoreUpdate('coreLength', parseFloat(e.target.value) || 0)}
                                            className="w-24 text-right font-bold text-indigo-900"
                                        />
                                        <span className="text-sm font-semibold text-indigo-700">meters</span>
                                        <button
                                            onClick={() => handleCoreUpdate('coreLength', null)}
                                            className="ml-2 px-3 py-1.5 text-xs bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 font-medium transition-colors"
                                        >
                                            Use Cable Length
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-lg font-bold text-indigo-900">{cableLength} meters</span>
                                        <button
                                            onClick={() => handleCoreUpdate('coreLength', cableLength)}
                                            className="ml-2 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                                        >
                                            Set Custom Length
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Section 1: Conductor Configuration ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Zap size={15} className="text-blue-600" />
                            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Conductor</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Metal Type */}
                            <div className="md:col-span-2">
                                <FieldLabel>Metal Material Type</FieldLabel>
                                <SelectField
                                    value={core.materialTypeId || ''}
                                    onChange={e => handleMaterialTypeSelect(e.target.value)}
                                >
                                    <option value="">— Select Metal Type —</option>
                                    {metalTypes.map(type => (
                                        <option key={type._id} value={type._id}>
                                            {type.name} (ρ = {type.density} g/cm³)
                                        </option>
                                    ))}
                                </SelectField>
                                {metalTypes.length === 0 && (
                                    <p className="text-xs text-orange-500 mt-1">No metal types found. Add them in Raw Materials.</p>
                                )}
                            </div>

                            {/* Core Area */}
                            <div>
                                <FieldLabel>Core Area (mm²)</FieldLabel>
                                <InputField
                                    type="number" step="0.1"
                                    value={core.totalCoreArea}
                                    onChange={e => handleCoreUpdate('totalCoreArea', parseFloat(e.target.value))}
                                />
                            </div>

                            {/* Wire Count */}
                            <div>
                                <FieldLabel>No. of Wires</FieldLabel>
                                <InputField
                                    type="number"
                                    value={core.wireCount}
                                    onChange={e => handleCoreUpdate('wireCount', parseInt(e.target.value))}
                                />
                            </div>

                            {/* Wastage */}
                            <div>
                                <FieldLabel>Wastage (%)</FieldLabel>
                                <InputField
                                    type="number"
                                    value={core.wastagePercent}
                                    onChange={e => handleCoreUpdate('wastagePercent', parseFloat(e.target.value))}
                                />
                            </div>

                            {/* Annealing */}
                            <div className="flex items-end pb-0.5">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={core.hasAnnealing || false}
                                        onChange={e => handleCoreUpdate('hasAnnealing', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-300"
                                    />
                                    <span className="text-sm text-gray-600 font-medium">Annealing</span>
                                </label>
                            </div>
                        </div>

                        {/* Calculated wire dimensions */}
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            <StatBox label="Area / Wire" value={`${wireDimensions.areaPerWire} mm²`} />
                            <StatBox label="Dia / Wire" value={`${wireDimensions.diameterPerWire} mm`} />
                            <StatBox label="Core Diameter" value={`${fmtN(coreDiameter)} mm`} accent />
                        </div>
                    </div>

                    {/* ── Section 2: Rod / Raw Material ── */}
                    <div className="border border-amber-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50">
                            <div className="flex items-center gap-2">
                                <Package size={14} className="text-amber-600" />
                                <span className="text-sm font-bold text-gray-700">
                                    Rod Selection
                                    {selectedTypeName && (
                                        <span className="ml-1.5 text-xs font-normal text-amber-600">— {selectedTypeName}</span>
                                    )}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowRodSelection(!showRodSelection)}
                                disabled={!core.materialTypeId}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {showRodSelection ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {showRodSelection ? 'Hide' : 'Select Rod'}
                            </button>
                        </div>

                        <div className="px-4 py-3 bg-white">
                            {/* Status messages */}
                            {!core.materialTypeId && (
                                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                                    <AlertTriangle size={13} />
                                    Select a metal material type first to pick a rod.
                                </div>
                            )}

                            {core.selectedRod ? (
                                <div className="flex items-start justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle size={13} className="text-blue-600" />
                                            <span className="text-sm font-semibold text-blue-800">{core.selectedRod.name}</span>
                                        </div>
                                        {core.selectedRod.specifications?.dimensions && (
                                            <p className="text-xs text-blue-500 mt-0.5 ml-5">{core.selectedRod.specifications.dimensions}</p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <p className="text-xs font-bold text-blue-700">₹{(core.selectedRod.inventory?.avgPricePerKg || 0).toFixed(2)}/kg</p>
                                        {core.selectedRod.inventory?.lastPricePerKg > 0 && (
                                            <p className="text-xs text-gray-400">Last: ₹{core.selectedRod.inventory.lastPricePerKg}/kg</p>
                                        )}
                                    </div>
                                </div>
                            ) : core.materialTypeId ? (
                                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                                    <AlertTriangle size={13} />
                                    No rod selected — material cost will be ₹0.
                                </div>
                            ) : null}

                            {/* Rod grid */}
                            {showRodSelection && (
                                filteredRods.length === 0 ? (
                                    <div className="text-sm text-gray-400 italic text-center py-3 bg-gray-50 rounded-lg mb-3">
                                        No raw materials found for this type. Add them in Raw Materials → Inventory.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {filteredRods.map(rod => (
                                            <button
                                                key={rod._id}
                                                onClick={() => handleRodSelect(rod)}
                                                className={`p-2.5 border-2 rounded-lg text-left text-sm transition-colors ${core.selectedRod?._id === rod._id
                                                    ? 'bg-blue-50 border-blue-500'
                                                    : 'bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                                                    }`}
                                            >
                                                <div className="font-semibold text-gray-800">{rod.name}</div>
                                                {rod.specifications?.dimensions && (
                                                    <div className="text-xs text-gray-500 mt-0.5">{rod.specifications.dimensions}</div>
                                                )}
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <span className="text-xs font-bold text-blue-700">
                                                        ₹{(rod.inventory?.avgPricePerKg || 0).toFixed(2)}/kg
                                                    </span>
                                                    {rod.inventory?.totalWeight > 0 && (
                                                        <span className="text-xs text-emerald-600 font-medium">
                                                            {rod.inventory.totalWeight.toFixed(1)} kg
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Conductor metrics */}
                            <div className="grid grid-cols-3 gap-2">
                                <StatBox label="Drawing Length" value={`${fmtN(drawingLength, 1)} m`} />
                                <StatBox label="Material Weight" value={`${fmtN(materialWeight)} kg`} />
                                <StatBox label="Material Cost" value={fmtCur(materialCost)} accent />
                            </div>
                        </div>
                    </div>

                    {/* ── Section 3: Insulation ── */}
                    <div className="border border-teal-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-teal-50">
                            <div className="flex items-center gap-2">
                                <Layers size={14} className="text-teal-600" />
                                <span className="text-sm font-bold text-gray-700">Insulation</span>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={core.hasInsulation || false}
                                    onChange={e => handleInsulationToggle(e.target.checked)}
                                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                />
                                <span className="text-xs font-medium text-gray-600">Add Insulation</span>
                            </label>
                        </div>

                        {core.hasInsulation && (
                            <div className="px-4 pt-3 pb-4 bg-white space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {/* Fresh Type */}
                                    <div className="md:col-span-2">
                                        <FieldLabel>Fresh Material Type</FieldLabel>
                                        <SelectField
                                            value={core.insulation.materialTypeId || ''}
                                            onChange={e => handleInsulationTypeSelect(e.target.value)}
                                        >
                                            <option value="">— Select Fresh Insulation —</option>
                                            {insulationTypes.map(type => (
                                                <option key={type._id} value={type._id}>
                                                    {type.name} (ρ = {type.density} g/cm³)
                                                </option>
                                            ))}
                                        </SelectField>
                                        {insulationTypes.length === 0 && (
                                            <p className="text-xs text-orange-500 mt-1">No insulation types found.</p>
                                        )}
                                    </div>

                                    {/* Fresh Raw Material */}
                                    <div className="md:col-span-2">
                                        <FieldLabel>Fresh Raw Material</FieldLabel>
                                        <SelectField
                                            value={core.insulation.materialId || ''}
                                            onChange={e => handleInsulationMaterialSelect(e.target.value)}
                                            disabled={!core.insulation.materialTypeId}
                                        >
                                            <option value="">— Select Raw Material —</option>
                                            {filteredInsulationMaterials.map(mat => (
                                                <option key={mat._id} value={mat._id}>
                                                    {mat.name} | Code: {mat.materialCode} | Stock: {mat.inventory?.totalWeight?.toFixed(1) || 0} kg | ₹{mat.inventory?.avgPricePerKg?.toFixed(2) || 0}/kg
                                                </option>
                                            ))}
                                        </SelectField>
                                        {!core.insulation.materialTypeId && (
                                            <p className="text-xs text-gray-400 mt-1">Select material type first</p>
                                        )}
                                        {core.insulation.materialTypeId && filteredInsulationMaterials.length === 0 && (
                                            <p className="text-xs text-orange-500 mt-1">No raw materials found for this type</p>
                                        )}
                                    </div>

                                    {/* Fresh Price */}
                                    <div>
                                        <FieldLabel>
                                            Fresh Price/kg (₹)
                                            {core.insulation.freshPricePerKg > 0 && (
                                                <span className="ml-1 text-emerald-500 normal-case font-normal">(stock avg)</span>
                                            )}
                                        </FieldLabel>
                                        <InputField
                                            type="number" step="0.01"
                                            value={core.insulation.freshPricePerKg || ''}
                                            onChange={e => handleInsulationUpdate('freshPricePerKg', parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
                                            disabled={!core.insulation.materialId}
                                        />
                                    </div>

                                    {/* Fresh % - Auto-adjusts Reprocess % */}
                                    <div className="md:col-span-2">
                                        <FieldLabel>
                                            Fresh / Reprocess Mix
                                            <span className="ml-2 text-emerald-600 font-normal">{core.insulation.freshPercent}% fresh</span>
                                            <span className="mx-1 text-gray-400">/</span>
                                            <span className="text-purple-600 font-normal">{core.insulation.reprocessPercent}% reprocess</span>
                                        </FieldLabel>
                                        <div className="space-y-2">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={core.insulation.freshPercent}
                                                onChange={e => handleInsulationUpdate('freshPercent', parseFloat(e.target.value))}
                                                className="w-full h-2 bg-gradient-to-r from-emerald-200 via-emerald-300 to-purple-300 rounded-lg appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${core.insulation.freshPercent}%, #a855f7 ${core.insulation.freshPercent}%, #a855f7 100%)`
                                                }}
                                            />
                                            <div className="flex justify-between text-xs">
                                                <span className="text-emerald-600 font-medium">100% Fresh</span>
                                                <span className="text-gray-500">50/50</span>
                                                <span className="text-purple-600 font-medium">100% Reprocess</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reprocess Type */}
                                    <div className="md:col-span-2">
                                        <FieldLabel>
                                            Reprocess Type
                                            <span className="ml-1 text-gray-400 normal-case font-normal">(optional — can differ)</span>
                                        </FieldLabel>
                                        <SelectField
                                            value={core.insulation.reprocessMaterialTypeId || ''}
                                            onChange={e => handleReprocessTypeSelect(e.target.value)}
                                            className="border-purple-200 focus:ring-purple-300 focus:border-purple-400"
                                        >
                                            <option value="">— Same as fresh / select reprocess type —</option>
                                            {insulationTypes.map(type => (
                                                <option key={type._id} value={type._id}>
                                                    {type.name} (ρ = {type.density} g/cm³)
                                                </option>
                                            ))}
                                        </SelectField>
                                        {core.insulation.reprocessMaterialTypeId && (
                                            <p className="text-xs text-purple-600 mt-1">
                                                Reprocess stock: <strong>{core.insulation.reprocessMaterialTypeName}</strong>
                                            </p>
                                        )}
                                    </div>

                                    {/* Reprocess Raw Material */}
                                    <div className="md:col-span-2">
                                        <FieldLabel>
                                            Reprocess Raw Material
                                            <span className="ml-1 text-gray-400 normal-case font-normal">(optional)</span>
                                        </FieldLabel>
                                        <SelectField
                                            value={core.insulation.reprocessMaterialId || ''}
                                            onChange={e => handleReprocessMaterialSelect(e.target.value)}
                                            disabled={!core.insulation.reprocessMaterialTypeId}
                                            className="border-purple-200 focus:ring-purple-300 focus:border-purple-400"
                                        >
                                            <option value="">— Select Reprocess Raw Material —</option>
                                            {filteredReprocessMaterials.map(mat => (
                                                <option key={mat._id} value={mat._id}>
                                                    {mat.name} | Code: {mat.materialCode} | Reprocess: {mat.reprocessInventory?.totalWeight?.toFixed(1) || 0} kg | ₹{mat.reprocessInventory?.pricePerKg?.toFixed(2) || 0}/kg
                                                </option>
                                            ))}
                                        </SelectField>
                                        {!core.insulation.reprocessMaterialTypeId && (
                                            <p className="text-xs text-gray-400 mt-1">Select reprocess type first</p>
                                        )}
                                        {core.insulation.reprocessMaterialTypeId && filteredReprocessMaterials.length === 0 && (
                                            <p className="text-xs text-orange-500 mt-1">No reprocess materials found for this type</p>
                                        )}
                                    </div>

                                    {/* Reprocess Price */}
                                    <div>
                                        <FieldLabel>
                                            Reprocess Price/kg (₹)
                                            {core.insulation.reprocessPricePerKg > 0 && (
                                                <span className="ml-1 text-purple-500 normal-case font-normal">(stock)</span>
                                            )}
                                        </FieldLabel>
                                        <InputField
                                            type="number" step="0.01"
                                            value={core.insulation.reprocessPricePerKg || ''}
                                            onChange={e => handleInsulationUpdate('reprocessPricePerKg', parseFloat(e.target.value) || 0)}
                                            placeholder="auto (70% fresh)"
                                            className="border-purple-200"
                                            disabled={!core.insulation.reprocessMaterialId}
                                        />
                                    </div>

                                    {/* Thickness */}
                                    <div>
                                        <FieldLabel>Thickness (mm)</FieldLabel>
                                        <InputField
                                            type="number" step="0.1"
                                            value={core.insulation.thickness}
                                            onChange={e => handleInsulationUpdate('thickness', parseFloat(e.target.value))}
                                        />
                                    </div>

                                    {/* Wastage % */}
                                    <div>
                                        <FieldLabel>Wastage (%)</FieldLabel>
                                        <InputField
                                            type="number" step="0.1" min="0" max="100"
                                            value={core.insulation.wastagePercent || 0}
                                            onChange={e => handleInsulationUpdate('wastagePercent', parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Insulation results */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                                    <StatBox label="Insulated Dia" value={`${insulationCalc.insulatedDiameter} mm`} accent />
                                    <StatBox label="Fresh Weight" value={`${insulationCalc.freshWeight} kg`} />
                                    <StatBox label="Reprocess Weight" value={`${insulationCalc.reprocessWeight} kg`} />
                                    <StatBox label="Fresh Cost" value={fmtCur(insulationCalc.freshCost)} />
                                    <StatBox label="Reprocess Cost" value={fmtCur(insulationCalc.reprocessCost)} />
                                    <StatBox label="Insulation Total" value={fmtCur(insulationCalc.totalCost)} accent />
                                </div>

                                <div className="flex gap-2 pt-1 border-t border-gray-100">
                                    <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                        <p className="text-xs text-gray-400">Core Area</p>
                                        <p className="text-sm font-bold text-gray-700">{fmtN(core.totalCoreArea, 2)} mm²</p>
                                    </div>
                                    <div className="flex-1 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                                        <p className="text-xs text-teal-500">Outer Area</p>
                                        <p className="text-sm font-bold text-teal-700">
                                            {calculateOuterArea(insulationCalc.insulatedDiameter).toFixed(2)} mm²
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!core.hasInsulation && (
                            <div className="px-4 py-8 bg-white text-center">
                                <p className="text-sm text-gray-400">Check "Add Insulation" above to configure insulation for this core</p>
                            </div>
                        )}
                    </div>

                    {/* Process Selector for this Core */}
                    {!loading && (
                        <div className="mt-4">
                            <ProcessSelector
                                processes={core.processes || []}
                                onAdd={addProcess}
                                onRemove={removeProcess}
                                onUpdateVariable={updateProcessVariable}
                                processMasterList={processMasterList}
                                quoteContext={quoteContext}
                                title={`Core ${index + 1} Processes`}
                                compact={true}
                            />
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default CoreComponent;
