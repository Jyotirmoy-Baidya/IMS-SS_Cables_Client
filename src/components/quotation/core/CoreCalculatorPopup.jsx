import { useState } from 'react';


const MATERIAL_DENSITY = {
    copper: 8960,
    aluminium: 2700,
    alloy: 7800,
};


const CoreCalculatorPopup = ({ onClose, onAdd, defaultValues }) => {
    const [area, setArea] = useState(defaultValues?.area || '');
    const [length, setLength] = useState(defaultValues?.length || '');
    const [material, setMaterial] = useState(defaultValues?.material || 'aluminium');

    const density = MATERIAL_DENSITY[material];

    const weight =
        area && length
            ? area * 1e-6 * length * density
            : null;

    const handleAdd = () => {
        if (!area || !length || !weight) return;

        onAdd({
            area,
            length,
            material,
            density,
            weight,
        });
    };

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />

            {/* Popup */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl">
                <div className="p-5 border-b border-emerald-200 flex justify-between">
                    <h2 className="text-lg font-semibold text-emerald-800">
                        Add Core
                    </h2>
                    <button onClick={onClose} className="text-xl">✕</button>
                </div>

                <div className="p-6 space-y-4">
                    <input
                        type="number"
                        placeholder="Area (sq mm)"
                        value={area}
                        onChange={(e) => setArea((e.target.value))}
                        className="w-full rounded-lg border px-4 py-2"
                    />

                    <input
                        type="number"
                        placeholder="Length (meters)"
                        value={length}
                        onChange={(e) => setLength((e.target.value))}
                        className="w-full rounded-lg border px-4 py-2"
                    />

                    <select
                        value={material}
                        onChange={(e) =>
                            setMaterial(e.target.value)
                        }
                        className="w-full rounded-lg border px-4 py-2"
                    >
                        <option value="copper">Copper</option>
                        <option value="aluminium">Aluminium</option>
                        <option value="alloy">Alloy</option>
                    </select>

                    {weight && (
                        <div className="rounded-xl bg-emerald-100 p-4 text-sm">
                            <p>Density: {density} kg/m³</p>
                            <p className="font-semibold">
                                Weight: {weight.toFixed(3)} kg
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleAdd}
                        className="w-full rounded-xl bg-emerald-600 py-3 text-white font-medium hover:bg-emerald-700"
                    >
                        {defaultValues ? 'Update Core' : 'Add Core'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CoreCalculatorPopup;
