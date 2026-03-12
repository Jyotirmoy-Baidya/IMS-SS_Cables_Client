import { useState } from 'react';
import { Calculator, ChevronDown, ChevronUp, Package, Zap, Info, TrendingUp } from 'lucide-react';

const fmtINR = (n) =>
    '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Row = ({ label, value, bold, muted, accent }) => (
    <div className={`flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0
        ${bold ? 'font-semibold' : ''} ${muted ? 'text-gray-400' : 'text-gray-700'}`}>
        <span className="text-sm">{label}</span>
        <span className={`text-sm tabular-nums ${accent ? 'text-blue-700 font-bold' : ''}`}>{value}</span>
    </div>
);

const SectionCard = ({ title, icon: Icon, iconColor = 'text-blue-600', children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon size={16} className={iconColor} />
                    <span className="text-sm font-semibold text-gray-700">{title}</span>
                </div>
                {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
            </button>
            {open && <div className="px-4 py-3">{children}</div>}
        </div>
    );
};

const QuotationSummary = ({ totalMaterialCost = 0, totalProcessCost = 0, totalCosting = 0 }) => {

    return (
        <div id="quotation-summary" className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">

            {/* ── Header ── */}
            <div className="bg-linear-to-r from-blue-700 to-blue-800 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Calculator size={22} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Quotation Summary</h2>
                        <p className="text-blue-200 text-xs mt-0.5">Final cost estimate for this cable configuration</p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className='flex flex-col'>
                    <div>
                        {totalMaterialCost}
                    </div>
                    <div>
                        {totalProcessCost}
                    </div>
                    <div>
                        {totalCosting}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationSummary;
