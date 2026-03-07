import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Save, ArrowLeft, Zap, Layers, Ruler, Eye, EyeOff } from 'lucide-react';
import CoreComponent from '../components/quotation/core/CoreComponent';
import SheathComponent from '../components/quotation/sheath/SheathComponent';
import QuotationSummary from '../components/quotation/summary/QuotationSummary';
import QuoteLevelProcesses from '../components/quotation/processes/QuoteLevelProcesses';
import ManufacturingProcessSummary from '../components/quotation/summary/ManufacturingProcessSummary';
import {
    calculateWireDimensions,
    calculateDrawingLength,
    calculateMaterialWeight,
    calculateCoreDiameter,
    calculateInsulation
} from '../utils/cableCalculations';
import api from '../api/axiosInstance';
import useMaterialRequirementsStore from '../store/materialRequirementsStore';
import { calculateSheathForGroup } from '../services/calculationService';

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

                    // Convert cores from MongoDB format (_id) to frontend format (id)
                    if (q.cores?.length) {
                        const convertedCores = q.cores.map(core => ({
                            ...core,
                            id: core._id || core.id
                        }));
                        setCores(convertedCores);
                    }

                    // Convert sheathGroups from MongoDB format to frontend format
                    if (q.sheathGroups?.length) {
                        const convertedSheaths = q.sheathGroups.map(sg => ({
                            ...sg,
                            id: sg._id || sg.id,
                            // Ensure coreIds and sheathIds are arrays of strings, not ObjectId instances
                            coreIds: Array.isArray(sg.coreIds) ? sg.coreIds.map(id => String(id)) : [],
                            sheathIds: Array.isArray(sg.sheathIds) ? sg.sheathIds.map(id => String(id)) : []
                        }));
                        setSheathGroups(convertedSheaths);
                    }

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
        coreLength: null,  // null = use cable length
        processes: [],  // Added: processes for this core
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
        reprocessPricePerKg: 0,
        processes: []  // Added: processes for this sheath
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
            coreLength: null,  // null = use cable length
            processes: [],  // Added: processes for this core
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

    const duplicateCore = (id) => {
        const coreToDuplicate = cores.find(c => c.id === id);
        if (!coreToDuplicate) return;

        const newId = Math.max(...cores.map(c => c.id), 0) + 1;
        const duplicatedCore = {
            ...coreToDuplicate,
            id: newId,
            // Deep copy insulation object
            insulation: { ...coreToDuplicate.insulation },
            // Deep copy processes array
            processes: (coreToDuplicate.processes || []).map(p => ({
                ...p,
                id: `${p.processId}_${newId}_${Date.now()}`, // Generate new unique ID for process entry
                variables: p.variables.map(v => ({ ...v }))
            }))
        };

        setCores([...cores, duplicatedCore]);
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
            reprocessPricePerKg: 0,
            processes: []  // Added: processes for this sheath
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

    // Core process management
    const addCoreProcess = (coreId, processEntry) => {
        setCores(prev => prev.map(core =>
            core.id === coreId ? { ...core, processes: [...(core.processes || []), processEntry] } : core
        ));
    };

    const removeCoreProcess = (coreId, processEntryId) => {
        setCores(prev => prev.map(core =>
            core.id === coreId ? { ...core, processes: (core.processes || []).filter(p => p.id !== processEntryId) } : core
        ));
    };

    const updateCoreProcessVariable = (coreId, processEntryId, varName, value) => {
        setCores(prev => prev.map(core => {
            if (core.id !== coreId) return core;
            return {
                ...core,
                processes: (core.processes || []).map(p => {
                    if (p.id !== processEntryId) return p;
                    return {
                        ...p,
                        variables: p.variables.map(v => v.name === varName ? { ...v, value } : v)
                    };
                })
            };
        }));
    };

    // Sheath process management
    const addSheathProcess = (sheathId, processEntry) => {
        setSheathGroups(prev => prev.map(sheath =>
            sheath.id === sheathId ? { ...sheath, processes: [...(sheath.processes || []), processEntry] } : sheath
        ));
    };

    const removeSheathProcess = (sheathId, processEntryId) => {
        setSheathGroups(prev => prev.map(sheath =>
            sheath.id === sheathId ? { ...sheath, processes: (sheath.processes || []).filter(p => p.id !== processEntryId) } : sheath
        ));
    };

    const updateSheathProcessVariable = (sheathId, processEntryId, varName, value) => {
        setSheathGroups(prev => prev.map(sheath => {
            if (sheath.id !== sheathId) return sheath;
            return {
                ...sheath,
                processes: (sheath.processes || []).map(p => {
                    if (p.id !== processEntryId) return p;
                    return {
                        ...p,
                        variables: p.variables.map(v => v.name === varName ? { ...v, value } : v)
                    };
                })
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

    // Build core-specific context (merges global + core data)
    const buildCoreContext = (core) => {
        const effectiveCoreLength = core.coreLength ?? cableLength;  // Use core length if set, otherwise cable length
        const wireDims = calculateWireDimensions(core.totalCoreArea, core.wireCount);
        const coreDiameter = calculateCoreDiameter(wireDims.diameterPerWire, core.wireCount);
        const drawingLength = calculateDrawingLength(core.wireCount, effectiveCoreLength);
        const insulationCalc = calculateInsulation(
            coreDiameter,
            core.insulation?.thickness || 0.5,
            effectiveCoreLength,
            'custom',
            core.insulation?.freshPercent || 70,
            core.insulation?.reprocessPercent || 30,
            0,
            null,
            core.insulation?.density || 1.4
        );

        return {
            ...quoteContext,
            // Core-specific length
            coreLength: effectiveCoreLength,
            // Core conductor variables
            coreMaterialDensity: core.materialDensity || 8.96,
            coreTotalCoreArea: core.totalCoreArea || 0,
            coreWireCount: core.wireCount || 0,
            coreWastagePercent: core.wastagePercent || 0,
            coreHasAnnealing: core.hasAnnealing ? 1 : 0,
            // Core insulation variables
            insulationDensity: core.insulation?.density || 0,
            insulationThickness: core.insulation?.thickness || 0,
            insulationFreshPercent: core.insulation?.freshPercent || 0,
            insulationReprocessPercent: core.insulation?.reprocessPercent || 0,
            insulationFreshPricePerKg: core.insulation?.freshPricePerKg || 0,
            insulationReprocessPricePerKg: core.insulation?.reprocessPricePerKg || 0,
            // Calculated values
            wireDiameter: wireDims.diameterPerWire || 0,
            conductorDiameter: coreDiameter || 0,
            insulatedDiameter: insulationCalc.insulatedDiameter || 0,
            drawingLength: drawingLength || 0,
            materialWeight: calculateMaterialWeight(wireDims.areaPerWire, drawingLength, core.materialDensity, core.wastagePercent) || 0,
            insulationWeight: (insulationCalc.freshWeight || 0) + (insulationCalc.reprocessWeight || 0)
        };
    };

    // Build sheath-specific context (merges global + sheath data)
    const buildSheathContext = (sheath) => {
        return {
            ...quoteContext,
            // Sheath variables
            sheathDensity: sheath.density || 0,
            sheathThickness: sheath.thickness || 0,
            sheathFreshPercent: sheath.freshPercent || 0,
            sheathReprocessPercent: sheath.reprocessPercent || 0,
            sheathFreshPricePerKg: sheath.freshPricePerKg || 0,
            sheathReprocessPricePerKg: sheath.reprocessPricePerKg || 0,
            // Sheath weight would be calculated based on sheath dimensions
            sheathWeight: 0 // TODO: Calculate based on sheath dimensions
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

    // Wrapper for calculateSheathForGroup that provides current context
    const calculateSheathWithContext = (sheathGroup) => {
        return calculateSheathForGroup(sheathGroup, cores, sheathGroups, cableLength);
    };

    // Use material requirements store for all calculations
    const materialStore = useMaterialRequirementsStore();

    // Recalculate whenever cores, sheaths, cable length, or material types change
    useEffect(() => {
        const calculate = async () => {
            await materialStore.calculateAll(
                { cores, sheathGroups, cableLength },
                { metalTypes, insulationTypes }
            );
        };
        calculate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cores, sheathGroups, cableLength, metalTypes, insulationTypes]);

    const totals = 0;

    // Calculate total process cost from all sources (cores, sheaths, quote-level)
    const totalProcessCost = useMemo(() => {
        let cost = 0;
        // Core processes
        cores.forEach(core => {
            (core.processes || []).forEach(p => {
                cost += evalFormula(p.formula, p.variables);
            });
        });
        // Sheath processes
        sheathGroups.forEach(sheath => {
            (sheath.processes || []).forEach(p => {
                cost += evalFormula(p.formula, p.variables);
            });
        });
        // Quote-level processes
        quoteProcesses.forEach(p => {
            cost += evalFormula(p.formula, p.variables);
        });
        return cost;
    }, [cores, sheathGroups, quoteProcesses]);

    const handleSave = async (statusOverride) => {
        setSaving(true);
        try {
            // Calculate total process cost from all sources: cores, sheaths, and quote-level
            let processCost = 0;

            // 1. Core processes
            cores.forEach(core => {
                (core.processes || []).forEach(p => {
                    processCost += evalFormula(p.formula, p.variables);
                });
            });

            // 2. Sheath processes
            sheathGroups.forEach(sheath => {
                (sheath.processes || []).forEach(p => {
                    processCost += evalFormula(p.formula, p.variables);
                });
            });

            // 3. Quote-level processes
            quoteProcesses.forEach(p => {
                processCost += evalFormula(p.formula, p.variables);
            });

            const grandTotal = totals.totalCost + processCost;
            const profitAmount = grandTotal * (profitMarginPercent / 100);
            const finalPrice = grandTotal + profitAmount;

            // Sanitize sheathGroups to ensure coreIds and sheathIds are proper arrays
            const sanitizedSheathGroups = sheathGroups.map(sg => ({
                ...sg,
                coreIds: Array.isArray(sg.coreIds) ? sg.coreIds : [],
                sheathIds: Array.isArray(sg.sheathIds) ? sg.sheathIds : []
            }));

            const payload = {
                customerId: selectedCustomerId || null,
                cableLength,
                cores,
                sheathGroups: sanitizedSheathGroups,
                quoteProcesses,
                materialCost: totals.totalCost,
                processCost,
                grandTotal,
                profitMarginPercent,
                profitAmount,
                finalPrice,
                status: statusOverride || 'enquired'
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

    // Active section tracking
    const [activeSection, setActiveSection] = useState('');
    const [showHorizontalProgress, setShowHorizontalProgress] = useState(false);
    const [showScrollGuide, setShowScrollGuide] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const sections = [
                ...cores.map(c => `core-${c.id}`),
                ...sheathGroups.map(sg => `sheath-${sg.id}`),
                'quotation-summary'
            ];

            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
                        setActiveSection(sectionId);
                        break;
                    }
                }
            }

            // Check if first core has crossed center of screen
            if (cores.length > 0) {
                const firstCore = document.getElementById(`core-${cores[0].id}`);
                if (firstCore) {
                    const rect = firstCore.getBoundingClientRect();
                    // Show horizontal progress when first core crosses center (going up)
                    setShowHorizontalProgress(rect.top < window.innerHeight / 2);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [cores, sheathGroups]);

    // Scroll to section helper
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto bg-gray-50 relative">
            {/* Horizontal Progress Bar - Appears after first core crosses center */}
            <div className={`fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-md transition-all duration-300 ${showHorizontalProgress ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                }`}>
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
                        {cores.map((core, idx) => {
                            const sectionId = `core-${core.id}`;
                            const isActive = activeSection === sectionId;
                            return (
                                <button
                                    key={core.id}
                                    onClick={() => scrollToSection(sectionId)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${isActive
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-gray-400'
                                        }`}></div>
                                    Core {idx + 1}
                                </button>
                            );
                        })}
                        {sheathGroups.map((sg, idx) => {
                            const sectionId = `sheath-${sg.id}`;
                            const isActive = activeSection === sectionId;
                            return (
                                <button
                                    key={sg.id}
                                    onClick={() => scrollToSection(sectionId)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${isActive
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-gray-400'
                                        }`}></div>
                                    Sheath {idx + 1}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => scrollToSection('quotation-summary')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${activeSection === 'quotation-summary'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${activeSection === 'quotation-summary' ? 'bg-white' : 'bg-gray-400'
                                }`}></div>
                            Summary
                        </button>
                    </div>
                </div>
            </div>



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
                            onClick={() => setShowScrollGuide(!showScrollGuide)}
                            className="hidden xl:flex items-center gap-2 px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                            title={showScrollGuide ? 'Hide scroll guide' : 'Show scroll guide'}
                        >
                            {showScrollGuide ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
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
                        onDuplicate={duplicateCore}
                        metalTypes={metalTypes}
                        metalRawMaterials={metalRawMaterials}
                        insulationTypes={insulationTypes}
                        insulationRawMaterials={insulationRawMaterials}
                        processMasterList={processMasterList}
                        quoteContext={buildCoreContext(core)}
                        onAddProcess={(entry) => addCoreProcess(core.id, entry)}
                        onRemoveProcess={(processId) => removeCoreProcess(core.id, processId)}
                        onUpdateProcessVariable={(processId, varName, value) =>
                            updateCoreProcessVariable(core.id, processId, varName, value)
                        }
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
                        calculateSheathForGroup={calculateSheathWithContext}
                        getAvailableCores={getAvailableCores}
                        getAvailableSheaths={getAvailableSheaths}
                        processMasterList={processMasterList}
                        quoteContext={buildSheathContext(sg)}
                        onAddProcess={(entry) => addSheathProcess(sg.id, entry)}
                        onRemoveProcess={(processId) => removeSheathProcess(sg.id, processId)}
                        onUpdateProcessVariable={(processId, varName, value) =>
                            updateSheathProcessVariable(sg.id, processId, varName, value)
                        }
                    />
                ))}

                {/* Cable-Level Processes */}
                <div className="mt-8">
                    <QuoteLevelProcesses
                        quoteProcesses={quoteProcesses}
                        onAdd={addQuoteProcess}
                        onRemove={removeQuoteProcess}
                        onUpdateVariable={updateProcessVariable}
                        processMasterList={processMasterList}
                        quoteContext={quoteContext}
                    />
                </div>

                {/* Manufacturing Process Summary - Aggregated view of all processes */}
                <div className="mt-8">
                    <ManufacturingProcessSummary
                        quotation={{
                            cores,
                            sheathGroups,
                            quoteProcesses
                        }}
                    />
                </div>


                {/* Quotation Summary */}
                <QuotationSummary
                    totals={totals}
                    totalProcessCost={totalProcessCost}
                    profitMarginPercent={profitMarginPercent}
                    onProfitMarginChange={setProfitMarginPercent}
                />
            </div>
        </div>
    );
};

export default CreateQuotePage;
