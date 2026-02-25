import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, MapPin, Clock, Package, ArrowRight, Eye } from 'lucide-react';
import api from '../api/axiosInstance';

const WorkOrderKanbanPage = () => {
    const navigate = useNavigate();
    const [workOrders, setWorkOrders] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [woRes, procRes] = await Promise.all([
                api.get('/work-order/get-all-work-orders?status=pending&status=in-progress'),
                api.get('/process/get-all-processes?isActive=true'),
            ]);
            setWorkOrders(woRes.data || []);
            setProcesses(procRes.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter work orders by search
    const filteredWorkOrders = workOrders.filter(wo =>
        !search ||
        wo.workOrderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        wo.customerId?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        wo.quoteNumber?.toLowerCase().includes(search.toLowerCase())
    );

    // Group work orders by current process
    const groupedByProcess = {};

    // Initialize with all processes
    processes.forEach(proc => {
        groupedByProcess[proc._id] = {
            process: proc,
            workOrders: [],
        };
    });

    // Add "Completed" column
    groupedByProcess['completed'] = {
        process: { _id: 'completed', name: 'Completed', processType: 'final' },
        workOrders: [],
    };

    // Add "Not Started" column
    groupedByProcess['not-started'] = {
        process: { _id: 'not-started', name: 'Not Started', processType: 'initial' },
        workOrders: [],
    };

    // Distribute work orders into columns
    filteredWorkOrders.forEach(wo => {
        // Check if all processes are completed
        const allCompleted = wo.processAssignments?.every(pa => pa.status === 'completed');

        if (allCompleted) {
            groupedByProcess['completed'].workOrders.push(wo);
        } else {
            // Find the first in-progress or pending process
            const currentProcess = wo.processAssignments?.find(
                pa => pa.status === 'in-progress' || pa.status === 'pending'
            );

            if (currentProcess) {
                const processId = typeof currentProcess.processId === 'object'
                    ? currentProcess.processId._id
                    : currentProcess.processId;

                if (groupedByProcess[processId]) {
                    groupedByProcess[processId].workOrders.push({
                        ...wo,
                        currentProcessAssignment: currentProcess,
                    });
                }
            } else {
                // No process started yet
                groupedByProcess['not-started'].workOrders.push(wo);
            }
        }
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-400">
            Loading kanban board…
        </div>
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Work Orders Kanban</h1>
                    <p className="text-sm text-gray-500">Visual workflow tracking by process stage</p>
                </div>
                <button
                    onClick={() => navigate('/work-orders')}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                    List View
                </button>
            </div>

            {/* Search */}
            <div className="mb-5">
                <div className="relative max-w-md">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search work orders..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
            </div>

            {/* Kanban Board */}
            <div className="overflow-x-auto pb-4">
                <div className="inline-flex gap-4 min-w-full">
                    {/* Not Started Column */}
                    <KanbanColumn
                        title="Not Started"
                        color="gray"
                        workOrders={groupedByProcess['not-started'].workOrders}
                        navigate={navigate}
                    />

                    {/* Process Columns */}
                    {processes.map(proc => (
                        <KanbanColumn
                            key={proc._id}
                            title={proc.name}
                            subtitle={proc.processType}
                            color="blue"
                            workOrders={groupedByProcess[proc._id]?.workOrders || []}
                            navigate={navigate}
                        />
                    ))}

                    {/* Completed Column */}
                    <KanbanColumn
                        title="Completed"
                        color="emerald"
                        workOrders={groupedByProcess['completed'].workOrders}
                        navigate={navigate}
                    />
                </div>
            </div>
        </div>
    );
};

const KanbanColumn = ({ title, subtitle, color, workOrders, navigate }) => {
    const colorClasses = {
        gray: {
            header: 'bg-gray-100 border-gray-300',
            text: 'text-gray-700',
            count: 'bg-gray-200 text-gray-700',
        },
        blue: {
            header: 'bg-blue-50 border-blue-300',
            text: 'text-blue-700',
            count: 'bg-blue-200 text-blue-700',
        },
        emerald: {
            header: 'bg-emerald-50 border-emerald-300',
            text: 'text-emerald-700',
            count: 'bg-emerald-200 text-emerald-700',
        },
    };

    const colors = colorClasses[color] || colorClasses.blue;

    return (
        <div className="flex-shrink-0 w-80">
            {/* Column Header */}
            <div className={`px-4 py-3 rounded-t-xl border-2 border-b-0 ${colors.header}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`font-bold ${colors.text}`}>{title}</h3>
                        {subtitle && (
                            <p className="text-xs text-gray-500 mt-0.5 capitalize">{subtitle}</p>
                        )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors.count}`}>
                        {workOrders.length}
                    </span>
                </div>
            </div>

            {/* Column Body */}
            <div className="bg-gray-50 border-2 border-t-0 border-gray-200 rounded-b-xl p-3 min-h-96 max-h-[calc(100vh-300px)] overflow-y-auto">
                <div className="space-y-3">
                    {workOrders.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm py-8">
                            No work orders
                        </div>
                    ) : (
                        workOrders.map(wo => (
                            <KanbanCard key={wo._id} workOrder={wo} navigate={navigate} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const KanbanCard = ({ workOrder, navigate }) => {
    const currentPA = workOrder.currentProcessAssignment;
    const progress = workOrder.processAssignments?.length > 0
        ? (workOrder.processAssignments.filter(pa => pa.status === 'completed').length / workOrder.processAssignments.length) * 100
        : 0;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <p className="font-mono text-xs font-bold text-gray-700 mb-1">
                        {workOrder.workOrderNumber}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                        {workOrder.customerId?.companyName || 'Unknown Customer'}
                    </p>
                </div>
                <button
                    onClick={() => navigate(`/work-order/${workOrder._id}`)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                    <Eye size={14} />
                </button>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Package size={12} />
                    <span>{workOrder.cableLength?.toLocaleString()} m</span>
                </div>

                {currentPA && (
                    <>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <User size={12} />
                            <span>{currentPA.assignedEmployeeId?.name || '—'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin size={12} />
                            <span>{currentPA.locationName || '—'}</span>
                        </div>

                        {currentPA.progressPercentage > 0 && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Clock size={12} />
                                <span>{currentPA.progressPercentage}% complete</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Overall</span>
                    <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Process Status Badge */}
            {currentPA && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        currentPA.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                    }`}>
                        {currentPA.status === 'in-progress' ? 'In Progress' : 'Pending'}
                    </span>
                    {currentPA.producedQuantity > 0 && (
                        <span className="text-xs text-emerald-600 font-medium">
                            {currentPA.producedQuantity}m produced
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkOrderKanbanPage;
