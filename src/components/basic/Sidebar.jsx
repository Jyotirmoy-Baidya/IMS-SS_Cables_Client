import {
    LayoutDashboard,
    Users,
    UserCircle,
    FileText,
    ClipboardList,
    Truck,
    Package,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useSidebar } from "../../contexts/SidebarContext";

const Sidebar = () => {
    const { collapsed, setCollapsed } = useSidebar();

    return (
        <aside
            className={`fixed h-screen bg-white border-r border-gray-200
      transition-all duration-300 flex flex-col
      ${collapsed ? "w-16" : "w-64"}`}
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b">
                {!collapsed && (
                    <div>
                        <p className="text-sm font-semibold text-[#181818]">
                            SS Cable ERP
                        </p>
                        <p className="text-xs text-gray-500">
                            Wire & Cable Manufacturing
                        </p>
                    </div>
                )}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1 rounded hover:bg-gray-100"
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-4">

                <ul className="space-y-1">
                    <SidebarItem
                        icon={<LayoutDashboard size={18} />}
                        label="Dashboard"
                        to="/dashboard"
                        collapsed={collapsed}
                    />

                    <SidebarGroup
                        icon={<Users size={18} />}
                        label="Customers & Sales"
                        collapsed={collapsed}
                    >
                        <SidebarSubItem label="Customers" to="/customers" />
                        <SidebarSubItem label="Quotations" to="/quotations" />
                        <SidebarSubItem label="Work Orders" to="/work-orders" />
                        <SidebarSubItem label="Kanban Board" to="/work-orders/kanban" />
                    </SidebarGroup>

                    <SidebarGroup
                        icon={<Truck size={18} />}
                        label="Procurement"
                        collapsed={collapsed}
                    >
                        <SidebarSubItem label="Suppliers" to="/suppliers" />
                        <SidebarSubItem label="Purchase Orders" to="/purchase-orders" />
                        <SidebarSubItem label="GRN" to="/grn" />
                    </SidebarGroup>

                    <SidebarGroup
                        icon={<Package size={18} />}
                        label="Inventory"
                        collapsed={collapsed}
                    >
                        <SidebarSubItem label="Raw Materials" to="/inventory/raw" />
                        <SidebarSubItem label="WIP (Intermediate)" to="/inventory/wip" />
                        <SidebarSubItem label="Finished Goods" to="/inventory/finished" />
                    </SidebarGroup>

                    <SidebarGroup
                        icon={<Settings size={18} />}
                        label="Masters"
                        collapsed={collapsed}
                    >
                        <SidebarSubItem label="Process Master" to="/process-master" />
                        <SidebarSubItem label="Locations" to="/settings/locations" />
                    </SidebarGroup>

                    <SidebarGroup
                        icon={<UserCircle size={18} />}
                        label="Team"
                        collapsed={collapsed}
                    >
                        <SidebarSubItem label="Users & Employees" to="/users" />
                    </SidebarGroup>
                </ul>
            </nav>

            {/* Footer */}
            <div className="border-t px-3 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#181818] text-white flex items-center justify-center text-sm font-semibold">
                    AD
                </div>

                {!collapsed && (
                    <div>
                        <p className="text-sm font-medium text-[#181818]">
                            Admin User
                        </p>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            Admin
                        </span>
                    </div>
                )}
            </div>
        </aside>
    );
};

/* ---------------------------------- */
/* Sidebar Item (Main Link) */
/* ---------------------------------- */

const SidebarItem = ({ icon, label, to, collapsed }) => (
    <li>
        <NavLink
            to={to}
            className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2 rounded-md
        text-sm font-medium transition
        ${isActive
                    ? "bg-[#181818] text-gray-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`
            }
        >
            {icon}
            {!collapsed && <span>{label}</span>}
        </NavLink>
    </li>
);

/* ---------------------------------- */
/* Sidebar Group */
/* ---------------------------------- */

const SidebarGroup = ({ icon, label, collapsed, children }) => {
    const [open, setOpen] = useState(true);

    return (
        <li>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md
        text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
                <div className="flex items-center gap-3">
                    {icon}
                    {!collapsed && <span>{label}</span>}
                </div>

                {!collapsed && (
                    <ChevronDown
                        size={16}
                        className={`transition-transform ${open ? "rotate-180" : ""}`}
                    />
                )}
            </button>

            {!collapsed && open && (
                <ul className="ml-9 mt-1 space-y-1">{children}</ul>
            )}
        </li>
    );
};

/* ---------------------------------- */
/* Sidebar Sub Item (Child Link) */
/* ---------------------------------- */

const SidebarSubItem = ({ label, to }) => (
    <li>
        <NavLink
            to={to}
            className={({ isActive }) =>
                `block px-2 py-1.5 rounded-md text-sm transition
        ${isActive
                    ? "bg-[#181818] text-gray-200 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`
            }
        >
            {label}
        </NavLink>
    </li>
);

export default Sidebar;
