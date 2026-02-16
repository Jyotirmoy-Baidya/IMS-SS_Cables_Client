import { useEffect, useMemo, useState } from "react";
import {
    Eye,
    Pencil,
    Trash2,
    LayoutGrid,
    List,
    Globe,
    Mail,
    Search,
} from "lucide-react";

import {
    MapPin,
    Phone,
    User,
} from "lucide-react";

import CustomerModal from "../components/customers/CustomerModal";
import api from "../api/axiosInstance";
import CustomerDetailsModal from "../components/customers/CustomerDetailsModal";


const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedViewCustomer, setSelectedViewCustomer] = useState(null);
    const [viewOnly, setViewOnly] = useState(false);

    const [viewMode, setViewMode] = useState("table");
    const [nameFilter, setNameFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("");

    /* ---------------- Fetch ---------------- */
    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await api.get("/customer/get-all-customer");
            setCustomers(res.data);
        } catch (err) {
            console.error("Failed to fetch customers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    /* ---------------- Filters ---------------- */
    const filteredCustomers = useMemo(() => {
        if (!customers) return []
        return customers.filter((c) => {
            const nameMatch = c.companyName
                ?.toLowerCase()
                .includes(nameFilter.toLowerCase());

            const locationMatch = `${c.address?.city || ""} ${c.address?.state || ""}`
                .toLowerCase()
                .includes(locationFilter.toLowerCase());

            return nameMatch && locationMatch;
        });
    }, [customers, nameFilter, locationFilter]);

    /* ---------------- Actions ---------------- */
    const openAdd = () => {
        setSelectedCustomer(null);
        setViewOnly(false);
        setOpenModal(true);
    };

    const openEdit = (c) => {
        setSelectedCustomer(c);
        setViewOnly(false);
        setOpenModal(true);
    };

    const openView = (c) => {
        setSelectedViewCustomer(c);
        setViewOnly(true);
    };

    const deleteCustomer = async (id) => {
        if (!confirm("Delete this customer?")) return;
        await api.delete(`/customer/delete-customers/${id}`);
        fetchCustomers();
    };

    /* ---------------- UI ---------------- */
    return (
        <div className="min-h-screen">
            {
                viewOnly &&
                <CustomerDetailsModal
                    customer={selectedViewCustomer}
                    onClose={() => { setSelectedViewCustomer(null); viewOnly(false) }}
                />
            }

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold text-gray-900">
                    Customers
                </h1>

                <button
                    onClick={openAdd}
                    className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition"
                >
                    + Add Customer
                </button>
            </div>


            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Company Filter */}
                <div className="relative w-64">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        placeholder="Company name"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-black/10
                 placeholder:text-gray-400"
                    />
                </div>

                {/* Location Filter */}
                <div className="relative w-64">
                    <MapPin
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        placeholder="City or state"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-black/10
                 placeholder:text-gray-400"
                    />
                </div>

                {/* View Toggle */}
                <div className="ml-auto flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <button
                        onClick={() => setViewMode("table")}
                        className={`px-3 py-2 text-gray-600 transition
        ${viewMode === "table"
                                ? "bg-gray-100 text-gray-900"
                                : "hover:bg-gray-50"
                            }`}
                        title="Table view"
                    >
                        <List size={16} />
                    </button>

                    <button
                        onClick={() => setViewMode("grid")}
                        className={`px-3 py-2 text-gray-600 transition
        ${viewMode === "grid"
                                ? "bg-gray-100 text-gray-900"
                                : "hover:bg-gray-50"
                            }`}
                        title="Grid view"
                    >
                        <LayoutGrid size={16} />
                    </button>
                </div>
            </div>


            {/* Content */}
            {loading ? (
                <p className="text-sm text-gray-500">Loading...</p>
            ) : viewMode === "table" ? (
                <TableView
                    data={filteredCustomers}
                    onView={openView}
                    onEdit={openEdit}
                    onDelete={deleteCustomer}
                />
            ) : (
                <GridView
                    data={filteredCustomers}
                    onView={openView}
                    onEdit={openEdit}
                    onDelete={deleteCustomer}
                />
            )}

            {/* Modal (Add / Edit / View) */}
            {openModal && (
                <CustomerModal
                    open={openModal}
                    customer={selectedCustomer}
                    viewOnly={viewOnly}
                    onClose={() => setOpenModal(false)}
                    onSuccess={fetchCustomers}
                />
            )}
        </div>
    );
};

export default CustomersPage;


