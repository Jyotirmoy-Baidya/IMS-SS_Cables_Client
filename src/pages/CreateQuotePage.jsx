import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Save, ArrowLeft, Zap, Layers, Ruler, Eye, EyeOff } from 'lucide-react';
import CoreComponent from '../components/quotation/core/CoreComponent';
import SheathComponent from '../components/quotation/sheath/SheathComponent';
import QuotationSummary from '../components/quotation/summary/QuotationSummary';
import MaterialSummary from '../components/quotation/summary/MaterialSummary';
import QuoteLevelProcesses from '../components/quotation/processes/QuoteLevelProcesses';
import ManufacturingProcessSummary from '../components/quotation/summary/ManufacturingProcessSummary';
import {
    calculateWireDimensions,
    calculateDrawingLength,
    calculateMaterialWeight
} from '../utils/cableCalculations';
import api from '../api/axiosInstance';
import useMaterialRequirementsStore from '../store/materialRequirementsStore';
import useQuotationStore from '../store/quotationStore';
import CustomerSelector from '../components/quotation/basic/CustomerSelector';
import useQuotationProcessStore from '../store/quotationProcessStore';

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

    const [processMasterList, setProcessMasterList] = useState([]);

    // Processes added to this quotation
    const [quoteProcesses, setQuoteProcesses] = useState([]);

    // Customer selection
    const [selectedCustomerId, setSelectedCustomerId] = useState('');


    // Save state
    const [saving, setSaving] = useState(false);

    const {
        quotation,
        loading: quotationLoading,
        error: quotationError,
        fetchQuotationById,
        addCore: addCoreToQuote,
        removeCore: removeCoreFromQuote,
        addSheath: addSheathToQuote,
        removeSheath: removeSheathFromQuote
    } = useQuotationStore();

    useEffect(() => {
        fetchQuotationById(quoteId);
    }, [quoteId]);


    // Core management
    const addCore = async () => {
        if (!quoteId) {
            alert('No quotation ID found. Please refresh the page.');
            return;
        }

        try {
            // Create empty core in backend
            const response = await api.post(`/quotation/${quoteId}/cores`, {
                coreLength: cableLength
            });

            // Add returned core to state (with all backend defaults)
            const newCore = {
                ...response.data,
                id: response.data._id // Frontend uses 'id', backend uses '_id'
            };
            addCoreToQuote(newCore)
        } catch (error) {
            console.error('Failed to create core:', error);
            alert('Failed to create core: ' + (error.message || 'Unknown error'));
        }
    };

    const deleteCore = (id) => {
        // Remove core from store - CoreComponent handles backend deletion
        removeCoreFromQuote(id);
    };

    const duplicateCore = async (core) => {
        if (!core) return;
        try {
            // Create empty core in backend
            const response = await api.post(`/quotation/${quoteId}/cores`, {
                ...core
            });
            console.log(response)

            // Add returned core to state (with all backend defaults)
            const newCore = {
                ...response.data,
                id: response.data._id // Frontend uses 'id', backend uses '_id'
            };
            addCoreToQuote(newCore)
        } catch (error) {
            console.error('Failed to create core:', error);
            alert('Failed to create core: ' + (error.message || 'Unknown error'));
        }
    };

    // Sheath management
    const addSheathGroup = async () => {
        if (!quoteId) {
            alert('No quotation ID found. Please refresh the page.');
            return;
        }

        try {
            // Create empty sheath in backend
            const response = await api.post(`/quotation/${quoteId}/sheaths`, {
                sheathLength: cableLength
            });

            // Add returned sheath to store
            const newSheath = {
                ...response.data,
                id: response.data._id
            };
            addSheathToQuote(newSheath);
        } catch (error) {
            console.error('Failed to create sheath:', error);
            alert('Failed to create sheath: ' + (error.message || 'Unknown error'));
        }
    };

    const deleteSheathGroup = (id) => {
        // Remove sheath from store - SheathComponent handles backend deletion
        removeSheathFromQuote(id);
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
        const cores = quotation?.cores || [];
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
    }, [quotation?.cores, cableLength]);


    // Use material requirements store for all calculations
    const { totalMaterialCost } = useMaterialRequirementsStore();
    const { totalProcessCost } = useQuotationProcessStore();



    const handleSave = async (statusOverride) => {
        setSaving(true);
        try {

            if (!quoteId) {
                throw new Error('No quotation ID found. Please refresh the page.');
            }

            const payload = {
                customerId: selectedCustomerId || null,
                cableLength,
                status: statusOverride || 'enquired',
                materialCost: totalMaterialCost,
                processCost: totalProcessCost,
                grandTotal: totalMaterialCost + totalProcessCost,
                notes: "Nothing",
            };

            console.log(payload);

            // Update the quotation (cores already saved individually)
            await api.patch(`/quotation/patch-quotation/${quoteId}`, payload);

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
            const cores = quotation?.cores || [];
            const sheathGroups = quotation?.sheathGroups || [];
            const sections = [
                ...cores.map(c => `core-${c._id}`),
                ...sheathGroups.map(sg => `sheath-${sg._id}`),
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
                const firstCore = document.getElementById(`core-${cores[0]._id}`);
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
    }, [quotation?.cores, quotation?.sheathGroups]);

    // Scroll to section helper
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Show loading state
    if (quotationLoading) {
        return (
            <div className="w-full max-w-7xl mx-auto bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-lg font-semibold text-gray-700">Loading quotation...</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the quotation details</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (quotationError) {
        return (
            <div className="w-full max-w-7xl mx-auto bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                    <div className="text-red-600 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Quotation</h2>
                    <p className="text-sm text-red-600 mb-4">{quotationError}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate('/quotations')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                        >
                            Back to Quotations
                        </button>
                        <button
                            onClick={() => fetchQuotationById(quoteId, true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    console.log(quotation);

    return (
        <div className="w-full max-w-7xl mx-auto bg-gray-50 relative">
            {/* Horizontal Progress Bar - Appears after first core crosses center */}
            <div className={`fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-md transition-all duration-300 ${showHorizontalProgress ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                }`}>
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
                        {(quotation?.cores || []).map((core, idx) => {
                            const sectionId = `core-${core._id}`;
                            const isActive = activeSection === sectionId;
                            return (
                                <button
                                    key={core._id}
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
                        {(quotation?.sheathGroups || []).map((sg, idx) => {
                            const sectionId = `sheath-${sg._id}`;
                            const isActive = activeSection === sectionId;
                            return (
                                <button
                                    key={sg._id}
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
                            onClick={() => scrollToSection('material-summary')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${activeSection === 'material-summary'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${activeSection === 'material-summary' ? 'bg-white' : 'bg-gray-400'
                                }`}></div>
                            Materials
                        </button>
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
                                {quoteId ? `Edit Quotation${quotation.quoteNumber ? ` · ${quotation.quoteNumber}` : ''}` : 'New Cable Quotation'}
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
                <CustomerSelector
                    selectedCustomerId={selectedCustomerId}
                    setSelectedCustomerId={setSelectedCustomerId}
                />

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

                {(quotation?.cores || []).map((core, idx) => (
                    <CoreComponent
                        key={core._id || idx}
                        core={core}
                        index={idx}
                        cableLength={cableLength}
                        quotationId={quoteId}
                        onDeleteFromParent={deleteCore}
                        onDuplicate={duplicateCore}
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

                {(quotation?.sheathGroups || []).map((sg, idx) => (
                    <SheathComponent
                        key={sg._id || idx}
                        sheathGroup={sg}
                        index={idx}
                        cableLength={cableLength}
                        quotationId={quoteId}
                        cores={quotation?.cores || []}
                        sheathGroups={quotation?.sheathGroups || []}
                        onDeleteFromParent={deleteSheathGroup}
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
                        quotation={quotation}
                    />
                </div>

                {/* Material Requirements Summary */}
                <MaterialSummary quotation={quotation} />

                {/* Quotation Summary */}
                <QuotationSummary
                    totalMaterialCost={totalMaterialCost}
                    totalProcessCost={totalProcessCost}
                    totalCosting={totalMaterialCost + totalProcessCost}
                />
            </div>
        </div>
    );
};

export default CreateQuotePage;
