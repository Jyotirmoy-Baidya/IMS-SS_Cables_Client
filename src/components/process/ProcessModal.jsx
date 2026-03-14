import { useState, useEffect } from 'react';
import { Plus, Trash2, Image } from 'lucide-react';

const SOURCE_OPTIONS = [
    { value: 'manual', label: 'Manual input (user fills in quotation)' },

    // Cable-level variables
    { value: 'cableLength', label: 'Cable Length (m) — from quote' },
    { value: 'coreCount', label: 'Core Count — from quote' },
    { value: 'totalWireCount', label: 'Total Wire Count — sum of all cores' },
    { value: 'totalDrawingLength', label: 'Total Drawing Length (m) — sum of all cores' },
    { value: 'totalMaterialWeight', label: 'Total Metal Weight (kg) — sum of all cores' },
    { value: 'totalCoreArea', label: 'Total Core Area (mm²) — sum of all cores' },

    // Core-specific length
    { value: 'coreLength', label: 'Core Length (m) — individual core length (defaults to cable length)' },

    // Core conductor variables
    { value: 'coreMaterialDensity', label: 'Core Material Density (g/cm³) — from specific core' },
    { value: 'areaPerWire', label: 'Area Of Each Wire In Core — from specific core' },
    { value: 'coreWireCount', label: 'Core Wire Count — from specific core' },
    { value: 'coreWastagePercent', label: 'Core Wastage % — from specific core' },
    { value: 'coreHasAnnealing', label: 'Core Has Annealing (0/1) — from specific core' },

    // Core insulation variables
    { value: 'insulationDensity', label: 'Insulation Density (g/cm³) — from specific core' },
    { value: 'insulationThickness', label: 'Insulation Thickness (mm) — from specific core' },
    { value: 'insulationFreshPercent', label: 'Insulation Fresh % — from specific core' },
    { value: 'insulationReprocessPercent', label: 'Insulation Reprocess % — from specific core' },
    { value: 'insulationFreshPricePerKg', label: 'Insulation Fresh Price (₹/kg) — from specific core' },
    { value: 'insulationReprocessPricePerKg', label: 'Insulation Reprocess Price (₹/kg) — from specific core' },

    // Sheath variables
    { value: 'sheathDensity', label: 'Sheath Density (g/cm³) — from specific sheath' },
    { value: 'sheathThickness', label: 'Sheath Thickness (mm) — from specific sheath' },
    { value: 'sheathFreshPercent', label: 'Sheath Fresh % — from specific sheath' },
    { value: 'sheathReprocessPercent', label: 'Sheath Reprocess % — from specific sheath' },
    { value: 'sheathFreshPricePerKg', label: 'Sheath Fresh Price (₹/kg) — from specific sheath' },
    { value: 'sheathReprocessPricePerKg', label: 'Sheath Reprocess Price (₹/kg) — from specific sheath' },

    // Calculated values
    { value: 'wireDiameter', label: 'Wire Diameter (mm) — calculated' },
    { value: 'conductorDiameter', label: 'Conductor Diameter (mm) — calculated' },
    { value: 'insulatedDiameter', label: 'Insulated Diameter (mm) — calculated' },
    { value: 'drawingLength', label: 'Drawing Length (m) — calculated' },
    { value: 'materialWeight', label: 'Material Weight (kg) — calculated' },
    { value: 'insulationWeight', label: 'Insulation Weight (kg) — calculated' },
    { value: 'sheathWeight', label: 'Sheath Weight (kg) — calculated' },
];

const CATEGORY_OPTIONS = [
    { value: 'conductor', label: 'Conductor' },
    { value: 'insulation', label: 'Insulation' },
    { value: 'sheathing', label: 'Sheathing' },
    { value: 'general', label: 'General' },
];

const EMPTY_VARIABLE = { name: '', label: '', unit: '', source: 'manual', defaultValue: 0 };

const evaluatePreview = (formula, variables) => {
    try {
        const scope = {};
        variables.forEach(v => { scope[v.name || '_'] = parseFloat(v.defaultValue) || 0; });
        if (!formula.trim()) return null;
        // eslint-disable-next-line no-new-func
        const fn = new Function(...Object.keys(scope), `return (${formula})`);
        const result = fn(...Object.values(scope));
        return typeof result === 'number' && isFinite(result) ? result.toFixed(4) : 'error';
    } catch {
        return 'error';
    }
};