const TableView = ({ data, onView, onEdit, onDelete }) => {
    return (
        <div className="bg-white border border-gray-800/50 rounded overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    {/* HEADER */}
                    <thead className="bg-gray-100 text-gray-800 uppercase text-xs sticky top-0 z-10 border-b border-neutral-400/20">
                        <tr>
                            <th className="px-5 py-3 text-left">ID</th>
                            <th className="px-5 py-3 text-left">Company</th>
                            <th className="px-5 py-3 text-left">Location</th>
                            <th className="px-5 py-3 text-left">Primary Contact</th>
                            <th className="px-5 py-3 text-left">Phone</th>
                            <th className="px-5 py-3 text-center">Status</th>
                            <th className="px-5 py-3 text-center">Actions</th>
                        </tr>
                    </thead>

                    {/* BODY */}
                    <tbody className="divide-y divide-gray-100">
                        {data.map((c) => {
                            const primaryContact = c.contacts?.find(ct => ct.isPrimary);

                            return (
                                <tr
                                    key={c._id}
                                    className="hover:bg-gray-50 transition"
                                >
                                    {/* ID */}
                                    <td className="px-5 py-2 font-mono text-xs text-gray-400">
                                        {c._id.slice(-6).toUpperCase()}
                                    </td>

                                    {/* COMPANY */}
                                    <td className="px-5 py-2 font-semibold text-gray-900">
                                        {c.companyName}
                                    </td>

                                    {/* LOCATION */}
                                    <td className="px-5 py-2 text-blue-900">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-gray-400" />
                                            {c.address?.city}, {c.address?.state}
                                        </div>
                                    </td>

                                    {/* CONTACT */}
                                    <td className="px-5 py-2 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-gray-400" />
                                            {primaryContact?.name || "—"}
                                        </div>
                                    </td>

                                    {/* PHONE */}
                                    <td className="px-5 py-2 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} className="text-gray-400" />
                                            {primaryContact?.phone || "—"}
                                        </div>
                                    </td>

                                    {/* STATUS */}
                                    <td className="px-5 py-2 text-center">
                                        <span
                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium
                    ${c.isActive
                                                    ? "bg-green-50 text-green-700"
                                                    : "bg-gray-100 text-gray-500"
                                                }`}
                                        >
                                            {c.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="px-5 py-2 flex justify-center">
                                        <ActionButtons onView={() => onView(c)} onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-500">
                <span>
                    Showing <span className="font-medium text-gray-700">1–{data.length}</span> of{" "}
                    <span className="font-medium text-gray-700">{data.length}</span>
                </span>

                <div className="flex items-center gap-1">
                    <button className="px-2 py-1 border rounded hover:bg-gray-100">&lt;</button>
                    <button className="px-3 py-1 border rounded bg-black text-white">1</button>
                    <button className="px-2 py-1 border rounded hover:bg-gray-100">&gt;</button>
                </div>
            </div>
        </div>

    );
};




const GridView = ({ data, onView, onEdit, onDelete }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.map((c) => {
                const contacts = [...(c.contacts || [])].sort(
                    (a, b) => Number(b.isPrimary) - Number(a.isPrimary)
                );

                return (
                    <div
                        key={c._id}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                    >
                        {/* HEADER */}
                        <div className="flex items-start gap-3 mb-4">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                                {c.companyName?.slice(0, 2).toUpperCase()}
                            </div>

                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 leading-tight">
                                    {c.companyName}
                                </h3>

                                {/* Address */}
                                <div className="mt-1 space-y-1 text-sm text-gray-500">
                                    <div className="flex items-start gap-2">
                                        <MapPin size={14} className="mt-0.5 text-gray-400" />
                                        <span>
                                            {c.address?.street && `${c.address.street}, `}
                                            {c.address?.city}, {c.address?.state}
                                            {c.address?.zip && ` - ${c.address.zip}`}
                                        </span>
                                    </div>

                                    {c.address?.country && (
                                        <div className="flex items-center gap-2">
                                            <Globe size={14} className="text-gray-400" />
                                            {c.address.country}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status */}
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${c.isActive
                                    ? "bg-green-50 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                    }`}
                            >
                                {c.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>

                        {/* CONTACTS */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">
                                Contacts
                            </h4>

                            {contacts.length > 0 ? (
                                contacts.map((ct, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${ct.isPrimary
                                            ? "bg-blue-50 text-blue-700"
                                            : "bg-gray-50 text-gray-700"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="opacity-70" />
                                            <span className="font-medium">{ct.name}</span>
                                            {ct.isPrimary && (
                                                <>
                                                    <span className="ml-1 text-xs font-medium">(Primary)</span>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            {ct.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={12} />
                                                    {ct.phone}
                                                </span>
                                            )}
                                            {ct.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail size={12} />
                                                    {ct.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400">No contacts added</p>
                            )}
                        </div>

                        {/* NOTES */}
                        {c.notes && (
                            <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                                {c.notes}
                            </p>
                        )}

                        {/* ACTIONS */}
                        <div className="mt-4 flex justify-end">
                            <ActionButtons
                                onView={() => onView(c)}
                                onEdit={() => onEdit(c)}
                                onDelete={() => onDelete(c._id)}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};




const ActionButtons = ({ onView, onEdit, onDelete }) => (
    <div className="flex gap-2">
        <button onClick={onView} title="View">
            <Eye size={16} className="text-blue-600" />
        </button>
        <button onClick={onEdit} title="Edit">
            <Pencil size={16} />
        </button>
        <button onClick={onDelete} title="Delete">
            <Trash2 size={16} className="text-red-600" />
        </button>
    </div>
);
