import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Layers, CheckCircle, AlertTriangle, Minimize2, Maximize2, Save, Zap } from 'lucide-react';
import ProcessEntryEditor from '../process/ProcessEntryEditor';
import ProcessEntryList from '../process/ProcessEntryList';
import SheathMaterialSelector from './SheathMaterialSelector';
import SheathCoreSelector from './SheathCoreSelector';
import MaterialCostDisplay from '../core/MaterialCostDisplay';
import api from '../../../api/axiosInstance';
import useMaterialRequirementsStore from '../../../store/materialRequirementsStore';
import useQuotationProcessStore from '../../../store/quotationProcessStore';

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

// Default initial sheath structure
const getDefaultSheath = (id) => ({
    id: id || Date.now(),
    name: '',
    sheathNumber: 0,
    coreIds: [],
    sheathIds: [],

    // Fresh material fields
    freshMaterialTypeId: null,
    freshMaterialId: null,

    // Reprocess material fields
    reprocessMaterialTypeId: null,
    reprocessMaterialId: null,

    // Dimensions and material properties
    thickness: 1.0,
    freshSheathDensity: 1.4,
    freshSheathPercent: 100,
    freshSheathWeight: 0,
    reprocessSheathDensity: 1.4,
    reprocessSheathPercent: 0,
    reprocessSheathWeight: 0,
    wastageSheathPercent: 0,

    innerArea: 0,
    innerDiameter: 0,
    outerArea: 0,
    outerDiameter: 0,

    sheathLength: null,
    processes: [],
    materialRequired: [],
    costs: {
        totalMaterialCost: 0,
        totalProcessCost: 0,
        grandTotal: 0
    },
    notes: ''
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

    // Process entries state
    const [showProcessEditor, setShowProcessEditor] = useState(false);
    const [processEntries, setProcessEntries] = useState([]);
    const [loadingProcesses, setLoadingProcesses] = useState(false);

    const { calculateAll } = useMaterialRequirementsStore();
    const { calculateAllProcessInQuotation } = useQuotationProcessStore();

    // Sync with parent sheath changes
    useEffect(() => {
        setSheath(initialSheath);
        setIsSaved(!!initialSheath._id);
    }, [initialSheath]);

    // Calculate inner area from selected cores and sheaths
    useEffect(() => {
        let totalInnerArea = 0;

        // Add areas from selected cores
        (sheath.coreIds || []).forEach(coreId => {
            const core = cores.find(c => (c._id || c.id) === coreId);
            if (core && core.coreOuterAreaWithInsulation) {
                totalInnerArea += core.coreOuterAreaWithInsulation;
            }
        });

        // Add areas from selected nested sheaths
        (sheath.sheathIds || []).forEach(sheathId => {
            const nestedSheath = sheathGroups.find(sg => (sg._id || sg.id) === sheathId);
            if (nestedSheath && nestedSheath.outerArea) {
                totalInnerArea += nestedSheath.outerArea;
            }
        });

        if (totalInnerArea > 0) {
            const innerDiameter = Math.sqrt((totalInnerArea * 4) / Math.PI);
            setSheath(prev => ({
                ...prev,
                innerArea: parseFloat(totalInnerArea.toFixed(4)),
                innerDiameter: parseFloat(innerDiameter.toFixed(4))
            }));
        }
    }, [sheath.coreIds, sheath.sheathIds, cores, sheathGroups]);

    // Calculate material weights based on outer area
    useEffect(() => {
        const effectiveLength = sheath.sheathLength ?? cableLength;
        if (!effectiveLength || effectiveLength <= 0) return;

        // ═══════════════════════════════════════════════════════
        // SHEATH MATERIAL WEIGHT CALCULATIONS
        // ═══════════════════════════════════════════════════════
        if (sheath.outerArea > 0 && sheath.innerArea > 0 && sheath.freshMaterialId) {
            const freshPercent = sheath.freshSheathPercent || 0;
            const reprocessPercent = sheath.reprocessSheathPercent || 0;
            const wastagePercent = sheath.wastageSheathPercent || 0;
            const freshDensity = sheath.freshSheathDensity || 1.4;
            const reprocessDensity = sheath.reprocessSheathDensity || freshDensity;

            // Calculate sheath volume (outer area - inner area) × length
            const volumeMm3 = (sheath.outerArea - sheath.innerArea) * effectiveLength * 1000;
            const volumeCm3 = volumeMm3 / 1000;

            // Calculate fresh sheath weight with wastage
            const freshWeight = (volumeCm3 * (freshPercent / 100) * freshDensity * (1 + wastagePercent / 100)) / 1000;

            // Calculate reprocess sheath weight with wastage
            const reprocessWeight = (volumeCm3 * (reprocessPercent / 100) * reprocessDensity * (1 + wastagePercent / 100)) / 1000;

            // Update sheath calculated fields
            setSheath(prev => ({
                ...prev,
                freshSheathWeight: parseFloat(freshWeight.toFixed(4)),
                reprocessSheathWeight: parseFloat(reprocessWeight.toFixed(4))
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        sheath.outerArea,
        sheath.innerArea,
        sheath.freshSheathPercent,
        sheath.reprocessSheathPercent,
        sheath.wastageSheathPercent,
        sheath.freshSheathDensity,
        sheath.reprocessSheathDensity,
        sheath.freshMaterialId,
        sheath.sheathLength,
        cableLength
    ]);

    // Calculate outer area from thickness
    const handleCalculateOuterArea = () => {
        if (!sheath.innerDiameter || sheath.innerDiameter <= 0) {
            alert('Please select cores/sheaths first to calculate inner diameter');
            return;
        }
        if (!sheath.thickness || sheath.thickness <= 0) {
            alert('Please enter thickness first');
            return;
        }

        const innerDiameter = sheath.innerDiameter;
        const thickness = sheath.thickness;

        // Calculate outer diameter
        const outerDiameter = innerDiameter + (2 * thickness);

        // Calculate outer area from outer diameter
        const outerArea = (Math.PI * outerDiameter * outerDiameter) / 4;

        setSheath(prev => ({
            ...prev,
            outerDiameter: parseFloat(outerDiameter.toFixed(4)),
            outerArea: parseFloat(outerArea.toFixed(4))
        }));
        setIsSaved(false);
    };

    // Update local sheath state (handles both single field and batch updates)
    const handleSheathUpdate = (fieldOrUpdates, value) => {
        setIsSaved(false);

        if (typeof fieldOrUpdates === 'string') {
            // Single field update
            setSheath(prev => ({ ...prev, [fieldOrUpdates]: value }));
        } else {
            // Batch update (object of fields)
            setSheath(prev => ({ ...prev, ...fieldOrUpdates }));
        }
    };

    // Build material requirements array with pricing
    const buildMaterialRequirements = async (sheathData) => {
        const materialRequired = [];

        // ═══════════════════════════════════════════════════════
        // SHEATH MATERIALS (use already calculated weights)
        // ═══════════════════════════════════════════════════════
        // Add fresh sheath material
        if (sheathData.freshSheathWeight > 0 && sheathData.freshMaterialId) {
            materialRequired.push({
                materialId: sheathData.freshMaterialId,
                materialName: 'Sheath Fresh', // Will be updated with actual name from pricing fetch
                category: 'sheath',
                purpose: 'sheath-fresh',
                weight: sheathData.freshSheathWeight,
                type: 'fresh',
                pricePerKg: 0,
                totalCost: 0
            });
        }

        // Add reprocess sheath material
        if (sheathData.reprocessSheathWeight > 0 && sheathData.reprocessMaterialId) {
            materialRequired.push({
                materialId: sheathData.reprocessMaterialId,
                materialName: 'Sheath Reprocess', // Will be updated with actual name from pricing fetch
                category: 'sheath',
                purpose: 'sheath-reprocess',
                weight: sheathData.reprocessSheathWeight,
                type: 'reprocess',
                pricePerKg: 0,
                totalCost: 0
            });
        }
        console.log(materialRequired);
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
                        req.materialName = pricing.materialName;
                    }
                });
            } catch (error) {
                console.error('Failed to fetch material pricing:', error);
            }
        }

        return materialRequired;
    };

    // Save sheath to backend
    const handleSave = async () => {
        if (!quotationId) {
            alert('No quotation ID found. Please refresh the page.');
            return;
        }

        setIsSaving(true);
        try {
            // Build material requirements with pricing
            const materialRequired = await buildMaterialRequirements(sheath);

            // Calculate material cost
            const totalMaterialCost = materialRequired.reduce((sum, m) => sum + (m.totalCost || 0), 0);

            // Prepare sheath data for save
            const sheathToSave = {
                ...sheath,
                materialRequired,
                costs: {
                    ...sheath.costs,
                    totalMaterialCost: parseFloat(totalMaterialCost.toFixed(2))
                }
            };

            let response;
            if (sheath._id) {
                // Update existing sheath
                response = await api.put(`/quotation/${quotationId}/sheaths/${sheath._id}`, sheathToSave);


            } else {
                // Create new sheath
                response = await api.post(`/quotation/${quotationId}/sheaths`, sheathToSave);
            }

            // Update local state with saved sheath data (including _id)
            setSheath(response.data);
            setIsSaved(true);
            console.log("sehats res", response.data);
            // Recalculate material requirements and processes
            if (quotationId) {
                await calculateAll(quotationId);
                await calculateAllProcessInQuotation(quotationId);
            }
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

    // Fetch process entries for this sheath
    const fetchProcessEntries = async () => {
        if (!sheath._id) return;

        try {
            setLoadingProcesses(true);
            const response = await api.get(`/process-entry/get-by-parent?sheathId=${sheath._id}`);
            setProcessEntries(response.data || []);
        } catch (error) {
            console.error('Error fetching process entries:', error);
        } finally {
            setLoadingProcesses(false);
        }
    };

    // Fetch process entries when sheath ID changes
    useEffect(() => {
        if (sheath._id) {
            fetchProcessEntries();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sheath._id]);

    // Handle process entry save
    const handleProcessSave = (savedEntry) => {
        setProcessEntries(prev => [...prev, savedEntry]);
        setShowProcessEditor(false);
        calculateAllProcessInQuotation(quotationId);
    };

    // Delete process entry
    const deleteProcessEntry = async (entryId) => {
        if (!window.confirm('Delete this process entry?')) return;

        try {
            await api.delete(`/process-entry/delete-process-entry/${entryId}`);
            setProcessEntries(prev => prev.filter(e => e._id !== entryId));
            calculateAllProcessInQuotation(quotationId);
        } catch (error) {
            console.error('Error deleting process entry:', error);
            alert('Failed to delete process entry');
        }
    };

    // Build context for ProcessEntryEditor
    const buildProcessContext = () => {
        return {
            innerArea: sheath.innerArea || 0,
            innerDiameter: sheath.innerDiameter || 0,
            outerArea: sheath.outerArea || 0,
            outerDiameter: sheath.outerDiameter || 0,
            thickness: sheath.thickness || 0,
            freshSheathWeight: sheath.freshSheathWeight || 0,
            reprocessSheathWeight: sheath.reprocessSheathWeight || 0,
            sheathLength: sheath.sheathLength || cableLength || 0,
            selectedCoreCount: (sheath.coreIds || []).length,
            selectedSheathCount: (sheath.sheathIds || []).length
        };
    };

    const selectedCoreCount = (sheath.coreIds || []).length;
    const selectedSheathCount = (sheath.sheathIds || []).length;
    const totalInnerElements = selectedCoreCount + selectedSheathCount;

    // Calculate display name based on selected material
    const materialDisplayName = sheath.freshMaterialId
        ? `Material selected`
        : 'No material selected';

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
                            <h3 className="text-lg font-bold text-gray-800">
                                {sheath.name || `Sheath Group ${index + 1}`}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {totalInnerElements} element{totalInnerElements !== 1 ? 's' : ''} • {materialDisplayName}
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
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isSaving
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
                    {/* Core & Nested Sheath Selection Component */}
                    <SheathCoreSelector
                        quotationId={quotationId}
                        selectedCoreIds={sheath.coreIds || []}
                        selectedSheathIds={sheath.sheathIds || []}
                        currentSheathId={sheath._id || sheath.id}
                        onCoresUpdated={(updates) => {
                            handleSheathUpdate(updates);
                        }}
                    />

                    {/* Sheath Specifications */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>Thickness (mm)</FieldLabel>
                            <InputField
                                type="number"
                                step="0.1"
                                value={sheath.thickness || ''}
                                onChange={(e) => handleSheathUpdate('thickness', parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div>
                            <FieldLabel>Outer Area (mm²) - Editable</FieldLabel>
                            <div className="flex gap-2">
                                <InputField
                                    type="number"
                                    step="0.01"
                                    value={sheath.outerArea || ''}
                                    onChange={(e) => handleSheathUpdate('outerArea', parseFloat(e.target.value) || 0)}
                                    placeholder="Enter or calculate"
                                />
                                <button
                                    onClick={handleCalculateOuterArea}
                                    className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                                    title="Calculate from thickness and inner diameter"
                                >
                                    Calculate
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Material Selection Component */}
                    <SheathMaterialSelector
                        sheath={sheath}
                        onUpdate={handleSheathUpdate}
                    />

                    {/* Material Cost Display */}
                    {(sheath.freshMaterialId || sheath.reprocessMaterialId) && (
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                            <FieldLabel>Material Costs</FieldLabel>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                {sheath.freshMaterialId && sheath.freshSheathWeight > 0 && (
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <p className="text-xs font-semibold text-emerald-600 mb-2">Fresh Material</p>
                                        <MaterialCostDisplay
                                            materialId={sheath.freshMaterialId}
                                            weight={sheath.freshSheathWeight}
                                            type="fresh"
                                            variant="full"
                                        />
                                    </div>
                                )}
                                {sheath.reprocessMaterialId && sheath.reprocessSheathWeight > 0 && (
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <p className="text-xs font-semibold text-purple-600 mb-2">Reprocess Material</p>
                                        <MaterialCostDisplay
                                            materialId={sheath.reprocessMaterialId}
                                            weight={sheath.reprocessSheathWeight}
                                            type="reprocess"
                                            variant="full"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Sheath Length */}
                    <div>
                        <FieldLabel>Sheath Length (meters) - Use cable length ({cableLength} m) or specify custom</FieldLabel>
                        <InputField
                            type="number"
                            step="0.1"
                            value={sheath.sheathLength || ''}
                            onChange={(e) => handleSheathUpdate('sheathLength', parseFloat(e.target.value) || null)}
                            placeholder={`Uses cable length: ${cableLength} m`}
                        />
                    </div>

                    {/* Process Management */}
                    {sheath._id && (
                        <div className="border-t pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                    <Zap size={16} className="text-amber-500" />
                                    Sheath Processes
                                </h4>
                                <button
                                    onClick={() => setShowProcessEditor(true)}
                                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    + Add Process
                                </button>
                            </div>

                            {/* Process Entry Editor */}
                            {showProcessEditor && (
                                <ProcessEntryEditor
                                    parentId={sheath._id}
                                    parentType="sheath"
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

                    {/* Show message if sheath not saved yet */}
                    {!sheath._id && (
                        <div className="border-t pt-6">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-700">
                                    💡 Save the sheath first to add processes
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Dimension Info */}
                    <div className="grid grid-cols-4 gap-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <StatBox
                            label="Inner Ø"
                            value={`${fmtN(sheath.innerDiameter, 2)} mm`}
                            accent={false}
                        />
                        <StatBox
                            label="Inner Area"
                            value={`${fmtN(sheath.innerArea, 2)} mm²`}
                            accent={false}
                        />
                        <StatBox
                            label="Outer Ø"
                            value={`${fmtN(sheath.outerDiameter, 2)} mm`}
                            accent={false}
                        />
                        <StatBox
                            label="Outer Area"
                            value={`${fmtN(sheath.outerArea, 2)} mm²`}
                            accent={false}
                        />
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                        <StatBox
                            label="Inner Elements"
                            value={`${selectedCoreCount}C + ${selectedSheathCount}S`}
                            accent={false}
                        />
                        <StatBox
                            label="Fresh Weight"
                            value={`${fmtN(sheath.freshSheathWeight, 3)} kg`}
                            accent={false}
                        />
                        <StatBox
                            label="Reprocess Weight"
                            value={`${fmtN(sheath.reprocessSheathWeight, 3)} kg`}
                            accent={false}
                        />
                        <StatBox
                            label="Total Cost"
                            value={fmtCur(sheath.costs?.grandTotal || 0)}
                            accent={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SheathComponent;