const ProcessModal = ({ open, onClose, onSuccess, process: editProcess }) => {
    const [form, setForm] = useState({
        name: '', description: '', category: 'general',
        formula: '', formulaNote: '',
        variables: [],
        output: {
            outputType: 'none',
            quantityFormula: '',
            itemNameTemplate: '',
            specificationTemplate: '',
            unit: 'm'
        },
        isActive: true
    });

    useEffect(() => {
        if (editProcess) {
            setForm({
                name: editProcess.name || '',
                description: editProcess.description || '',
                category: editProcess.category || 'general',
                formula: editProcess.formula || '',
                formulaNote: editProcess.formulaNote || '',
                variables: editProcess.variables ? editProcess.variables.map(v => ({ ...v })) : [],
                output: editProcess.output ? {
                    outputType: editProcess.output.outputType || 'none',
                    quantityFormula: editProcess.output.quantityFormula || '',
                    itemNameTemplate: editProcess.output.itemNameTemplate || '',
                    specificationTemplate: editProcess.output.specificationTemplate || '',
                    unit: editProcess.output.unit || 'm'
                } : {
                    outputType: 'none',
                    quantityFormula: '',
                    itemNameTemplate: '',
                    specificationTemplate: '',
                    unit: 'm'
                },
                isActive: editProcess.isActive !== false
            });
        } else {
            setForm({
                name: '', description: '', category: 'general',
                formula: '', formulaNote: '', variables: [],
                output: {
                    outputType: 'none',
                    quantityFormula: '',
                    itemNameTemplate: '',
                    specificationTemplate: '',
                    unit: 'm'
                },
                isActive: true
            });
        }
    }, [editProcess, open]);

    if (!open) return null;

    const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const setOutputField = (field, value) => setForm(f => ({ ...f, output: { ...f.output, [field]: value } }));

    const addVariable = () => setForm(f => ({ ...f, variables: [...f.variables, { ...EMPTY_VARIABLE }] }));

    const updateVariable = (i, field, value) =>
        setForm(f => ({
            ...f,
            variables: f.variables.map((v, idx) => idx === i ? { ...v, [field]: value } : v)
        }));

    const removeVariable = (i) =>
        setForm(f => ({ ...f, variables: f.variables.filter((_, idx) => idx !== i) }));

    const preview = evaluatePreview(form.formula, form.variables);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.formula.trim()) return;
        onSuccess(form);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-4">
                {/* Header */}
                <div className="border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        {editProcess ? 'Edit Process' : 'Add Process'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Process Name *</label>
                            <input
                                type="text" required
                                value={form.name}
                                onChange={e => setField('name', e.target.value)}
                                placeholder="e.g. Drawing, Annealing, Stranding"
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select
                                value={form.category}
                                onChange={e => setField('category', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                                {CATEGORY_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={e => setField('description', e.target.value)}
                                placeholder="Brief description of this process"
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            />
                        </div>
                    </div>

                    {/* Image Upload Placeholder */}
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center gap-3 bg-gray-50">
                        <Image size={28} className="text-gray-300 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Process Image</p>
                            <p className="text-xs text-gray-400">Cloudinary upload — coming soon</p>
                        </div>
                    </div>

                    {/* Formula */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Formula *
                            <span className="ml-2 text-xs text-gray-400 font-normal">use variable names defined below</span>
                        </label>
                        <input
                            type="text" required
                            value={form.formula}
                            onChange={e => setField('formula', e.target.value)}
                            placeholder="e.g.  totalDrawingLength * ratePerMeter"
                            className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                        />
                        {preview !== null && (
                            <p className={`text-xs mt-1 ${preview === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                                Preview (using default values): {preview === 'error' ? 'formula error' : `= ${preview}`}
                            </p>
                        )}
                        <div className="mt-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Formula note (optional)</label>
                            <input
                                type="text"
                                value={form.formulaNote}
                                onChange={e => setField('formulaNote', e.target.value)}
                                placeholder="e.g. Drawing length × rate per meter"
                                className="w-full px-3 py-2 border rounded-md text-xs text-gray-600"
                            />
                        </div>
                    </div>

                    {/* Variables */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Formula Variables</label>
                            <button
                                type="button"
                                onClick={addVariable}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-700"
                            >
                                <Plus size={12} /> Add Variable
                            </button>
                        </div>

                        {form.variables.length === 0 && (
                            <p className="text-xs text-gray-400 italic">No variables yet. Click "Add Variable" to define the formula inputs.</p>
                        )}

                        <div className="space-y-2">
                            {form.variables.map((v, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 items-start bg-gray-50 p-2 rounded border">
                                    <div className="col-span-2">
                                        <label className="block text-xs text-gray-500 mb-0.5">Name *</label>
                                        <input
                                            type="text" required={form.variables.length > 0}
                                            value={v.name}
                                            onChange={e => updateVariable(i, 'name', e.target.value.replace(/\s/g, ''))}
                                            placeholder="ratePerMeter"
                                            className="w-full px-2 py-1 border rounded text-xs font-mono"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs text-gray-500 mb-0.5">Label *</label>
                                        <input
                                            type="text" required={form.variables.length > 0}
                                            value={v.label}
                                            onChange={e => updateVariable(i, 'label', e.target.value)}
                                            placeholder="Rate per Meter (₹/m)"
                                            className="w-full px-2 py-1 border rounded text-xs"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs text-gray-500 mb-0.5">Unit</label>
                                        <input
                                            type="text"
                                            value={v.unit}
                                            onChange={e => updateVariable(i, 'unit', e.target.value)}
                                            placeholder="₹/m"
                                            className="w-full px-2 py-1 border rounded text-xs"
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <label className="block text-xs text-gray-500 mb-0.5">Source</label>
                                        <select
                                            value={v.source}
                                            onChange={e => updateVariable(i, 'source', e.target.value)}
                                            className="w-full px-2 py-1 border rounded text-xs"
                                        >
                                            {SOURCE_OPTIONS.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs text-gray-500 mb-0.5">Default</label>
                                        <input
                                            type="number" step="any"
                                            value={v.defaultValue}
                                            onChange={e => updateVariable(i, 'defaultValue', parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1 border rounded text-xs"
                                        />
                                    </div>
                                    <div className="col-span-1 flex items-end justify-center pb-0.5">
                                        <button
                                            type="button"
                                            onClick={() => removeVariable(i)}
                                            className="p-1 text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Output Configuration */}
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold mb-3 text-gray-700">Output Configuration</h3>

                        <div className="space-y-3">
                            {/* Output Type */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Output Type</label>
                                <select
                                    value={form.output.outputType}
                                    onChange={e => setOutputField('outputType', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                >
                                    <option value="none">None (no product output)</option>
                                    <option value="intermediate">Intermediate Product (WIP)</option>
                                    <option value="final">Final Product</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {form.output.outputType === 'none' && 'This process does not produce any trackable output'}
                                    {form.output.outputType === 'intermediate' && 'Output will be tracked as work-in-progress inventory'}
                                    {form.output.outputType === 'final' && 'Output is the finished product ready for delivery'}
                                </p>
                            </div>

                            {/* Show output fields only if outputType is not 'none' */}
                            {form.output.outputType !== 'none' && (
                                <>
                                    {/* Quantity Formula */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Quantity Formula
                                            <span className="ml-2 text-xs text-gray-400 font-normal">use variable names</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.output.quantityFormula}
                                            onChange={e => setOutputField('quantityFormula', e.target.value)}
                                            placeholder="e.g. coreLength * 1.05"
                                            className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Formula to calculate output quantity (e.g., length, weight)
                                        </p>
                                    </div>

                                    {/* Unit */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Output Unit</label>
                                        <input
                                            type="text"
                                            value={form.output.unit}
                                            onChange={e => setOutputField('unit', e.target.value)}
                                            placeholder="e.g. m, kg, pcs"
                                            className="w-full px-3 py-2 border rounded-md text-sm"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Unit of measurement for output quantity
                                        </p>
                                    </div>

                                    {/* Item Name Template */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Item Name Template
                                            <span className="ml-2 text-xs text-gray-400 font-normal">use ${'{'}varName{'}'} for variables</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.output.itemNameTemplate}
                                            onChange={e => setOutputField('itemNameTemplate', e.target.value)}
                                            placeholder="e.g. Drawn ${'{'}coreTotalCoreArea{'}'}sq mm wire"
                                            className="w-full px-3 py-2 border rounded-md text-sm"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Template for generating item name. Variables: ${'{'}varName{'}'}
                                        </p>
                                    </div>

                                    {/* Specification Template */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Specification Template
                                            <span className="ml-2 text-xs text-gray-400 font-normal">use ${'{'}varName{'}'} for variables</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.output.specificationTemplate}
                                            onChange={e => setOutputField('specificationTemplate', e.target.value)}
                                            placeholder="e.g. ${'{'}coreTotalCoreArea{'}'} sq mm, ${'{'}coreWireCount{'}'} wires, ${'{'}coreLength{'}'}m"
                                            className="w-full px-3 py-2 border rounded-md text-sm"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Template for generating specifications. Variables: ${'{'}varName{'}'}
                                        </p>
                                    </div>

                                    {/* Example Preview */}
                                    {form.output.itemNameTemplate && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                            <p className="text-xs font-semibold text-blue-700 mb-1">Example Output:</p>
                                            <p className="text-sm text-blue-900 font-medium">
                                                Item: {form.output.itemNameTemplate.replace(/\$\{(\w+)\}/g, (_, v) => `[${v}]`)}
                                            </p>
                                            {form.output.specificationTemplate && (
                                                <p className="text-xs text-blue-800 mt-1">
                                                    Spec: {form.output.specificationTemplate.replace(/\$\{(\w+)\}/g, (_, v) => `[${v}]`)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox" id="isActive"
                            checked={form.isActive}
                            onChange={e => setField('isActive', e.target.checked)}
                            className="w-4 h-4"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium">Active (available in quotations)</label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-700">
                            {editProcess ? 'Save Changes' : 'Create Process'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProcessModal;
