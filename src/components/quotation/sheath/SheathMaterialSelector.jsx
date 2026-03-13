import React, { useState, useEffect } from 'react';
import { Package, Check } from 'lucide-react';
import api from '../../../api/axiosInstance';

const FieldLabel = ({ children }) => (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{children}</label>
);

const SelectField = ({ className = '', children, ...props }) => (
    <select
        {...props}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition ${className}`}
    >
        {children}
    </select>
);

const InputField = ({ className = '', ...props }) => (
    <input
        {...props}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition ${className}`}
    />
);

/**
 * SheathMaterialSelector Component
 * Handles selection of fresh and reprocess materials for sheath
 */
const SheathMaterialSelector = ({ sheath, onUpdate }) => {
    const [sheathTypes, setSheathTypes] = useState([]);
    const [freshMaterials, setFreshMaterials] = useState([]);
    const [reprocessMaterials, setReprocessMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch sheath material types (plastic/insulation categories)
    useEffect(() => {
        const fetchSheathTypes = async () => {
            try {
                setLoading(true);
                const response = await api.get('/material-type/get-all-material-types?category=plastic,insulation');
                setSheathTypes(response.data || []);
            } catch (error) {
                console.error('Error fetching sheath types:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSheathTypes();
    }, []);

    // Fetch fresh materials when fresh material type is selected
    useEffect(() => {
        if (!sheath.freshMaterialTypeId) {
            setFreshMaterials([]);
            return;
        }

        const fetchFreshMaterials = async () => {
            try {
                const response = await api.get(`/raw-material/get-by-type/${sheath.freshMaterialTypeId}`);
                setFreshMaterials(response.data || []);
            } catch (error) {
                console.error('Error fetching fresh materials:', error);
                setFreshMaterials([]);
            }
        };

        fetchFreshMaterials();
    }, [sheath.freshMaterialTypeId]);

    // Fetch reprocess materials when reprocess material type is selected
    useEffect(() => {
        if (!sheath.reprocessMaterialTypeId) {
            setReprocessMaterials([]);
            return;
        }

        const fetchReprocessMaterials = async () => {
            try {
                const response = await api.get(`/raw-material/get-by-type/${sheath.reprocessMaterialTypeId}`);
                setReprocessMaterials(response.data || []);
            } catch (error) {
                console.error('Error fetching reprocess materials:', error);
                setReprocessMaterials([]);
            }
        };

        fetchReprocessMaterials();
    }, [sheath.reprocessMaterialTypeId]);

    const handleFreshTypeSelect = (typeId) => {
        if (!typeId) {
            onUpdate({
                freshMaterialTypeId: null,
                freshMaterialId: null,
                freshSheathDensity: 1.4
            });
            return;
        }
        const type = sheathTypes.find(t => t._id === typeId);
        if (!type) return;
        console.log(type);
        onUpdate({
            freshMaterialTypeId: typeId,
            freshMaterialId: null,
            freshSheathDensity: type.density || 1.4
        });
    };

    const handleFreshMaterialSelect = (materialId) => {
        onUpdate({ freshMaterialId: materialId || null });
    };

    const handleReprocessTypeSelect = (typeId) => {
        if (!typeId) {
            onUpdate({
                reprocessMaterialTypeId: null,
                reprocessMaterialId: null,
                reprocessSheathDensity: 1.4
            });
            return;
        }
        const type = sheathTypes.find(t => t._id === typeId);
        if (!type) return;

        onUpdate({
            reprocessMaterialTypeId: typeId,
            reprocessMaterialId: null,
            reprocessSheathDensity: type.density || 1.4
        });
    };

    const handleReprocessMaterialSelect = (materialId) => {
        onUpdate({ reprocessMaterialId: materialId || null });
    };

    if (loading) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Fresh Material Section */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Package size={16} className="text-emerald-600" />
                    <h4 className="text-sm font-bold text-emerald-800">Fresh Material</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <FieldLabel>Material Type</FieldLabel>
                        <SelectField
                            value={sheath.freshMaterialTypeId || ''}
                            onChange={(e) => handleFreshTypeSelect(e.target.value)}
                        >
                            <option value="">-- Select Type --</option>
                            {sheathTypes.map(type => (
                                <option key={type._id} value={type._id}>
                                    {type.name} (ρ={type.density})
                                </option>
                            ))}
                        </SelectField>
                    </div>
                    <div>
                        <FieldLabel>Material</FieldLabel>
                        <SelectField
                            value={sheath.freshMaterialId || ''}
                            onChange={(e) => handleFreshMaterialSelect(e.target.value)}
                            disabled={!sheath.freshMaterialTypeId}
                        >
                            <option value="">-- Select Material --</option>
                            {freshMaterials.map(mat => (
                                <option key={mat._id} value={mat._id}>
                                    {mat.name}
                                </option>
                            ))}
                        </SelectField>
                    </div>
                </div>

                {/* Fresh Percentage and Density */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                        <FieldLabel>Fresh % (0-100)</FieldLabel>
                        <InputField
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={sheath.freshSheathPercent || 100}
                            onChange={(e) => {
                                const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                                onUpdate({
                                    freshSheathPercent: val,
                                    reprocessSheathPercent: 100 - val
                                });
                            }}
                        />
                    </div>
                    <div>
                        <FieldLabel>Density (g/cm³)</FieldLabel>
                        <InputField
                            type="number"
                            step="0.01"
                            value={sheath.freshSheathDensity || 1.4}
                            onChange={(e) => onUpdate({ freshSheathDensity: parseFloat(e.target.value) || 1.4 })}
                        />
                    </div>
                </div>
            </div>

            {/* Reprocess Material Section */}
            {sheath.reprocessSheathPercent > 0 && (
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Package size={16} className="text-purple-600" />
                        <h4 className="text-sm font-bold text-purple-800">Reprocess Material</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <FieldLabel>Material Type</FieldLabel>
                            <SelectField
                                value={sheath.reprocessMaterialTypeId || ''}
                                onChange={(e) => handleReprocessTypeSelect(e.target.value)}
                            >
                                <option value="">-- Same as Fresh --</option>
                                {sheathTypes.map(type => (
                                    <option key={type._id} value={type._id}>
                                        {type.name} (ρ={type.density})
                                    </option>
                                ))}
                            </SelectField>
                        </div>
                        <div>
                            <FieldLabel>Material</FieldLabel>
                            <SelectField
                                value={sheath.reprocessMaterialId || ''}
                                onChange={(e) => handleReprocessMaterialSelect(e.target.value)}
                                disabled={!sheath.reprocessMaterialTypeId}
                            >
                                <option value="">-- Same as Fresh --</option>
                                {reprocessMaterials.map(mat => (
                                    <option key={mat._id} value={mat._id}>
                                        {mat.name}
                                    </option>
                                ))}
                            </SelectField>
                        </div>
                    </div>

                    {/* Reprocess Percentage and Density */}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                            <FieldLabel>Reprocess % (0-100)</FieldLabel>
                            <InputField
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={sheath.reprocessSheathPercent || 0}
                                onChange={(e) => {
                                    const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                                    onUpdate({
                                        reprocessSheathPercent: val,
                                        freshSheathPercent: 100 - val
                                    });
                                }}
                            />
                        </div>
                        <div>
                            <FieldLabel>Density (g/cm³)</FieldLabel>
                            <InputField
                                type="number"
                                step="0.01"
                                value={sheath.reprocessSheathDensity || 1.4}
                                onChange={(e) => onUpdate({ reprocessSheathDensity: parseFloat(e.target.value) || 1.4 })}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Fresh/Reprocess Mix Slider */}
            <div>
                <FieldLabel>
                    Fresh / Reprocess Mix
                    <span className="ml-2 text-emerald-600 font-normal">{sheath.freshSheathPercent || 100}% fresh</span>
                    <span className="mx-1 text-gray-400">/</span>
                    <span className="text-purple-600 font-normal">{sheath.reprocessSheathPercent || 0}% reprocess</span>
                </FieldLabel>
                <div className="space-y-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={sheath.freshSheathPercent || 100}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onUpdate({
                                freshSheathPercent: val,
                                reprocessSheathPercent: 100 - val
                            });
                        }}
                        className="w-full h-2 bg-gradient-to-r from-emerald-200 via-emerald-300 to-purple-300 rounded-lg appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${sheath.freshSheathPercent || 100}%, #a855f7 ${sheath.freshSheathPercent || 100}%, #a855f7 100%)`
                        }}
                    />
                    <div className="flex justify-between text-xs">
                        <span className="text-emerald-600 font-medium">100% Fresh</span>
                        <span className="text-gray-500">50/50</span>
                        <span className="text-purple-600 font-medium">100% Reprocess</span>
                    </div>
                </div>
            </div>

            {/* Wastage */}
            <div>
                <FieldLabel>Wastage %</FieldLabel>
                <InputField
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={sheath.wastageSheathPercent || 0}
                    onChange={(e) => onUpdate({ wastageSheathPercent: parseFloat(e.target.value) || 0 })}
                />
            </div>
        </div>
    );
};

export default SheathMaterialSelector;
