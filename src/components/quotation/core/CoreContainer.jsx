import { useState } from 'react';
import CoreCalculatorPopup from './CoreCalculatorPopup';

const CoreContainer = () => {
    const [cores, setCores] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [editingCore, setEditingCore] = useState(null);

    const addOrUpdateCore = (core) => {
        if (editingCore) {
            // Update existing core
            setCores((prev) =>
                prev.map((c) => (c.id === editingCore.id ? { ...core, id: c.id } : c))
            );
        } else {
            // Add new core
            setCores((prev) => [...prev, { ...core, id: Date.now() }]);
        }

        setEditingCore(null);
        setShowPopup(false);
    };

    const handleEdit = (core) => {
        setEditingCore(core);
        setShowPopup(true);
    };

    return (
        <div className="min-h-screen bg-emerald-50 p-6">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-semibold text-emerald-800">
                        Cable Core Container
                    </h1>
                    <button
                        onClick={() => {
                            setEditingCore(null);
                            setShowPopup(true);
                        }}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm font-medium hover:bg-emerald-700"
                    >
                        + Add Core
                    </button>
                </div>

                {/* What is Core */}
                <div className="mb-6 rounded-xl bg-emerald-100 p-4 text-sm text-emerald-800">
                    <p className="font-medium mb-1">What is a Core?</p>
                    <p>
                        A <strong>core</strong> is a single electrical conductor inside a cable.
                        Each core carries current and is defined by its area, length, and
                        material. Multi-core cables contain multiple such conductors.
                    </p>
                </div>

                {/* Core List */}
                {cores.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center">
                        No cores added yet
                    </p>
                ) : (
                    <div className="space-y-4">
                        {cores.map((core, index) => (
                            <div
                                key={core.id}
                                className="rounded-xl border border-emerald-200 p-4 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-medium text-emerald-800">
                                        Core {index + 1} ({core.material})
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Area: {core.area} sq mm · Length: {core.length} m
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Density: {core.density} kg/m³
                                    </p>
                                </div>

                                <div className="text-right space-y-2">
                                    <div>
                                        <p className="text-sm text-gray-500">Weight</p>
                                        <p className="text-lg font-semibold text-emerald-700">
                                            {core.weight.toFixed(3)} kg
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleEdit(core)}
                                        className="text-sm text-emerald-600 hover:underline"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Popup */}
            {showPopup && (
                <CoreCalculatorPopup
                    onClose={() => {
                        setShowPopup(false);
                        setEditingCore(null);
                    }}
                    onAdd={addOrUpdateCore}
                    defaultValues={editingCore}
                />
            )}
        </div>
    );
};

export default CoreContainer;
