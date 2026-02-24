import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Save, ArrowLeft, Zap, Layers, Ruler } from 'lucide-react';
import CoreComponent from '../components/quotation/core/CoreComponent';
import SheathComponent from '../components/quotation/sheath/SheathComponent';
import QuotationSummary from '../components/quotation/summary/QuotationSummary';
import QuoteProcessSection from '../components/quotation/processes/QuoteProcessSection';
import {
    calculateWireDimensions,
    calculateDrawingLength,
    calculateMaterialWeight,
    calculateCoreDiameter,
    calculateInsulation
} from '../utils/cableCalculations';
import api from '../api/axiosInstance';

const evalFormula = (formula, variables) => {
    try {
        const scope = {};
        variables.forEach(v => { scope[v.name] = parseFloat(v.value) || 0; });
        if (!formula.trim()) return 0;
        // eslint-disable-next-line no-new-func
        const fn = new Function(...Object.keys(scope), `return (${formula})`);
        const result = fn(...Object.values(scope));
        return typeof result === 'number' && isFinite(result) ? result : 0;
    } catch { return 0; }
};

const CreateQuotePage = () => {
    const { id: quoteId } = useParams();
    const navigate = useNavigate();

    // Shared cable length for all cores
    const [cableLength, setCableLength] = useState(100);

    // DB raw materials data
    const [metalTypes, setMetalTypes] = useState([]);
    const [insulationTypes, setInsulationTypes] = useState([]);
    const [metalRawMaterials, setMetalRawMaterials] = useState([]);
    const [insulationRawMaterials, setInsulationRawMaterials] = useState([]);
    const [processMasterList, setProcessMasterList] = useState([]);

    // Processes added to this quotation
    const [quoteProcesses, setQuoteProcesses] = useState([]);

    // Customer selection
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');

    // Profit margin
    const [profitMarginPercent, setProfitMarginPercent] = useState(0);

    // Save state
    const [saving, setSaving] = useState(false);
    const [quoteNumber, setQuoteNumber] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const requests = [
                    api.get('/material-type/get-all-material-types'),
                    api.get('/raw-material/get-all-materials?category=metal'),
                    api.get('/raw-material/get-all-materials'),
                    api.get('/process/get-all-processes?isActive=true'),
                    api.get('/customer/get-all-customer'),
                ];
                if (quoteId) requests.push(api.get(`/quotation/get-one-quotation/${quoteId}`));

                const results = await Promise.all(requests);
                const [typesRes, metalMatRes, insulMatRes, processRes, customerRes, quoteRes] = results;

                const allTypes = typesRes.data || [];
                setMetalTypes(allTypes.filter(t => t.category === 'metal'));
                setInsulationTypes(allTypes.filter(t => t.category === 'insulation' || t.category === 'plastic'));
                setMetalRawMaterials(metalMatRes.data || []);
                const allMats = insulMatRes.data || [];
                setInsulationRawMaterials(allMats.filter(m => m.category === 'insulation' || m.category === 'plastic'));
                setProcessMasterList(processRes.data || []);
                setCustomers(customerRes.data || []);

                // Load existing quote for editing
                if (quoteRes) {
                    const q = quoteRes.data;
                    setQuoteNumber(q.quoteNumber || '');
                    setCableLength(q.cableLength || 100);
                    if (q.cores?.length) setCores(q.cores);
                    if (q.sheathGroups?.length) setSheathGroups(q.sheathGroups);
                    if (q.quoteProcesses?.length) setQuoteProcesses(q.quoteProcesses);
                    setSelectedCustomerId(q.customerId?._id || q.customerId || '');
                    setProfitMarginPercent(q.profitMarginPercent || 0);
                }
            } catch (err) {
                console.error('Failed to load data for quotation:', err);
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quoteId]);

    const [cores, setCores] = useState([{
        id: 1,
        materialTypeId: null,
        materialDensity: 8.96,
        totalCoreArea: 8,
        wireCount: 16,
        wastagePercent: 5,
        selectedRod: null,
        hasAnnealing: false,
        insulation: {
            materialTypeId: null,
            materialTypeName: '',
            density: 1.4,
            thickness: 0.5,
            freshPercent: 70,
            reprocessPercent: 30,
            freshPricePerKg: 0,
            reprocessMaterialTypeId: null,   // reprocess portion can be a different material
            reprocessMaterialTypeName: '',
            reprocessDensity: null,          // null = use same density as fresh
            reprocessPricePerKg: 0
        }
    }]);

    const [sheathGroups, setSheathGroups] = useState([{
        id: 1,
        coreIds: [],
        sheathIds: [],
        material: '',
        materialTypeId: null,
        density: 1.4,
        thickness: 1.0,
        freshPercent: 60,
        reprocessPercent: 40,
        freshPricePerKg: 0,
        reprocessMaterialTypeId: null,
        reprocessMaterialTypeName: '',
        reprocessDensity: null,
        reprocessPricePerKg: 0
    }]);


    // Core management
    const addCore = () => {
        const newId = Math.max(...cores.map(c => c.id), 0) + 1;
        setCores([...cores, {
            id: newId,
            materialTypeId: null,
            materialDensity: 8.96,
            totalCoreArea: 8,
            wireCount: 16,
            wastagePercent: 5,
            selectedRod: null,
            hasAnnealing: false,
            insulation: {
                materialTypeId: null,
                materialTypeName: '',
                density: 1.4,
                thickness: 0.5,
                freshPercent: 70,
                reprocessPercent: 30,
                freshPricePerKg: 0,
                reprocessMaterialTypeId: null,
                reprocessMaterialTypeName: '',
                reprocessDensity: null,
                reprocessPricePerKg: 0
            }
        }]);
    };

    const updateCore = (id, field, value) => {
        setCores(prev => prev.map(core => {
            if (core.id !== id) return core;
            if (field === 'materialTypeId' && value !== core.materialTypeId) {
                return { ...core, [field]: value, selectedRod: null };
            }
            return { ...core, [field]: value };
        }));
    };

    const deleteCore = (id) => {
        setCores(cores.filter(core => core.id !== id));
        setSheathGroups(sheathGroups.map(sg => ({
            ...sg,
            coreIds: sg.coreIds.filter(cid => cid !== id)
        })));
    };

    // Sheath management
    const addSheathGroup = () => {
        const newId = Math.max(...sheathGroups.map(sg => sg.id), 0) + 1;
        setSheathGroups([...sheathGroups, {
            id: newId,
            coreIds: [],
            sheathIds: [],
            material: '',
            materialTypeId: null,
            density: 1.4,
            thickness: 1.0,
            freshPercent: 60,
            reprocessPercent: 40,
            freshPricePerKg: 0,
            reprocessMaterialTypeId: null,
            reprocessMaterialTypeName: '',
            reprocessDensity: null,
            reprocessPricePerKg: 0
        }]);
    };

    const updateSheathGroup = (id, field, value) => {
        setSheathGroups(prev => prev.map(sg =>
            sg.id === id ? { ...sg, [field]: value } : sg
        ));
    };

    const deleteSheathGroup = (id) => {
        setSheathGroups(sheathGroups.filter(sg => sg.id !== id));
    };

    // Process management
    const addQuoteProcess = (entry) => {
        setQuoteProcesses(prev => [...prev, entry]);
    };

    const removeQuoteProcess = (id) => {
        setQuoteProcesses(prev => prev.filter(p => p.id !== id));
    };

    const updateProcessVariable = (processEntryId, varName, value) => {
        setQuoteProcesses(prev => prev.map(p => {
            if (p.id !== processEntryId) return p;
            return {
                ...p,
                variables: p.variables.map(v => v.name === varName ? { ...v, value } : v)
            };
        }));
    };

    // Quote context — auto-bound variable values from the current quote state
    const quoteContext = useMemo(() => {
        const totalWireCount = cores.reduce((sum, c) => sum + (c.wireCount || 0), 0);
        const totalDrawingLength = cores.reduce((sum, c) =>
            sum + calculateDrawingLength(c.wireCount, cableLength), 0);
        const totalMaterialWeight = cores.reduce((sum, c) => {
            const wDims = calculateWireDimensions(c.totalCoreArea, c.wireCount);
            return sum + calculateMaterialWeight(wDims.areaPerWire, calculateDrawingLength(c.wireCount, cableLength), c.materialDensity, c.wastagePercent);
        }, 0);
        const totalCoreArea = cores.reduce((sum, c) => sum + (c.totalCoreArea || 0), 0);
        return {
            cableLength,
            coreCount: cores.length,
            totalWireCount,
            totalDrawingLength,
            totalMaterialWeight,
            totalCoreArea
        };
    }, [cores, cableLength]);

    // Helper to get insulated diameter and area for a core
    const getCoreOuterDimensions = (coreId) => {
        const core = cores.find(c => c.id === coreId);
        if (!core) return { diameter: 0, area: 0 };

        const wireDimensions = calculateWireDimensions(core.totalCoreArea, core.wireCount);
        const coreDiameter = calculateCoreDiameter(wireDimensions.diameterPerWire, core.wireCount);
        const insulationCalc = calculateInsulation(
            coreDiameter,
            core.insulation.thickness,
            cableLength,
            'custom',
            core.insulation.freshPercent,
            core.insulation.reprocessPercent,
            0, // price not needed for dimension calc
            null,
            core.insulation.density || 1.4
        );

        const outerArea = (Math.PI * insulationCalc.insulatedDiameter * insulationCalc.insulatedDiameter) / 4;

        return {
            diameter: insulationCalc.insulatedDiameter,
            area: outerArea
        };
    };

    // Helper to get sheath outer dimensions
    const getSheathOuterDimensions = (sheathId) => {
        const sheath = sheathGroups.find(sg => sg.id === sheathId);
        if (!sheath) return { diameter: 0, area: 0 };

        const sheathCalc = calculateSheathForGroup(sheath);
        if (!sheathCalc) return { diameter: 0, area: 0 };

        const outerArea = (Math.PI * sheathCalc.sheathOuterDiameter * sheathCalc.sheathOuterDiameter) / 4;

        return {
            diameter: sheathCalc.sheathOuterDiameter,
            area: outerArea
        };
    };

    // Helper to check which cores are available (not used in any sheath)
    const getAvailableCores = (excludeSheathId = null) => {
        const usedCoreIds = new Set();
        sheathGroups.forEach(sg => {
            if (sg.id !== excludeSheathId) {
                (sg.coreIds || []).forEach(cid => usedCoreIds.add(cid));
            }
        });
        return cores.filter(c => !usedCoreIds.has(c.id));
    };

    // Helper to check which sheaths are available (not used in any other sheath, and not self)
    const getAvailableSheaths = (excludeSheathId) => {
        const usedSheathIds = new Set();
        sheathGroups.forEach(sg => {
            if (sg.id !== excludeSheathId) {
                (sg.sheathIds || []).forEach(sid => usedSheathIds.add(sid));
            }
        });
        return sheathGroups.filter(sg =>
            sg.id !== excludeSheathId &&
            !usedSheathIds.has(sg.id) &&
            ((sg.coreIds && sg.coreIds.length > 0) || (sg.sheathIds && sg.sheathIds.length > 0))
        );
    };

    // Calculate sheath for a specific group
    const calculateSheathForGroup = (sheathGroup) => {
        const innerDiameters = [];
        const innerAreas = [];
        let avgLength = 0;
        let lengthCount = 0;

        // Get dimensions from cores
        (sheathGroup.coreIds || []).forEach(coreId => {
            const core = cores.find(c => c.id === coreId);
            if (core) {
                const dimensions = getCoreOuterDimensions(coreId);
                innerDiameters.push(dimensions.diameter);
                innerAreas.push(dimensions.area);
                avgLength += cableLength;
                lengthCount++;
            }
        });

        // Get dimensions from nested sheaths
        (sheathGroup.sheathIds || []).forEach(sheathId => {
            const dimensions = getSheathOuterDimensions(sheathId);
            if (dimensions.diameter > 0) {
                innerDiameters.push(dimensions.diameter);
                innerAreas.push(dimensions.area);
                // Use average length from nested sheath's contents
                const nestedSheath = sheathGroups.find(sg => sg.id === sheathId);
                if (nestedSheath) {
                    const nestedCalc = calculateSheathForGroup(nestedSheath);
                    if (nestedCalc) {
                        avgLength += nestedCalc.avgLength;
                        lengthCount++;
                    }
                }
            }
        });

        if (innerDiameters.length === 0) return null;

        avgLength = avgLength / lengthCount;

        // Calculate total inner area
        const totalInnerArea = innerAreas.reduce((sum, area) => sum + area, 0);

        // Calculate bundle diameter from total area
        const bundleDiameter = Math.sqrt((totalInnerArea * 4) / Math.PI);
        const sheathOuterDiameter = bundleDiameter + (2 * sheathGroup.thickness);

        // Volume calculation
        const outerRadius = sheathOuterDiameter / 2;
        const innerRadius = bundleDiameter / 2;
        const volumeMm3 = Math.PI * (outerRadius ** 2 - innerRadius ** 2) * avgLength * 1000;
        const volumeCm3 = volumeMm3 / 1000;

        const freshDens = sheathGroup.density || 1.4;
        const reprocessDens = sheathGroup.reprocessDensity || freshDens;

        const freshWeight = (volumeCm3 * (sheathGroup.freshPercent / 100) * freshDens) / 1000;
        const reprocessWeight = (volumeCm3 * (sheathGroup.reprocessPercent / 100) * reprocessDens) / 1000;
        const totalWeight = freshWeight + reprocessWeight;

        const freshPrice = sheathGroup.freshPricePerKg || 0;
        const reprocessPrice = (sheathGroup.reprocessPricePerKg > 0)
            ? sheathGroup.reprocessPricePerKg
            : freshPrice * 0.7;
        const freshCost = freshWeight * freshPrice;
        const reprocessCost = reprocessWeight * reprocessPrice;

        return {
            bundleDiameter: parseFloat(bundleDiameter.toFixed(3)),
            sheathOuterDiameter: parseFloat(sheathOuterDiameter.toFixed(3)),
            totalInnerArea: parseFloat(totalInnerArea.toFixed(3)),
            totalWeight: parseFloat(totalWeight.toFixed(4)),
            freshWeight: parseFloat(freshWeight.toFixed(4)),
            reprocessWeight: parseFloat(reprocessWeight.toFixed(4)),
            freshCost: parseFloat(freshCost.toFixed(2)),
            reprocessCost: parseFloat(reprocessCost.toFixed(2)),
            totalCost: parseFloat((freshCost + reprocessCost).toFixed(2)),
            avgLength
        };
    };

    // Calculate all totals — returns per-entity details for the summary
    const calculateTotals = () => {
        let totalCost = 0;
        const details = []; // { type, coreIndex?, sheathIndex?, name, weight?, freshWeight?, reprocessWeight?, reprocessName?, cost }

        cores.forEach((core, idx) => {
            const wireDimensions = calculateWireDimensions(core.totalCoreArea, core.wireCount);
            const drawingLength = calculateDrawingLength(core.wireCount, cableLength);
            const coreDiameter = calculateCoreDiameter(wireDimensions.diameterPerWire, core.wireCount);
            const materialWeight = calculateMaterialWeight(
                wireDimensions.areaPerWire,
                drawingLength,
                core.materialDensity || 8.96,
                core.wastagePercent
            );

            if (core.selectedRod) {
                const rodPrice = core.selectedRod?.inventory?.avgPricePerKg || 0;
                const conductorCost = materialWeight * rodPrice;
                totalCost += conductorCost;
                const metalName = metalTypes.find(t => t._id === core.materialTypeId)?.name || 'Metal';
                details.push({
                    type: 'conductor',
                    coreIndex: idx,
                    coreId: core.id,
                    name: metalName,
                    weight: parseFloat(materialWeight.toFixed(4)),
                    pricePerKg: rodPrice,
                    cost: parseFloat(conductorCost.toFixed(2))
                });
            }

            const insulationCalc = calculateInsulation(
                coreDiameter,
                core.insulation.thickness,
                cableLength,
                'custom',
                core.insulation.freshPercent,
                core.insulation.reprocessPercent,
                core.insulation.freshPricePerKg || 0,
                core.insulation.reprocessPricePerKg || null,
                core.insulation.density || 1.4,
                core.insulation.reprocessDensity || null
            );
            totalCost += insulationCalc.totalCost;

            const insulName = core.insulation.materialTypeName ||
                insulationTypes.find(t => t._id === core.insulation.materialTypeId)?.name || '';
            if (insulName) {
                details.push({
                    type: 'insulation',
                    coreIndex: idx,
                    coreId: core.id,
                    name: insulName,
                    freshWeight: insulationCalc.freshWeight,
                    reprocessWeight: insulationCalc.reprocessWeight,
                    reprocessName: core.insulation.reprocessMaterialTypeName || insulName,
                    cost: insulationCalc.totalCost
                });
            }
        });

        sheathGroups.forEach((sg, idx) => {
            const sheathCalc = calculateSheathForGroup(sg);
            if (sheathCalc) {
                totalCost += sheathCalc.totalCost;
                const sheathName = insulationTypes.find(t => t._id === sg.materialTypeId)?.name ||
                    sg.material || '';
                if (sheathName) {
                    details.push({
                        type: 'sheath',
                        sheathIndex: idx,
                        sheathId: sg.id,
                        name: sheathName,
                        freshWeight: sheathCalc.freshWeight,
                        reprocessWeight: sheathCalc.reprocessWeight,
                        reprocessName: sg.reprocessMaterialTypeName || sheathName,
                        cost: sheathCalc.totalCost
                    });
                }
            }
        });

        return { totalCost, details };
    };

    const totals = calculateTotals();

    const handleSave = async (statusOverride) => {
        setSaving(true);
        try {
            const processCost = quoteProcesses.reduce(
                (sum, p) => sum + evalFormula(p.formula, p.variables), 0
            );
            const grandTotal = totals.totalCost + processCost;
            const profitAmount = grandTotal * (profitMarginPercent / 100);
            const finalPrice = grandTotal + profitAmount;

            const payload = {
                customerId: selectedCustomerId || null,
                cableLength,
                cores,
                sheathGroups,
                quoteProcesses,
                materialCost: totals.totalCost,
                processCost,
                grandTotal,
                profitMarginPercent,
                profitAmount,
                finalPrice,
                status: statusOverride || 'enquired',
            };

            if (quoteId) {
                await api.put(`/quotation/update-quotation/${quoteId}`, payload);
            } else {
                await api.post('/quotation/create-quotation', payload);
            }
            navigate('/quotations');
        } catch (err) {
            alert('Failed to save: ' + (err.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto bg-gray-50">
            <div className="mb-6">
                {/* Page Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/quotations')}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {quoteId ? `Edit Quotation${quoteNumber ? ` · ${quoteNumber}` : ''}` : 'New Cable Quotation'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Comprehensive calculator for multi-core wire and cable manufacturing
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => handleSave('enquired')}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <Save size={15} />
                            Save as Enquiry
                        </button>
                        <button
                            onClick={() => handleSave('pending')}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save size={15} />
                            {saving ? 'Saving…' : quoteId ? 'Update Quotation' : 'Save Quotation'}
                        </button>
                    </div>
                </div>

                {/* Customer Selection */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                Customer
                            </label>
                            <select
                                value={selectedCustomerId}
                                onChange={e => setSelectedCustomerId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">— Select customer (optional) —</option>
                                {customers.filter(c => c.isActive !== false).map(c => (
                                    <option key={c._id} value={c._id}>{c.companyName}</option>
                                ))}
                            </select>
                        </div>
                        {selectedCustomerId && (() => {
                            const c = customers.find(x => x._id === selectedCustomerId);
                            if (!c) return null;
                            const primary = c.contacts?.find(ct => ct.isPrimary) || c.contacts?.[0];
                            return (
                                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-600 min-w-48">
                                    <p className="font-semibold text-gray-800 mb-1">{c.companyName}</p>
                                    {c.address?.city && (
                                        <p>{c.address.city}{c.address.state ? `, ${c.address.state}` : ''}</p>
                                    )}
                                    {primary?.phone && <p>{primary.phone}</p>}
                                    {primary?.email && <p className="truncate">{primary.email}</p>}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Shared Cable Length */}
                <div className="bg-linear-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 mb-8 mt-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white p-2.5 rounded-lg">
                                <Ruler size={18} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-blue-900">
                                    Cable Length
                                </label>
                                <p className="text-xs text-blue-600 mt-0.5">Applies to all cores in this quotation</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                value={cableLength}
                                onChange={e => setCableLength(parseFloat(e.target.value) || 0)}
                                min="1"
                                step="1"
                                className="w-28 px-4 py-2.5 text-lg font-bold text-blue-900 text-right border-2 border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
                            />
                            <span className="text-sm font-semibold text-blue-700">meters</span>
                        </div>
                    </div>
                </div>

                {/* Core Configuration Section */}
                <div className="bg-linear-to-r from-slate-50 to-slate-100 border-l-4 border-blue-600 rounded-lg p-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-lg">
                            <Zap size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Core Configuration</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Configure conductor cores and insulation</p>
                        </div>
                    </div>
                    <button
                        onClick={addCore}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus size={16} /> Add Core
                    </button>
                </div>

                {cores.map((core, idx) => (
                    <CoreComponent
                        key={core.id}
                        core={core}
                        index={idx}
                        cableLength={cableLength}
                        onUpdate={updateCore}
                        onDelete={deleteCore}
                        metalTypes={metalTypes}
                        metalRawMaterials={metalRawMaterials}
                        insulationTypes={insulationTypes}
                        insulationRawMaterials={insulationRawMaterials}
                    />
                ))}

                {/* Sheath Configuration Section */}
                <div className="bg-linear-to-r from-teal-50 to-teal-100 border-l-4 border-teal-600 rounded-lg p-4 mb-4 mt-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-600 text-white p-2 rounded-lg">
                            <Layers size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Outer Sheath Configuration</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Add protective sheath layers around cores</p>
                        </div>
                    </div>
                    <button
                        onClick={addSheathGroup}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                    >
                        <Plus size={16} /> Add Sheath Group
                    </button>
                </div>

                {sheathGroups.map((sg, idx) => (
                    <SheathComponent
                        key={sg.id}
                        sheathGroup={sg}
                        index={idx}
                        cores={cores}
                        sheathGroups={sheathGroups}
                        onUpdate={updateSheathGroup}
                        onDelete={deleteSheathGroup}
                        insulationTypes={insulationTypes}
                        insulationRawMaterials={insulationRawMaterials}
                        calculateSheathForGroup={calculateSheathForGroup}
                        getAvailableCores={getAvailableCores}
                        getAvailableSheaths={getAvailableSheaths}
                    />
                ))}

                {/* Manufacturing Processes (from Process Master) */}
                <div className="mt-8">
                    <QuoteProcessSection
                        processes={quoteProcesses}
                        onAdd={addQuoteProcess}
                        onRemove={removeQuoteProcess}
                        onUpdateVariable={updateProcessVariable}
                        processMasterList={processMasterList}
                        quoteContext={quoteContext}
                    />
                </div>

                {/* Quotation Summary */}
                <QuotationSummary
                    totals={totals}
                    quoteProcesses={quoteProcesses}
                    profitMarginPercent={profitMarginPercent}
                    onProfitMarginChange={setProfitMarginPercent}
                />
            </div>
        </div>
    );
};

export default CreateQuotePage;
