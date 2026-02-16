import { useState } from 'react';

const ALUMINIUM_RESISTIVITY = 28.264;
const LENGTH_IN_METER = 1;

const CrValueAreaCalculator = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [crValue, setCrValue] = useState('');

    const area =
        crValue && crValue > 0
            ? (ALUMINIUM_RESISTIVITY * LENGTH_IN_METER) / crValue
            : null;

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-emerald-700 transition"
            >
                Area<br />Calc
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                />
            )}

            {/* Popup Panel */}
            <div
                className={`fixed top-0 right-0 z-50 h-full w-full max-w-md transform bg-gradient-to-br from-green-100 to-emerald-50 shadow-2xl transition-transform duration-300
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex items-center justify-between p-5 border-b border-emerald-200">
                    <h2 className="text-lg font-semibold text-emerald-800">
                        Wire Area Calculator
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-emerald-700 hover:text-emerald-900 text-xl"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Input */}
                    <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-1">
                            CR Value (Ohms)
                        </label>
                        <input
                            type="number"
                            placeholder="Enter resistance value"
                            value={crValue}
                            onChange={(e) =>
                                setCrValue(e.target.value === '' ? '' : Number(e.target.value))
                            }
                            className="w-full rounded-lg border border-emerald-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                    </div>

                    {/* Info */}
                    <div className="rounded-xl bg-emerald-100 p-4 text-sm text-emerald-800 space-y-1">
                        <p><span className="font-medium">Material:</span> Aluminium</p>
                        <p><span className="font-medium">Resistivity:</span> 28.264</p>
                        <p><span className="font-medium">Length:</span> 1 meter</p>
                    </div>

                    {/* Result */}
                    {area && (
                        <div className="flex items-center justify-between rounded-xl bg-emerald-600 px-5 py-4 text-white">
                            <span className="text-sm">Required Wire Area</span>
                            <span className="text-lg font-semibold">
                                {area.toFixed(3)} mm²
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CrValueAreaCalculator;
