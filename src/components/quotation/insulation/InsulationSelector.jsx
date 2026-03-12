import { useState, useEffect } from 'react';
import api from '../../../utils/axiosInstance.js';

const FieldLabel = ({ children }) => (
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {children}
    </label>
);

const SelectField = ({ children, className = '', ...props }) => (
    <select
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-colors ${className}`}
        {...props}
    >
        {children}
    </select>
);

const InputField = ({ className = '', ...props }) => (
    <input
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-colors ${className}`}
        {...props}
    />
);

const InsulationSelector = ({ core, onUpdate }) => {
    const [insulationTypes, setInsulationTypes] = useState([]);
    const [freshMaterials, setFreshMaterials] = useState([]);
    const [reprocessMaterials, setReprocessMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch insulation types on mount
    useEffect(() => {
        const fetchInsulationTypes = async () => {
            try {
                setLoading(true);
                const response = await api.get('/raw-material-type/get-all-types?category=plastic,insulation');
                setInsulationTypes(response.data || []);
            } catch (error) {
                console.error('Error fetching insulation types:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInsulationTypes();
    }, []);

    // Fetch fresh materials when fresh type is selected
    useEffect(() => {
        if (!core?.insulation?.freshMaterialTypeId) {
            setFreshMaterials([]);
            return;
        }

        const fetchFreshMaterials = async () => {
            try {
                const response = await api.get(`/raw-material/get-by-type/${core.insulation.freshMaterialTypeId}`);
                setFreshMaterials(response.data || []);
            } catch (error) {
                console.error('Error fetching fresh materials:', error);
                setFreshMaterials([]);
            }
        };

        fetchFreshMaterials();
    }, [core?.insulation?.freshMaterialTypeId]);

    // Fetch reprocess materials when reprocess type is selected
    useEffect(() => {
        if (!core?.insulation?.reprocessMaterialTypeId) {
            setReprocessMaterials([]);
            return;
        }

        const fetchReprocessMaterials = async () => {
            try {
                const response = await api.get(`/raw-material/get-by-type/${core.insulation.reprocessMaterialTypeId}`);
                setReprocessMaterials(response.data || []);
            } catch (error) {
                console.error('Error fetching reprocess materials:', error);
                setReprocessMaterials([]);
            }
        };

        fetchReprocessMaterials();
    }, [core?.insulation?.reprocessMaterialTypeId]);

    // Handle fresh type selection
    const handleFreshTypeSelect = (typeId) => {
        const selectedType = insulationTypes.find(t => t._id === typeId);
        onUpdate({
            ...core.insulation,
            freshMaterialTypeId: typeId || null,
            freshMaterialTypeName: selectedType?.name || '',
            freshDensity: selectedType?.density || 0,
            freshMaterialId: null,
            freshMaterialName: ''
        });
    };

    // Handle fresh material selection
    const handleFreshMaterialSelect = (materialId) => {
        const selectedMaterial = freshMaterials.find(m => m._id === materialId);
        onUpdate({
            ...core.insulation,
            freshMaterialId: materialId || null,
            freshMaterialName: selectedMaterial?.name || ''
        });
    };

    // Handle reprocess type selection
    const handleReprocessTypeSelect = (typeId) => {
        const selectedType = insulationTypes.find(t => t._id === typeId);
        onUpdate({
            ...core.insulation,
            reprocessMaterialTypeId: typeId || null,
            reprocessMaterialTypeName: selectedType?.name || '',
            reprocessDensity: selectedType?.density || 0,
            reprocessMaterialId: null,
            reprocessMaterialName: ''
        });
    };

    // Handle reprocess material selection
    const handleReprocessMaterialSelect = (materialId) => {
        const selectedMaterial = reprocessMaterials.find(m => m._id === materialId);
        onUpdate({
            ...core.insulation,
            reprocessMaterialId: materialId || null,
            reprocessMaterialName: selectedMaterial?.name || ''
        });
    };

    // Handle fresh/reprocess percentage slider
    const handlePercentageChange = (freshPercent) => {
        const freshVal = Math.max(0, Math.min(100, freshPercent));
        onUpdate({
            ...core.insulation,
            freshPercent: freshVal,
            reprocessPercent: 100 - freshVal
        });
    };

    // Handle other field updates
    const handleFieldUpdate = (field, value) => {
        onUpdate({
            ...core.insulation,
            [field]: value
        });
    };

    if (loading) {
        return (
            <div className="px-4 pt-3 pb-4 bg-white">
                <p className="text-sm text-gray-500">Loading insulation options...</p>
            </div>
        );
    }

    const insulation = core?.insulation || {};

    return (
        <div className="px-4 pt-3 pb-4 bg-white space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Fresh Type */}
                <div className="md:col-span-2">
                    <FieldLabel>Fresh Material Type</FieldLabel>
                    <SelectField
                        value={insulation.freshMaterialTypeId || ''}
                        onChange={e => handleFreshTypeSelect(e.target.value)}
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
                        value={insulation.freshMaterialId || ''}
                        onChange={e => handleFreshMaterialSelect(e.target.value)}
                        disabled={!insulation.freshMaterialTypeId}
                    >
                        <option value="">— Select Raw Material —</option>
                        {freshMaterials.map(mat => (
                            <option key={mat._id} value={mat._id}>
                                {mat.name} | Code: {mat.materialCode} | Stock: {mat.inventory?.totalWeight?.toFixed(1) || 0} kg | ₹{mat.inventory?.avgPricePerKg?.toFixed(2) || 0}/kg
                            </option>
                        ))}
                    </SelectField>
                    {!insulation.freshMaterialTypeId && (
                        <p className="text-xs text-gray-400 mt-1">Select material type first</p>
                    )}
                    {insulation.freshMaterialTypeId && freshMaterials.length === 0 && (
                        <p className="text-xs text-orange-500 mt-1">No raw materials found for this type</p>
                    )}
                </div>

                {/* Fresh Density */}
                <div>
                    <FieldLabel>Fresh Density (g/cm³)</FieldLabel>
                    <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                        {insulation.freshDensity || 0}
                    </div>
                </div>

                {/* Fresh % - Auto-adjusts Reprocess % */}
                <div className="md:col-span-3">
                    <FieldLabel>
                        Fresh / Reprocess Mix
                        <span className="ml-2 text-emerald-600 font-normal">{insulation.freshPercent || 100}% fresh</span>
                        <span className="mx-1 text-gray-400">/</span>
                        <span className="text-purple-600 font-normal">{insulation.reprocessPercent || 0}% reprocess</span>
                    </FieldLabel>
                    <div className="space-y-2">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={insulation.freshPercent || 100}
                            onChange={e => handlePercentageChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gradient-to-r from-emerald-200 via-emerald-300 to-purple-300 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #10b981 0%, #10b981 ${insulation.freshPercent || 100}%, #a855f7 ${insulation.freshPercent || 100}%, #a855f7 100%)`
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
                        value={insulation.reprocessMaterialTypeId || ''}
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
                    {insulation.reprocessMaterialTypeId && (
                        <p className="text-xs text-purple-600 mt-1">
                            Reprocess stock: <strong>{insulation.reprocessMaterialTypeName}</strong>
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
                        value={insulation.reprocessMaterialId || ''}
                        onChange={e => handleReprocessMaterialSelect(e.target.value)}
                        disabled={!insulation.reprocessMaterialTypeId}
                        className="border-purple-200 focus:ring-purple-300 focus:border-purple-400"
                    >
                        <option value="">— Select Reprocess Raw Material —</option>
                        {reprocessMaterials.map(mat => (
                            <option key={mat._id} value={mat._id}>
                                {mat.name} | Code: {mat.materialCode} | Reprocess: {mat.reprocessInventory?.totalWeight?.toFixed(1) || 0} kg | ₹{mat.reprocessInventory?.pricePerKg?.toFixed(2) || 0}/kg
                            </option>
                        ))}
                    </SelectField>
                    {!insulation.reprocessMaterialTypeId && (
                        <p className="text-xs text-gray-400 mt-1">Select reprocess type first</p>
                    )}
                    {insulation.reprocessMaterialTypeId && reprocessMaterials.length === 0 && (
                        <p className="text-xs text-orange-500 mt-1">No reprocess materials found for this type</p>
                    )}
                </div>

                {/* Thickness */}
                <div>
                    <FieldLabel>Thickness (mm)</FieldLabel>
                    <InputField
                        type="number"
                        step="0.1"
                        value={insulation.thickness || 0}
                        onChange={e => handleFieldUpdate('thickness', parseFloat(e.target.value) || 0)}
                    />
                </div>

                {/* Wastage % */}
                <div>
                    <FieldLabel>Wastage (%)</FieldLabel>
                    <InputField
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={insulation.wastagePercent || 0}
                        onChange={e => handleFieldUpdate('wastagePercent', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                    />
                </div>
            </div>
        </div>
    );
};

export default InsulationSelector;
