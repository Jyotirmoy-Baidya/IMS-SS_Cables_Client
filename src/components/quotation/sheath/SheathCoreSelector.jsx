import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Save, Check } from 'lucide-react';
import api from '../../../api/axiosInstance';

const FieldLabel = ({ children }) => (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{children}</label>
);

const StatBox = ({ label, value, accent }) => (
    <div className={`rounded-lg px-3 py-2 ${accent ? 'bg-teal-50 border border-teal-100' : 'bg-gray-50 border border-gray-100'}`}>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm font-bold ${accent ? 'text-teal-700' : 'text-gray-700'}`}>{value}</p>
    </div>
);

const SheathCoreSelector = ({
    quotationId,
    selectedCoreIds = [],
    selectedSheathIds = [],
    currentSheathId,
    onCoresUpdated
}) => {
    // Helper to normalize IDs (extract _id from objects if needed)
    const normalizeIds = (ids) => {
        if (!Array.isArray(ids)) return [];
        return ids.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null) return item._id || item.id;
            return null;
        }).filter(Boolean);
    };

    const [allCores, setAllCores] = useState([]);
    const [allSheaths, setAllSheaths] = useState([]);
    const [tempSelectedCoreIds, setTempSelectedCoreIds] = useState(normalizeIds(selectedCoreIds));
    const [tempSelectedSheathIds, setTempSelectedSheathIds] = useState(normalizeIds(selectedSheathIds));
    const [loading, setLoading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Fetch cores and sheaths
    const fetchData = async () => {
        if (!quotationId) return;

        setLoading(true);
        try {
            const response = await api.get(`/quotation/get-one-quotation/${quotationId}`);
            const quotation = response.data;

            setAllCores(quotation.cores || []);
            setAllSheaths(quotation.sheathGroups || []);
        } catch (error) {
            console.error('Error fetching quotation data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [quotationId]);

    // Sync temp selections with props (normalize IDs)
    useEffect(() => {
        setTempSelectedCoreIds(normalizeIds(selectedCoreIds));
        setTempSelectedSheathIds(normalizeIds(selectedSheathIds));
        setHasUnsavedChanges(false);
    }, [selectedCoreIds, selectedSheathIds]);

    // Get available cores (not used by other sheaths)
    const getAvailableCores = () => {
        const usedCoreIds = new Set();
        allSheaths.forEach(sg => {
            // Skip current sheath
            if (sg._id === currentSheathId || sg.id === currentSheathId) return;

            (sg.coreIds || []).forEach(cid => {
                usedCoreIds.add(typeof cid === 'string' ? cid : cid._id);
            });
        });

        return allCores.filter(c => !usedCoreIds.has(c._id) && !usedCoreIds.has(c.id));
    };

    // Get available sheaths (not used by other sheaths, no circular refs)
    const getAvailableSheaths = () => {
        const usedSheathIds = new Set();
        allSheaths.forEach(sg => {
            // Skip current sheath
            if (sg._id === currentSheathId || sg.id === currentSheathId) return;

            (sg.sheathIds || []).forEach(sid => {
                usedSheathIds.add(typeof sid === 'string' ? sid : sid._id);
            });
        });

        // Also exclude self
        usedSheathIds.add(currentSheathId);

        return allSheaths.filter(sg =>
            !usedSheathIds.has(sg._id) &&
            !usedSheathIds.has(sg.id) &&
            sg._id !== currentSheathId &&
            sg.id !== currentSheathId
        );
    };

    // Calculate cumulative inner area from selected items
    const calculateCumulativeInnerArea = () => {
        let totalArea = 0;

        // Add areas from selected cores
        tempSelectedCoreIds.forEach(coreId => {
            const core = allCores.find(c => (c._id || c.id) === coreId);
            if (core && core.coreOuterAreaWithInsulation) {
                totalArea += core.coreOuterAreaWithInsulation;
            }
        });

        // Add areas from selected sheaths
        tempSelectedSheathIds.forEach(sheathId => {
            const sheath = allSheaths.find(sg => (sg._id || sg.id) === sheathId);
            if (sheath && sheath.outerArea) {
                totalArea += sheath.outerArea;
            }
        });

        return totalArea;
    };

    const toggleCore = (coreId) => {
        setTempSelectedCoreIds(prev => {
            const newSelection = prev.includes(coreId)
                ? prev.filter(id => id !== coreId)
                : [...prev, coreId];
            setHasUnsavedChanges(true);
            return newSelection;
        });
    };

    const toggleSheath = (sheathId) => {
        setTempSelectedSheathIds(prev => {
            const newSelection = prev.includes(sheathId)
                ? prev.filter(id => id !== sheathId)
                : [...prev, sheathId];
            setHasUnsavedChanges(true);
            return newSelection;
        });
    };

    const handleSave = () => {
        const cumulativeInnerArea = calculateCumulativeInnerArea();
        const innerDiameter = Math.sqrt((cumulativeInnerArea * 4) / Math.PI);

        onCoresUpdated({
            coreIds: tempSelectedCoreIds,
            sheathIds: tempSelectedSheathIds,
            innerArea: parseFloat(cumulativeInnerArea.toFixed(4)),
            innerDiameter: parseFloat(innerDiameter.toFixed(4))
        });

        setHasUnsavedChanges(false);
    };

    const availableCores = getAvailableCores();
    const availableSheaths = getAvailableSheaths();
    const cumulativeArea = calculateCumulativeInnerArea();
    const cumulativeDiameter = cumulativeArea > 0 ? Math.sqrt((cumulativeArea * 4) / Math.PI) : 0;

    if (loading) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with Refresh Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package size={16} className="text-blue-600" />
                    <h4 className="text-sm font-bold text-blue-800">Select Inner Elements</h4>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Refresh cores and sheaths"
                >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Core Selection */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <FieldLabel>Select Cores for this Sheath</FieldLabel>
                {availableCores.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No cores available. All cores are already assigned to other sheaths.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {availableCores.map((core) => {
                            const coreId = core._id || core.id;
                            const isSelected = tempSelectedCoreIds.includes(coreId);
                            return (
                                <label
                                    key={coreId}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition ${isSelected
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
                                    <div className="flex-1">
                                        <span className="text-sm font-medium block">
                                            {core.name || `Core ${core.coreNumber}`}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {core.coreOuterAreaWithInsulation?.toFixed(2) || 0} mm²
                                        </span>
                                    </div>
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
                        {availableSheaths.map((sg) => {
                            const sgId = sg._id || sg.id;
                            const isSelected = tempSelectedSheathIds.includes(sgId);
                            return (
                                <label
                                    key={sgId}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition ${isSelected
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
                                    <div className="flex-1">
                                        <span className="text-sm font-medium block">
                                            {sg.name || `Sheath ${sg.sheathNumber}`}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {sg.outerArea?.toFixed(2) || 0} mm²
                                        </span>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Cumulative Stats */}
            <div className="grid grid-cols-3 gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                <StatBox
                    label="Selected Items"
                    value={`${tempSelectedCoreIds.length}C + ${tempSelectedSheathIds.length}S`}
                    accent={false}
                />
                <StatBox
                    label="Cumulative Area"
                    value={`${cumulativeArea.toFixed(2)} mm²`}
                    accent={hasUnsavedChanges}
                />
                <StatBox
                    label="Inner Ø (calc)"
                    value={`${cumulativeDiameter.toFixed(2)} mm`}
                    accent={hasUnsavedChanges}
                />
            </div>

            {/* Save Button */}
            {hasUnsavedChanges && (
                <button
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                    <Save size={16} />
                    Save Selection to Sheath
                </button>
            )}

            {!hasUnsavedChanges && (tempSelectedCoreIds.length > 0 || tempSelectedSheathIds.length > 0) && (
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
                    <Check size={16} />
                    Selection saved
                </div>
            )}
        </div>
    );
};

export default SheathCoreSelector;
