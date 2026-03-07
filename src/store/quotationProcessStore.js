import { create } from 'zustand';

/**
 * Zustand store for aggregating all processes in a quotation
 * Syncs processes from cores, sheaths, and quote-level processes
 */
const useQuotationProcessStore = create((set, get) => ({
    // Aggregated list of all processes with their context
    allProcesses: [],

    /**
     * Rebuild the aggregated process list from quotation data
     * @param {Object} quotation - { cores, sheathGroups, quoteProcesses }
     */
    syncFromQuotation: (quotation) => {
        const processes = [];

        // 1. Collect processes from each core
        (quotation.cores || []).forEach((core, coreIndex) => {
            (core.processes || []).forEach((process) => {
                processes.push({
                    id: process._id || `core-${coreIndex}-${process.processId}`,
                    processId: process.processId,
                    processName: process.processName,
                    category: process.category,
                    formula: process.formula,
                    formulaNote: process.formulaNote,
                    variables: process.variables || [],
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
                processes.push({
                    id: process._id || `sheath-${sheathIndex}-${process.processId}`,
                    processId: process.processId,
                    processName: process.processName,
                    category: process.category,
                    formula: process.formula,
                    formulaNote: process.formulaNote,
                    variables: process.variables || [],
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
            processes.push({
                id: process._id || `quote-${idx}-${process.processId}`,
                processId: process.processId,
                processName: process.processName,
                category: process.category,
                formula: process.formula,
                formulaNote: process.formulaNote,
                variables: process.variables || [],
                context: {
                    type: 'quote',
                    label: 'Cable Level'
                }
            });
        });
        console.log("aall process", processes);
        set({ allProcesses: processes });
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
        set({ allProcesses: [] });
    }
}));

export default useQuotationProcessStore;
