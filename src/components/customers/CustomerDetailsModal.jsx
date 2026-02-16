import {
    X,
    Building2,
    MapPin,
    Phone,
    Mail,
    FileText,
    Users,
    CheckCircle,
    Globe,
    User
} from "lucide-react";

export default function CustomerDetailsModal({ customer, onClose }) {
    if (!customer) return null;

    const contacts = [...(customer.contacts || [])].sort(
        (a, b) => Number(b.isPrimary) - Number(a.isPrimary)
    );

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-2">
            <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* HEADER */}
                <div className="flex items-start justify-between gap-4 px-5 py-4 border-b">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600">
                            {customer.companyName?.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {customer.companyName}
                            </h2>

                            <div className="mt-1 flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${customer.status === "Active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-200 text-gray-600"
                                        }`}
                                >
                                    <CheckCircle size={12} />
                                    {customer.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-md hover:bg-gray-100"
                    >
                        <X />
                    </button>
                </div>

                {/* BODY */}
                <div className="overflow-y-auto p-5 space-y-6">

                    {/* BUSINESS INFO */}
                    <Section title="Business Information" icon={<FileText size={16} />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 border rounded-lg p-4">
                            <Info label="GST Number" value={customer.businessInfo?.gst} />
                            <Info label="PAN Number" value={customer.businessInfo?.pan} />
                            <Info label="Business Phone" value={customer.businessInfo?.phone} />
                            <Info label="Business Email" value={customer.businessInfo?.email} />
                        </div>
                    </Section>

                    {/* ADDRESSES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Section title="Shipping Address" icon={<MapPin size={16} />}>
                            <AddressCard address={customer.address} />
                        </Section>

                        {customer.businessInfo && (
                            <Section title="Billing Address" icon={<MapPin size={16} />}>
                                {customer.businessInfo.sameAsShipping ? (
                                    <p className="text-sm text-gray-600 italic">
                                        Same as shipping address
                                    </p>
                                ) : (
                                    <AddressCard address={customer.businessInfo} />
                                )}
                            </Section>
                        )}
                    </div>

                    {/* CONTACTS */}
                    <Section title="Contact Persons" icon={<Users size={16} />}>
                        {contacts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {contacts.map((c, i) => (
                                    <div
                                        key={i}
                                        className={`border rounded-lg p-4 ${c.isPrimary
                                            ? "bg-blue-50 border-blue-200"
                                            : "bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="opacity-70" />
                                                <h4 className="font-medium text-gray-900">
                                                    {c.name || "—"}
                                                </h4>
                                            </div>

                                            {c.isPrimary && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                    Primary
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-600 mb-3">
                                            {c.designation || "—"}
                                        </p>

                                        <div className="space-y-1 text-sm text-gray-700">
                                            {c.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} />
                                                    {c.phone}
                                                </div>
                                            )}
                                            {c.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} />
                                                    {c.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No contacts added</p>
                        )}
                    </Section>

                    {/* NOTES */}
                    {customer.notes && (
                        <Section title="Internal Notes">
                            <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700">
                                {customer.notes}
                            </div>
                        </Section>
                    )}
                </div>

                {/* FOOTER */}
                <div className="border-t px-5 py-3 flex justify-end gap-2 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-md border hover:bg-gray-100"
                    >
                        Close
                    </button>
                    <button className="px-4 py-2 text-sm rounded-md bg-[#181818] text-white">
                        Edit Customer
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------------- Helpers ---------------- */

const Section = ({ title, icon, children }) => (
    <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            {icon}
            {title}
        </h3>
        {children}
    </div>
);

const Info = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800">
            {value || "—"}
        </p>
    </div>
);

const AddressCard = ({ address }) => (
    <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700 space-y-1">
        <div>{address?.line1}</div>
        {address?.line2 && <div>{address.line2}</div>}
        <div>
            {address?.city}, {address?.state} – {address?.pincode}
        </div>
        {address?.country && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Globe size={12} />
                {address.country}
            </div>
        )}
    </div>
);
