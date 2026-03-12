import React, { useState, useEffect } from 'react';
import { Trash2, Zap, Package, Layers, ChevronDown, ChevronUp, AlertTriangle, Copy, Minimize2, Maximize2 } from 'lucide-react';
import {
    calculateMaterialWeight,
    calculateOuterArea
} from '../../../utils/cableCalculations';
// import ProcessSelector from '../processes/ProcessSelector'; // Replaced with ProcessEntryEditor
import ProcessEntryEditor from '../process/ProcessEntryEditor';
import ProcessEntryList from '../process/ProcessEntryList';
import SelectedRawMaterialCard from './SelectedRawMaterialCard.jsx';
import RawMaterialSelector from './RawMaterialSelector.jsx';
import InsulationSelector from '../insulation/InsulationSelector.jsx';
import api from '../../../api/axiosInstance';
import MaterialCostDisplay from './MaterialCostDisplay.jsx';
import useMaterialRequirementsStore from '../../../store/materialRequirementsStore.js';
import useQuotationProcessStore from '../../../store/quotationProcessStore.js';

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

const CoreComponent = ({
    core: providedCore,
    index,
    cableLength,
    quotationId,
    onDeleteFromParent,
    onDuplicate
}) => {

    // Local core state - use backend response directly
    const [core, setCore] = useState(providedCore || {
        name: '',
        coreNumber: index + 1,
        conductor: {
            materialTypeId: null,
            materialTypeName: '',
            materialId: null,
            selectedRod: null,
            totalCoreArea: 8,
            wireCount: 16,
            wireDiameter: 0,
            conductorDiameter: 0,
            drawingLength: 0,
            materialWeight: 0,
            wastagePercent: 5,
            hasAnnealing: false
        },
        insulation: {
            freshMaterialTypeId: null,
            freshMaterialId: null,
            reprocessMaterialTypeId: null,
            reprocessMaterialId: null,
            thickness: 0,
            freshDensity: 1.4,
            freshPercent: 100,
            freshWeight: 0,
            reprocessDensity: 1.4,
            reprocessPercent: 0,
            reprocessWeight: 0,
            wastagePercent: 0
        },
        coreLength: null,
        materialRequired: [],
        processes: [],
        costs: {
            totalMaterialCost: 0,
            totalProcessCost: 0,
            grandTotal: 0
        }
    });

    // UI state
    const [showRodSelection, setShowRodSelection] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(!!providedCore?._id);

    // Material data
    const [metalTypes, setMetalTypes] = useState([]);
    // const [processMasterList, setProcessMasterList] = useState([]); // Removed - now fetched in ProcessEntryEditor
    const [loading, setLoading] = useState(true);

    // Process entries state
    const [processEntries, setProcessEntries] = useState([]);
    const [showProcessEditor, setShowProcessEditor] = useState(false);
    const [loadingProcesses, setLoadingProcesses] = useState(false);

    const { calculateAll } = useMaterialRequirementsStore();
    const { calculateAllProcessInQuotation } = useQuotationProcessStore();


    // Fetch materials on mount
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const typesRes = await api.get('/material-type/get-all-material-types');

                const allTypes = typesRes.data || [];
                setMetalTypes(allTypes.filter(t => t.category === 'metal'));
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
        if (providedCore) {
            setCore(providedCore);
            setIsSaved(!!providedCore._id);
        }
    }, [providedCore]);


    // Update conductor fields
    const handleCoreUpdate = (field, value) => {
        setIsSaved(false);
        setCore(prev => ({
            ...prev,
            conductor: {
                ...prev.conductor,
                [field]: value
            }
        }));
    };

    // Toggle insulation on/off
    const handleInsulationToggle = (enabled) => {
        setIsSaved(false);
        if (!enabled) {
            // Clear insulation when disabling
            setCore(prev => ({
                ...prev,
                insulation: undefined
            }));
        } else {
            // Initialize insulation with defaults when enabling
            setCore(prev => ({
                ...prev,
                insulation: {
                    freshMaterialTypeId: null,
                    freshMaterialId: null,
                    freshDensity: 1.4,
                    freshPercent: 100,
                    freshWeight: 0,
                    reprocessMaterialTypeId: null,
                    reprocessMaterialId: null,
                    reprocessDensity: 0,
                    reprocessPercent: 0,
                    reprocessWeight: 0,
                    thickness: 1,
                    wastagePercent: 5
                }
            }));
        }
    };


    // Recalculate dimensions whenever relevant fields change
    useEffect(() => {
        const effectiveLength = core.coreLength ?? cableLength;
        if (!effectiveLength || effectiveLength <= 0) return;

        // ═══════════════════════════════════════════════════════
        // CONDUCTOR CALCULATIONS
        // ═══════════════════════════════════════════════════════
        if (core.conductor?.totalCoreArea && core.conductor?.wireCount) {
            const totalCoreArea = core.conductor.totalCoreArea;
            const wireCount = core.conductor.wireCount;
            const density = core.conductor.materialDensity || 8.96;
            const wastagePercent = core.conductor.wastagePercent || 0;

            // Calculate wire dimensions
            const areaPerWire = totalCoreArea / wireCount;
            const wireDiameter = 2 * Math.sqrt(areaPerWire / Math.PI);

            // Calculate conductor diameter (stranded wire packing)
            const calculateCoreDiam = (wireDia, wCount) => {
                if (wCount === 1) return wireDia;
                return Math.sqrt(wCount) * wireDia / 2;
            };
            const conductorDiameter = calculateCoreDiam(wireDiameter, wireCount);

            // Calculate drawing length
            const drawingLength = effectiveLength * wireCount;

            // Calculate material weight with wastage
            const materialWeight = calculateMaterialWeight(totalCoreArea, effectiveCoreLength, density, wastagePercent);

            // Update conductor calculated fields
            setCore(prev => ({
                ...prev,
                conductor: {
                    ...prev.conductor,
                    wireDiameter: parseFloat(wireDiameter.toFixed(4)),
                    conductorDiameter: parseFloat(conductorDiameter.toFixed(4)),
                    drawingLength: parseFloat(drawingLength.toFixed(2)),
                    materialWeight: parseFloat(materialWeight.toFixed(4))
                }
            }));
        }

        // ═══════════════════════════════════════════════════════
        // INSULATION CALCULATIONS
        // ═══════════════════════════════════════════════════════
        if (core.conductor?.conductorDiameter > 0 && core.insulation?.freshMaterialId) {
            const conductorDiameter = core.conductor.conductorDiameter;
            const thickness = core.insulation.thickness || 0;
            const freshPercent = core.insulation.freshPercent || 0;
            const reprocessPercent = core.insulation.reprocessPercent || 0;
            const wastagePercent = core.insulation.wastagePercent || 0;
            const freshDensity = core.insulation.freshDensity || 1.4;
            const reprocessDensity = core.insulation.reprocessDensity || freshDensity;

            // Calculate insulated diameter (for volume calculation only, not stored)
            const insulatedDiameter = conductorDiameter + (2 * thickness);

            // Calculate insulation volume
            const outerRadius = insulatedDiameter / 2;
            const innerRadius = conductorDiameter / 2;
            const volumeMm3 = Math.PI * (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2)) * effectiveLength * 1000;
            const volumeCm3 = volumeMm3 / 1000;

            // Calculate fresh insulation weight with wastage
            const freshWeight = (volumeCm3 * (freshPercent / 100) * freshDensity * (1 + wastagePercent / 100)) / 1000;

            // Calculate reprocess insulation weight with wastage
            const reprocessWeight = (volumeCm3 * (reprocessPercent / 100) * reprocessDensity * (1 + wastagePercent / 100)) / 1000;

            // Update insulation calculated weights (freshWeight and reprocessWeight stored separately)
            setCore(prev => ({
                ...prev,
                insulation: {
                    ...prev.insulation,
                    freshWeight: parseFloat(freshWeight.toFixed(4)),
                    reprocessWeight: parseFloat(reprocessWeight.toFixed(4))
                }
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        core.conductor?.totalCoreArea,
        core.conductor?.wireCount,
        core.conductor?.wastagePercent,
        core.conductor?.materialDensity,
        core.conductor?.conductorDiameter,
        core.insulation?.thickness,
        core.insulation?.freshDensity,
        core.insulation?.reprocessDensity,
        core.insulation?.freshPercent,
        core.insulation?.reprocessPercent,
        core.insulation?.wastagePercent,
        core.insulation?.freshMaterialId,
        core.coreLength,
        cableLength,
        core.conductor?.materialId,
        core.conductor?.materialTypeId
    ]);

    // Build material requirements array with pricing
    const buildMaterialRequirements = async (coreData) => {
        const materialRequired = [];

        // ═══════════════════════════════════════════════════════
        // CONDUCTOR MATERIAL
        // ═══════════════════════════════════════════════════════
        if (coreData.conductor?.materialWeight > 0 && coreData.conductor?.materialId) {
            materialRequired.push({
                materialId: coreData.conductor.materialId,
                materialName: coreData.conductor.selectedRod?.name || coreData.conductor.materialTypeName || 'Metal',
                category: 'metal',
                purpose: 'conductor-' + (coreData.conductor.materialTypeName || 'metal').toLowerCase(),
                weight: coreData.conductor.materialWeight,
                type: 'fresh',
                pricePerKg: 0,
                totalCost: 0
            });
        }

        // ═══════════════════════════════════════════════════════
        // INSULATION MATERIALS (use already calculated weights)
        // ═══════════════════════════════════════════════════════
        // Add fresh insulation material
        if (coreData.insulation?.freshWeight > 0 && coreData.insulation?.freshMaterialId) {
            materialRequired.push({
                materialId: coreData.insulation.freshMaterialId,
                materialName: 'Insulation Fresh', // Will be updated with actual name from pricing fetch
                category: 'insulation',
                purpose: 'insulation-fresh',
                weight: coreData.insulation.freshWeight,
                type: 'fresh',
                pricePerKg: 0,
                totalCost: 0
            });
        }

        // Add reprocess insulation material
        if (coreData.insulation?.reprocessWeight > 0 && coreData.insulation?.reprocessMaterialId) {
            materialRequired.push({
                materialId: coreData.insulation.reprocessMaterialId,
                materialName: 'Insulation Reprocess', // Will be updated with actual name from pricing fetch
                category: 'insulation',
                purpose: 'insulation-reprocess',
                weight: coreData.insulation.reprocessWeight,
                type: 'reprocess',
                pricePerKg: 0,
                totalCost: 0
            });
        }

        // ═══════════════════════════════════════════════════════
        // FETCH MATERIAL PRICES
        // ═══════════════════════════════════════════════════════
        if (materialRequired.length > 0) {
            try {
                const materialIds = materialRequired.map(m => m.materialId);
                const materialsRes = await api.post('/raw-material/get-by-ids', { materialIds });
                const pricingMap = {};

                materialsRes.data.forEach(mat => {
                    pricingMap[mat._id] = {
                        avgPricePerKg: mat.inventory?.avgPricePerKg || 0,
                        reprocessPricePerKg: mat.reprocessInventory?.pricePerKg || 0,
                        materialName: mat.name
                    };
                });

                // Update material requirements with pricing
                materialRequired.forEach(req => {
                    const pricing = pricingMap[req.materialId];
                    if (pricing) {
                        const pricePerKg = req.type === 'reprocess'
                            ? pricing.reprocessPricePerKg
                            : pricing.avgPricePerKg;
                        req.pricePerKg = pricePerKg;
                        req.totalCost = parseFloat((req.weight * pricePerKg).toFixed(2));
                        req.materialName = pricing.materialName
                    }
                });
            } catch (error) {
                console.error('Failed to fetch material pricing:', error);
            }
        }

        return materialRequired;
    };

    // Save core to backend
    const handleSave = async () => {
        if (!quotationId) {
            alert('No quotation ID found. Please refresh the page.');
            return;
        }

        setIsSaving(true);
        try {
            // Build material requirements with pricing
            const materialRequired = await buildMaterialRequirements(core);

            // Prepare core data with material requirements and costs
            const coreData = {
                ...core,
                coreNumber: index + 1,
                coreLength: core.coreLength ?? cableLength,
                materialRequired,
                costs: {
                    totalMaterialCost: parseFloat(materialRequired.reduce((sum, req) => sum + (req.totalCost || 0), 0).toFixed(2)),
                    totalProcessCost: 0,
                    grandTotal: parseFloat(materialRequired.reduce((sum, req) => sum + (req.totalCost || 0), 0).toFixed(2))
                },
                coreOuterAreaWithInsulation: calculateOuterArea(core.conductor.conductorDiameter + (core.insulation?.thickness || 0) + (core.insulation?.thickness || 0)).toFixed(2)
            };

            let response;
            if (core._id) {
                // Update existing core
                response = await api.put(`/quotation/${quotationId}/cores/${core._id}`, coreData);
            } else {
                // Create new core
                response = await api.post(`/quotation/${quotationId}/cores`, coreData);
            }

            // Update local state with backend response
            setCore(response.data);
            calculateAll(quotationId);
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

    // Fetch process entries from backend
    const fetchProcessEntries = async () => {
        if (!core._id) return;

        try {
            setLoadingProcesses(true);
            const response = await api.get(`/process-entry/get-by-parent?coreId=${core._id}`);
            setProcessEntries(response.data || []);
        } catch (error) {
            console.error('Error fetching process entries:', error);
        } finally {
            setLoadingProcesses(false);
        }
    };

    // Fetch process entries when core ID changes
    useEffect(() => {
        if (core._id) {
            fetchProcessEntries();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [core._id]);

    // Handle process entry save
    const handleProcessSave = (savedEntry) => {
        setProcessEntries(prev => [...prev, savedEntry]);
        setShowProcessEditor(false);
        calculateAllProcessInQuotation(quotationId)
    };

    // Delete process entry
    const deleteProcessEntry = async (entryId) => {
        if (!window.confirm('Delete this process entry?')) return;

        try {
            await api.delete(`/process-entry/delete-process-entry/${entryId}`);
            setProcessEntries(prev => prev.filter(e => e._id !== entryId));
            calculateAllProcessInQuotation(quotationId)
        } catch (error) {
            console.error('Error deleting process entry:', error);
            alert('Failed to delete process entry');
        }
    };

    // Build context for ProcessEntryEditor
    const buildProcessContext = () => {
        return {
            wireCount: core.conductor?.wireCount || 0,
            wireDiameter: core.conductor?.wireDiameter || 0,
            totalCoreArea: core.conductor?.totalCoreArea || 0,
            conductorDiameter: core.conductor?.conductorDiameter || 0,
            drawingLength: core.conductor?.drawingLength || 0,
            materialWeight: core.conductor?.materialWeight || 0,
            thickness: core.insulation?.thickness || 0,
            freshWeight: core.insulation?.freshWeight || 0,
            reprocessWeight: core.insulation?.reprocessWeight || 0,
            insulatedDiameter: core.insulation?.insulatedDiameter || 0,
            coreLength: core.coreLength || cableLength || 0
        };
    };


    const handleMaterialTypeSelect = (typeId) => {
        setIsSaved(false);
        if (!typeId) {
            setCore(prev => ({
                ...prev,
                conductor: {
                    ...prev.conductor,
                    materialTypeId: null,
                    materialTypeName: ''
                }
            }));
            return;
        }
        const type = metalTypes.find(t => t._id === typeId);
        if (!type) return;
        setCore(prev => ({
            ...prev,
            conductor: {
                ...prev.conductor,
                materialTypeId: typeId,
                materialTypeName: type.name,
                materialDensity: type.density,
                materialId: null,
                materialName: null,
                selectedRod: null
            }
        }));
    };

    const handleRodSelect = (rod) => {
        setIsSaved(false);
        setCore(prev => ({
            ...prev,
            conductor: {
                ...prev.conductor,
                materialId: rod._id,
                selectedRod: {
                    _id: rod._id
                }
            }
        }));
        setShowRodSelection(false);
    };


    // Calculations - use core length if set, otherwise cable length
    const effectiveCoreLength = core.coreLength ?? cableLength;

    const selectedTypeName = metalTypes.find(t => t._id === core.conductor?.materialTypeId)?.name || null;

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

    // Removed coreContext and _quoteContext - now using buildProcessContext() instead


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
                            {core.conductor?.totalCoreArea?.toFixed(1) || '0.0'}-{core.conductor?.wireCount || 1}/{core.conductor?.wireDiameter?.toFixed(1) || '0.0'}{core.insulation?.thickness ? `-${core.insulation.thickness.toFixed(1)}` : ''}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Cost summary when collapsed */}
                    {isCollapsed && (
                        <div className="flex items-center gap-3 mr-4 text-xs font-medium">
                            {
                                core?.materialRequired?.length > 0 &&
                                <span className="text-orange-300">Metal: {fmtCur(core.materialRequired[0].totalCost)}</span>
                            }

                            {
                                core?.materialRequired?.length > 1 &&
                                <span className="text-blue-300">Insulation: {fmtCur(core.materialRequired[1]?.totalCost)}</span>
                            }
                            <span className="text-green-300">Process: {fmtCur(processCost)}</span>
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
                        onClick={() => onDuplicate && onDuplicate(core)}
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
                                    // Custom length mode - show input field
                                    <>
                                        <InputField
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={core.coreLength}
                                            onChange={e => {
                                                setIsSaved(false);
                                                setCore(prev => ({ ...prev, coreLength: parseFloat(e.target.value) || 0 }));
                                            }}
                                            className="w-24 text-right font-bold text-indigo-900"
                                        />
                                        <span className="text-sm font-semibold text-indigo-700">meters</span>
                                        <span className="text-xs text-gray-400">(custom)</span>
                                        <button
                                            onClick={() => {
                                                setIsSaved(false);
                                                setCore(prev => ({ ...prev, coreLength: null }));
                                            }}
                                            className="ml-2 px-3 py-1.5 text-xs bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 font-medium transition-colors"
                                        >
                                            Use Cable Length
                                        </button>
                                    </>
                                ) : (
                                    // Using cable length - show static value
                                    <>
                                        <span className="text-lg font-bold text-indigo-900">{cableLength} meters</span>
                                        <span className="text-xs text-gray-400">(from cable)</span>
                                        <button
                                            onClick={() => {
                                                setIsSaved(false);
                                                setCore(prev => ({ ...prev, coreLength: cableLength }));
                                            }}
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
                                    value={core.conductor?.materialTypeId || ''}
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
                                    value={core.conductor?.totalCoreArea}
                                    onChange={e => handleCoreUpdate('totalCoreArea', parseFloat(e.target.value))}
                                />
                            </div>

                            {/* Wire Count */}
                            <div>
                                <FieldLabel>No. of Wires</FieldLabel>
                                <InputField
                                    type="number"
                                    value={core.conductor?.wireCount}
                                    onChange={e => handleCoreUpdate('wireCount', parseInt(e.target.value))}
                                />
                            </div>

                            {/* Wastage */}
                            <div>
                                <FieldLabel>Wastage (%)</FieldLabel>
                                <InputField
                                    type="number"
                                    value={core.conductor?.wastagePercent}
                                    onChange={e => handleCoreUpdate('wastagePercent', parseFloat(e.target.value))}
                                />
                            </div>

                            {/* Annealing */}
                            <div className="flex items-end pb-0.5">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={core.conductor?.hasAnnealing || false}
                                        onChange={e => handleCoreUpdate('hasAnnealing', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-300"
                                    />
                                    <span className="text-sm text-gray-600 font-medium">Annealing</span>
                                </label>
                            </div>
                        </div>

                        {/* Calculated wire dimensions */}
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            <StatBox label="Area / Wire" value={`${fmtN(Math.PI * core.conductor.wireDiameter)} mm²`} />
                            <StatBox label="Dia / Wire" value={`${core.conductor.wireDiameter} mm`} />
                            <StatBox label="Core Diameter" value={`${core.conductor.conductorDiameter} mm`} accent />
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
                                disabled={!core.conductor.materialTypeId}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {showRodSelection ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {showRodSelection ? 'Hide' : 'Select Rod'}
                            </button>
                        </div>

                        <div className="px-4 py-3 bg-white">
                            {/* Status messages */}
                            {!core.conductor.materialTypeId && (
                                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                                    <AlertTriangle size={13} />
                                    Select a metal material type first to pick a rod.
                                </div>
                            )}

                            <SelectedRawMaterialCard materialId={core.conductor?.materialId} />

                            {/* Raw Material Selector */}
                            <RawMaterialSelector
                                materialTypeId={core.conductor?.materialTypeId}
                                selectedMaterialId={core.conductor?.materialId}
                                onSelect={handleRodSelect}
                                show={showRodSelection}
                            />

                            {/* Conductor metrics */}
                            <div className="grid grid-cols-3 gap-2">
                                <StatBox label="Drawing Length" value={`${core.conductor.drawingLength} m`} />
                                <StatBox label="Material Weight" value={`${fmtN(core.conductor.materialWeight)} kg`} />

                                <MaterialCostDisplay
                                    materialId={core.conductor.materialId}
                                    weight={core.conductor.materialWeight}
                                    type="fresh"
                                />
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
                                    checked={!!core.insulation}
                                    onChange={e => handleInsulationToggle(e.target.checked)}
                                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                />
                                <span className="text-xs font-medium text-gray-600">Add Insulation</span>
                            </label>
                        </div>

                        {core.insulation && (
                            <>
                                <InsulationSelector
                                    core={core}
                                    onUpdate={(updatedInsulation) => {
                                        setIsSaved(false);
                                        setCore(prev => ({
                                            ...prev,
                                            insulation: updatedInsulation
                                        }));
                                    }}
                                />

                                {/* Insulation results */}
                                <div className="px-4 pb-4 bg-white">
                                    <div className="grid grid-cols-2 md:grid-cols-2 gap-2 pt-1">
                                        <StatBox label="Fresh Weight" value={`${core.insulation.freshWeight} kg`} />
                                        <StatBox label="Reprocess Weight" value={`${core.insulation.reprocessWeight} kg`} />
                                        <MaterialCostDisplay
                                            materialId={core.insulation?.freshMaterialId}
                                            weight={core.insulation?.freshWeight}
                                            type="fresh"
                                            label="Fresh Cost"
                                        />
                                        <MaterialCostDisplay
                                            materialId={core.insulation?.reprocessMaterialId}
                                            weight={core.insulation?.reprocessWeight}
                                            type="reprocess"
                                            label="Reprocess Cost"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-1 border-t border-gray-100 mt-3">
                                        <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                            <p className="text-xs text-gray-400">Core Area</p>
                                            <p className="text-sm font-bold text-gray-700">{fmtN(core.conductor?.totalCoreArea || 0, 2)} mm²</p>
                                        </div>
                                        <div className="flex-1 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                                            <p className="text-xs text-teal-500">Outer Area</p>
                                            <p className="text-sm font-bold text-teal-700">
                                                {calculateOuterArea(core.conductor.conductorDiameter + (core.insulation?.thickness || 0) + (core.insulation?.thickness || 0)).toFixed(2)} mm²
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {!core.insulation && (
                            <div className="px-4 py-8 bg-white text-center">
                                <p className="text-sm text-gray-400">Check "Add Insulation" above to configure insulation for this core</p>
                            </div>
                        )}
                    </div>

                    {/* Process Entries Section */}
                    {!loading && core._id && (
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-700">Core Processes</h4>
                                <button
                                    onClick={() => setShowProcessEditor(true)}
                                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium transition-colors"
                                >
                                    + Add Process
                                </button>
                            </div>

                            {/* Process Entry Editor */}
                            {showProcessEditor && (
                                <ProcessEntryEditor
                                    parentId={core._id}
                                    parentType="core"
                                    context={buildProcessContext()}
                                    onSave={handleProcessSave}
                                    onCancel={() => setShowProcessEditor(false)}
                                />
                            )}

                            {/* List of Process Entries */}
                            <ProcessEntryList
                                entries={processEntries}
                                loading={loadingProcesses}
                                onDelete={deleteProcessEntry}
                            />
                        </div>
                    )}

                    {/* Show message if core not saved yet */}
                    {!loading && !core._id && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-700">
                                💡 Save the core first to add processes
                            </p>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default CoreComponent;
