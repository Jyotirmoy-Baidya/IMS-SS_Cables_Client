import { create } from 'zustand';
import api from '../api/axiosInstance';

/**
 * Zustand store for aggregating all processes in a quotation
 * Syncs processes from cores, sheaths, and quote-level processes
 */
const useQuotationProcessStore = create((set, get) => ({
    // Aggregated list of all processes with their context
    allProcesses: [],

    // Flat list of all processes with "usedIn" info
    processesInQuotation: [],

    // Total process cost
    totalProcessCost: 0,

    // Detailed breakdown by usage
    breakdown: [],

    /**
     * Rebuild the aggregated process list from quotation data
     * Can accept either quotation ID (string) to fetch from backend, or quotation object directly
     * @param {String|Object} quotationOrId - Either quotation ID (string) or quotation object
     */
    calculateAllProcessInQuotation: async (quotationOrId) => {
        if (!quotationOrId) {
            console.error('quotationOrId is required');
            set({
                allProcesses: [],
                processesInQuotation: [],
                breakdown: [],
                totalProcessCost: 0
            });
            return [];
        }

        try {
            let quotation;

            // If string, fetch from backend; if object, use directly
            if (typeof quotationOrId === 'string') {
                const response = await api.get(`/quotation/get-one-quotation/${quotationOrId}`);
                quotation = response.data || {};
            } else {
                quotation = quotationOrId;
            }

            console.log('Processing quotation for processes:', quotation);

            const processes = [];
            const processesInQuotation = [];
            const breakdown = [];

            // 1. Collect processes from each core
            (quotation.cores || []).forEach((core, coreIndex) => {
                (core.processes || []).forEach((process) => {
                    const processData = {
                        id: process._id || `core-${coreIndex}-${process.processId}`,
                        processId: process.processId,
                        processName: process.processName,
                        category: process.category,
                        processCost: process.processCost || 0,
                        formula: process.formula,
                        formulaNote: process.formulaNote,
                        variables: process.variables || [],
                        output: process.output || {},
                        context: {
                            type: 'core',
                            coreIndex,
                            coreId: core._id,
                            label: `Core ${coreIndex + 1}`
                        }
                    };
                    processes.push(processData);

                    // Add to flat list with "usedIn"
                    processesInQuotation.push({
                        ...process,
                        usedIn: `Core - ${core.coreNumber || coreIndex + 1}`
                    });

                    // Add to breakdown
                    breakdown.push({
                        processId: process.processId,
                        processName: process.processName,
                        category: process.category,
                        processCost: process.processCost || 0,
                        output: process.output || {},
                        context: {
                            type: 'core',
                            coreIndex,
                            coreId: core._id,
                            label: `Core ${coreIndex + 1}`
                        }
                    });
                });
            });

            // 2. Collect processes from each sheath group
            (quotation.sheathGroups || []).forEach((sheath, sheathIndex) => {
                (sheath.processes || []).forEach((process) => {
                    const processData = {
                        id: process._id || `sheath-${sheathIndex}-${process.processId}`,
                        processId: process.processId,
                        processName: process.processName,
                        category: process.category,
                        processCost: process.processCost || 0,
                        formula: process.formula,
                        formulaNote: process.formulaNote,
                        variables: process.variables || [],
                        output: process.output || {},
                        context: {
                            type: 'sheath',
                            sheathIndex,
                            sheathId: sheath._id,
                            label: `Sheath Group ${sheathIndex + 1}`
                        }
                    };
                    processes.push(processData);

                    // Add to flat list with "usedIn"
                    processesInQuotation.push({
                        ...process,
                        usedIn: `Sheath - ${sheath.sheathNumber || sheathIndex + 1}`
                    });

                    // Add to breakdown
                    breakdown.push({
                        processId: process.processId,
                        processName: process.processName,
                        category: process.category,
                        processCost: process.processCost || 0,
                        output: process.output || {},
                        context: {
                            type: 'sheath',
                            sheathIndex,
                            sheathId: sheath._id,
                            label: `Sheath Group ${sheathIndex + 1}`
                        }
                    });
                });
            });

            // 3. Collect quote-level processes (not tied to specific core/sheath)
            (quotation.quoteProcesses || []).forEach((process, idx) => {
                const processData = {
                    id: process._id || `quote-${idx}-${process.processId}`,
                    processId: process.processId,
                    processName: process.processName,
                    category: process.category,
                    processCost: process.processCost || 0,
                    formula: process.formula,
                    formulaNote: process.formulaNote,
                    variables: process.variables || [],
                    output: process.output || {},
                    context: {
                        type: 'quote',
                        label: 'Cable Level'
                    }
                };
                processes.push(processData);

                // Add to flat list with "usedIn"
                processesInQuotation.push({
                    ...process,
                    usedIn: 'Quote Level'
                });

                // Add to breakdown
                breakdown.push({
                    processId: process.processId,
                    processName: process.processName,
                    category: process.category,
                    processCost: process.processCost || 0,
                    output: process.output || {},
                    context: {
                        type: 'quote',
                        label: 'Cable Level'
                    }
                });
            });

            // Calculate total process cost
            const totalProcessCost = processesInQuotation.reduce(
                (sum, process) => sum + (process.processCost || 0),
                0
            );

            console.log("all processes", processes);
            set({
                allProcesses: processes,
                processesInQuotation,
                breakdown,
                totalProcessCost
            });

            return processesInQuotation;
        } catch (error) {
            console.error('Error fetching quotation or calculating processes:', error);
            set({
                allProcesses: [],
                processesInQuotation: [],
                breakdown: [],
                totalProcessCost: 0
            });
            return [];
        }
    },

    /**
     * Get all processes grouped by category
     */
    getProcessesByCategory: () => {
        const { allProcesses } = get();
        return allProcesses.reduce((acc, proc) => {
            const cat = proc.category || 'general';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(proc);
            return acc;
        }, {});
    },

    /**
     * Get total process count
     */
    getTotalProcessCount: () => {
        return get().allProcesses.length;
    },

    /**
     * Get processes by context type
     */
    getProcessesByContext: (contextType) => {
        return get().allProcesses.filter(p => p.context.type === contextType);
    },

    /**
     * Clear all processes
     */
    clear: () => {
        set({
            allProcesses: [],
            processesInQuotation: [],
            breakdown: [],
            totalProcessCost: 0
        });
    }
}));

export default useQuotationProcessStore;
