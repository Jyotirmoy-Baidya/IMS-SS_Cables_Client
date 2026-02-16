import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";

import {
    Building2,
    MapPin,
    Users,
    StickyNote,
    User,
    Phone,
    Mail,
    Briefcase,
    DeleteIcon,
    Delete,
    Trash2,
    FileText,
    IdCard,
    Globe,
    Building,
    Hash,
    Map,
} from "lucide-react";


const CustomerModal = ({ open, onClose, onSuccess, customer }) => {
    const isEdit = Boolean(customer);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        companyName: "",
        avatarUrl: "",
        status: "Active",
        notes: "",

        address: {
            line1: "",
            line2: "",
            city: "",
            state: "",
            country: "India",
            pincode: "",
        },

        businessInfo: {
            gst: "",
            pan: "",
            phone: "",
            email: "",
            addressLine1: "",
            city: "",
            state: "",
            pincode: "",
            country: "India",
            sameAsShipping: false,
        },

        contacts: [
            {
                name: "",
                designation: "",
                phone: "",
                email: "",
                isPrimary: true,
            },
        ],
    });


    /* ---------------- Prefill on Edit ---------------- */
    useEffect(() => {
        if (customer) {
            setForm((prev) => ({
                ...prev,

                companyName: customer.companyName || "",
                avatarUrl: customer.avatarUrl || "",
                status: customer.status || "Active",
                notes: customer.notes || "",

                address: {
                    ...prev.address,
                    ...(customer.address || {}),
                },

                businessInfo: {
                    ...prev.businessInfo,
                    ...(customer.businessInfo || {}),
                },

                contacts:
                    customer.contacts && customer.contacts.length > 0
                        ? customer.contacts
                        : prev.contacts,
            }));
        }
    }, [customer]);


    /* ---------------- Handlers ---------------- */
    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleAddressChange = (e) =>
        setForm({
            ...form,
            address: { ...form.address, [e.target.name]: e.target.value },
        });

    const handleContactChange = (
        index,
        field,
        value
    ) => {
        const updated = [...form.contacts];
        updated[index] = { ...updated[index], [field]: value };
        setForm({ ...form, contacts: updated });
    };

    const addContact = () =>
        setForm({
            ...form,
            contacts: [
                ...form.contacts,
                { name: "", designation: "", phone: "", email: "", isPrimary: false },
            ],
        });

    const removeContact = (contact) => {
        setForm({
            ...form,
            contacts: form.contacts.filter((ele) => ele !== contact)
        });
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            if (isEdit) {
                await api.put(`/customer/update-customers/${customer._id}`, form);
            } else {
                await api.post("/customer/add-customer", form);
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Customer save failed", err);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    /* ---------------- UI ---------------- */
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="relative max-h-[90vh] bg-white w-full max-w-4xl rounded-lg shadow-lg  overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-2 border-b border-neutral-400/30 shadow-sm shadow-neutral-300/20 w-full">
                    <h2 className="text-lg font-semibold text-[#181818]">
                        {isEdit ? "Edit Customer" : "Add Customer"}
                    </h2>
                </div>

                <form className="px-4 py-3 space-y-6">
                    {/* Company Info */}
                    <section className="bg-gray-100 border border-neutral-300/60 rounded-lg p-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                            <Building2 size={16} />
                            Company Details
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Company Name"
                                name="companyName"
                                placeholder="e.g., SS Cables"
                                value={form.companyName}
                                onChange={handleChange}
                                required
                            />

                            <Input
                                label="Avatar URL"
                                name="avatarUrl"
                                value={form.avatarUrl}
                                onChange={handleChange}
                            />
                        </div>
                    </section>


                    {/* Address */}
                    <section className="bg-gray-100 border border-neutral-300/60 rounded-lg p-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                            <MapPin size={16} />
                            Address Details
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Address Line 1"
                                name="line1"
                                required
                                placeholder="Building / House No, Street Name"
                                onChange={handleAddressChange}
                                value={form.address.line1}
                            />

                            <Input
                                label="Address Line 2"
                                name="line2"
                                placeholder="Area, Landmark (optional)"
                                onChange={handleAddressChange}
                                value={form.address.line2 || ""}
                            />

                            <Input
                                label="City"
                                name="city"
                                required
                                placeholder="e.g. Bengaluru"
                                onChange={handleAddressChange}
                                value={form.address.city}
                            />

                            <Input
                                label="State"
                                name="state"
                                required
                                placeholder="e.g. Karnataka"
                                onChange={handleAddressChange}
                                value={form.address.state}
                            />

                            <Input
                                label="Pincode"
                                name="pincode"
                                required
                                placeholder="e.g. 560001"
                                onChange={handleAddressChange}
                                value={form.address.pincode}
                            />

                            <Input
                                label="Country"
                                name="country"
                                placeholder="e.g. India"
                                onChange={handleAddressChange}
                                value={form.address.country}
                            />
                        </div>

                    </section>


                    {/* Contacts */}
                    <section className="bg-gray-50 border border-neutral-300/60 rounded-lg p-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                            <Users size={16} />
                            Contact Persons
                        </h3>

                        {form.contacts.map((c, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4 bg-white border border-neutral-400/30 rounded-lg p-3 shadow"
                            >
                                <Input placeholder="Name" icon={<User size={14} />} value={c.name}
                                    onChange={(e) => handleContactChange(i, "name", e.target.value)} />

                                <Input placeholder="Designation" icon={<Briefcase size={14} />} value={c.designation}
                                    onChange={(e) => handleContactChange(i, "designation", e.target.value)} />

                                <Input placeholder="Phone" icon={<Phone size={14} />} value={c.phone}
                                    onChange={(e) => handleContactChange(i, "phone", e.target.value)} />

                                <Input placeholder="Email" icon={<Mail size={14} />} value={c.email}
                                    onChange={(e) => handleContactChange(i, "email", e.target.value)} />
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-xs text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={c.isPrimary}
                                            onChange={(e) =>
                                                handleContactChange(i, "isPrimary", e.target.checked)
                                            }
                                        />
                                        Primary
                                    </label>

                                    <div onClick={() => removeContact(c)}><Trash2 className="text-red-500" /></div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addContact}
                            className="text-sm font-medium text-[#181818]"
                        >
                            + Add another contact
                        </button>
                    </section>

                    <section className="bg-gray-50 border border-neutral-300/60 rounded-lg p-4 mt-6">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                            <Building2 size={16} />
                            Business Information
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <Input
                                placeholder="GST Number"
                                icon={<FileText size={14} />}
                                value={form.businessInfo.gst}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        businessInfo: {
                                            ...form.businessInfo,
                                            gst: e.target.value.toUpperCase(),
                                        },
                                    })
                                }
                            />

                            <Input
                                placeholder="PAN Number"
                                icon={<IdCard size={14} />}
                                value={form.businessInfo.pan}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        businessInfo: {
                                            ...form.businessInfo,
                                            pan: e.target.value.toUpperCase(),
                                        },
                                    })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <Input
                                placeholder="Business Phone"
                                icon={<Phone size={14} />}
                                value={form.businessInfo.phone}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        businessInfo: {
                                            ...form.businessInfo,
                                            phone: e.target.value,
                                        },
                                    })
                                }
                            />

                            <Input
                                placeholder="Business Email"
                                icon={<Mail size={14} />}
                                value={form.businessInfo.email}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        businessInfo: {
                                            ...form.businessInfo,
                                            email: e.target.value,
                                        },
                                    })
                                }
                            />

                            <Input
                                placeholder="Country"
                                icon={<Globe size={14} />}
                                value={form.businessInfo.country}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        businessInfo: {
                                            ...form.businessInfo,
                                            country: e.target.value,
                                        },
                                    })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                            <Input
                                placeholder="Billing Address"
                                icon={<MapPin size={14} />}
                                value={form.businessInfo.addressLine1}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        businessInfo: {
                                            ...form.businessInfo,
                                            addressLine1: e.target.value,
                                        },
                                    })
                                }
                                className="sm:col-span-2"
                            />

                            <Input
                                placeholder="City"
                                icon={<Building size={14} />}
                                value={form.businessInfo.city}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        businessInfo: {
                                            ...form.businessInfo,
                                            city: e.target.value,
                                        },
                                    })
                                }
                            />

                            <Input
                                placeholder="Pincode"
                                icon={<Hash size={14} />}
                                value={form.businessInfo.pincode}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        businessInfo: {
                                            ...form.businessInfo,
                                            pincode: e.target.value,
                                        },
                                    })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                placeholder="State"
                                icon={<Map size={14} />}
                                value={form.businessInfo.state}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        businessInfo: {
                                            ...form.businessInfo,
                                            state: e.target.value,
                                        },
                                    })
                                }
                            />

                            <label className="flex items-center gap-2 text-xs text-gray-600 bg-white border border-neutral-400/30 rounded-lg px-3 py-2 shadow">
                                <input
                                    type="checkbox"
                                    checked={form.businessInfo.sameAsShipping}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            businessInfo: {
                                                ...form.businessInfo,
                                                sameAsShipping: e.target.checked,
                                            },
                                        })
                                    }
                                />
                                Billing address same as shipping address
                            </label>
                        </div>
                    </section>


                    {/* Notes */}
                    <section className="bg-gray-50 border border-neutral-300/60 rounded-lg p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                            <StickyNote size={16} />
                            Notes
                        </label>

                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full border rounded-md px-3 py-2 text-sm border-neutral-400/30"
                            placeholder="Special payment terms, GST notes, etc."
                        />
                    </section>



                </form>
                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm border rounded-md"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        onClick={submitHandler}
                        className="px-5 py-2 text-sm bg-[#181818] text-white rounded-md"
                    >
                        {loading ? "Saving..." : isEdit ? "Update Customer" : "Create Customer"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerModal;

/* ---------- Reusable Input ---------- */
const Input = ({ label, icon, ...props }) => (
    <div>
        {label && (
            <label className="flex items-center gap-2 text-sm font-medium mb-1 text-gray-700">
                {icon}
                {label}
            </label>
        )}
        <input
            {...props}
            className="w-full border border-black/20 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/10"
        />
    </div>
);
