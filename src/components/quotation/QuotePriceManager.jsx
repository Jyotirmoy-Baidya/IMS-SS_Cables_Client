import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingUp, Receipt, Check, X, Pencil } from 'lucide-react';
import api from '../../api/axiosInstance';

const QuotePriceManager = ({ quotationId, baseMaterialCost, baseProcessCost }) => {
    const [quotePrices, setQuotePrices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        profitMargin: 10,
        gstPercentage: 18,
        notes: '',
    });

    const baseTotalCost = (baseMaterialCost || 0) + (baseProcessCost || 0);

    // Fetch quote prices for this quotation
    const fetchQuotePrices = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/quote-price/quotation/${quotationId}`);
            console.log(response.data);
            setQuotePrices(response.data || []);
        } catch (error) {
            console.error('Error fetching quote prices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (quotationId) {
            fetchQuotePrices();
        }
    }, [quotationId]);

    // Calculate preview values
    const calculatePreview = () => {
        const profitAmount = (baseTotalCost * formData.profitMargin) / 100;
        const quoteAfterAddingProfit = baseTotalCost + profitAmount;
        const gstAmount = (quoteAfterAddingProfit * formData.gstPercentage) / 100;
        const quotePriceAfterTax = quoteAfterAddingProfit + gstAmount;

        return {
            profitAmount,
            quoteAfterAddingProfit,
            gstAmount,
            quotePriceAfterTax
        };
    };

    const preview = calculatePreview();

    // Handle create quote price
    const handleCreate = async () => {
        try {
            const profitAmount = (baseTotalCost * formData.profitMargin) / 100;
            const quoteAfterAddingProfit = baseTotalCost + profitAmount;
            const gstAmount = (quoteAfterAddingProfit * formData.gstPercentage) / 100;
            const quotePriceAfterTax = quoteAfterAddingProfit + gstAmount;
            const newQuotePrice = {
                quotation: quotationId,
                quoteBaseAmount: baseTotalCost,
                profitMargin: formData.profitMargin,
                quoteAfterAddingProfit: quoteAfterAddingProfit,
                gstPercentage: formData.gstPercentage,
                quotePriceAfterTax: quotePriceAfterTax,
                notes: formData.notes,
            };

            await api.post('/quote-price', newQuotePrice);
            await fetchQuotePrices();
            setShowForm(false);
            setFormData({
                profitMargin: 10,
                gstPercentage: 18,
                notes: '',
            });
        } catch (error) {
            console.error('Error creating quote price:', error);
            alert('Failed to create quote price: ' + (error.message || 'Unknown error'));
        }
    };

    const fmtCur = (val) => '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-t border-indigo-100">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-lg">
                            <Receipt size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Quote Pricing</h3>
                            <p className="text-xs text-gray-500">Manage margin & GST for delivery</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                    >
                        {showForm ? <X size={16} /> : <Plus size={16} />}
                        {showForm ? 'Cancel' : 'New Quote Price'}
                    </button>
                </div>

                {/* Base Costs Display */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Material Cost</p>
                        <p className="text-lg font-bold text-gray-800">{fmtCur(baseMaterialCost)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Process Cost</p>
                        <p className="text-lg font-bold text-gray-800">{fmtCur(baseProcessCost)}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                        <p className="text-xs text-indigo-600 mb-1">Total Base Cost</p>
                        <p className="text-lg font-bold text-indigo-800">{fmtCur(baseTotalCost)}</p>
                    </div>
                </div>

                {/* Create Form */}
                {showForm && (
                    <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-700 mb-4">Create New Quote Price</h4>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Profit Margin (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.profitMargin}
                                    onChange={(e) => setFormData({ ...formData, profitMargin: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                                    GST (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.gstPercentage}
                                    onChange={(e) => setFormData({ ...formData, gstPercentage: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Add any notes about this pricing..."
                            />
                        </div>

                        {/* Preview Calculation */}
                        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                            <p className="text-xs font-bold text-indigo-700 mb-3">PREVIEW</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Base Amount</span>
                                    <span className="font-semibold">{fmtCur(baseTotalCost)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-600">
                                    <span>+ Profit ({formData.profitMargin}%)</span>
                                    <span className="font-semibold">{fmtCur(preview.profitAmount)}</span>
                                </div>
                                <div className="flex justify-between border-t border-indigo-200 pt-2">
                                    <span className="text-gray-600">After Profit</span>
                                    <span className="font-semibold">{fmtCur(preview.quoteAfterAddingProfit)}</span>
                                </div>
                                <div className="flex justify-between text-amber-600">
                                    <span>+ GST ({formData.gstPercentage}%)</span>
                                    <span className="font-semibold">{fmtCur(preview.gstAmount)}</span>
                                </div>
                                <div className="flex justify-between border-t-2 border-indigo-300 pt-2 text-lg">
                                    <span className="font-bold text-indigo-800">Final Price</span>
                                    <span className="font-bold text-indigo-800">{fmtCur(preview.quotePriceAfterTax)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold flex items-center gap-2"
                            >
                                <Check size={16} />
                                Create Quote Price
                            </button>
                        </div>
                    </div>
                )}

                {/* Quote Prices List */}
                <div className="space-y-3">
                    {loading && (
                        <div className="text-center py-8 text-gray-500">
                            Loading quote prices...
                        </div>
                    )}

                    {!loading && quotePrices.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            <DollarSign size={40} className="mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500 text-sm">No quote prices yet. Create one to get started!</p>
                        </div>
                    )}

                    {!loading && quotePrices.map((qp, index) => (
                        <div
                            key={qp._id}
                            className={`bg-white rounded-lg p-5 border-2 transition-all ${qp.isFinal
                                ? 'border-emerald-400 shadow-lg shadow-emerald-100'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                                            Version {qp.version}
                                        </span>
                                        {qp.isFinal && (
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
                                                <Check size={12} />
                                                FINAL
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {new Date(qp.createdAt).toLocaleString('en-IN')}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-gray-500">Base</p>
                                            <p className="font-semibold text-gray-800">{fmtCur(qp.quoteBaseAmount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-600">Profit {qp.profitMargin}%</p>
                                            <p className="font-semibold text-emerald-700">{fmtCur(qp.profitAmount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">After Profit</p>
                                            <p className="font-semibold text-gray-800">{fmtCur(qp.quoteAfterAddingProfit)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-600">GST {qp.gstPercentage}%</p>
                                            <p className="font-semibold text-amber-700">{fmtCur((qp.quotePriceAfterTax - qp.quoteAfterAddingProfit))}</p>
                                        </div>
                                        <div className="bg-indigo-50 rounded-lg p-2">
                                            <p className="text-xs text-indigo-600">Final Price</p>
                                            <p className="font-bold text-indigo-800 text-base">{fmtCur(qp.quotePriceAfterTax)}</p>
                                        </div>
                                    </div>

                                    {qp.notes && (
                                        <div className="mt-3 text-xs text-gray-600 bg-gray-50 rounded px-3 py-2">
                                            <span className="font-semibold">Notes:</span> {qp.notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuotePriceManager;
