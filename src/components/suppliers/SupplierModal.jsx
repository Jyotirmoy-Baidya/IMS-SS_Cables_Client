import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axiosInstance';

const SupplierModal = ({ open, onClose, onSuccess, supplier = null }) => {
  const [materialTypes, setMaterialTypes] = useState([]);
  const [formData, setFormData] = useState({
    supplierName: '',
    status: 'active',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      country: 'India',
      pincode: ''
    },
    businessInfo: {
      gst: '',
      pan: '',
      phone: '',
      email: '',
      website: ''
    },
    contacts: [],
    deliveryTypes: [],
    paymentTerms: 'Net 30',
    creditLimit: 0,
    notes: '',
    rating: 0
  });

  const [newContact, setNewContact] = useState({
    name: '',
    designation: '',
    phone: '',
    email: '',
    isPrimary: false
  });

  const [selectedMaterialTypeId, setSelectedMaterialTypeId] = useState('');

  useEffect(() => {
    if (open) {
      fetchMaterialTypes();
    }
  }, [open]);

  const fetchMaterialTypes = async () => {
    try {
      const res = await api.get('/material-type/get-all-material-types');
      setMaterialTypes(res.data);
    } catch (error) {
      console.error('Error fetching material types:', error);
    }
  };

  useEffect(() => {
    if (supplier) {
      setFormData({
        ...supplier,
        address: supplier.address || formData.address,
        businessInfo: supplier.businessInfo || formData.businessInfo,
        contacts: supplier.contacts || [],
        deliveryTypes: supplier.deliveryTypes || []
      });
    } else {
      resetForm();
    }
  }, [supplier, open]);

  const resetForm = () => {
    setFormData({
      supplierName: '',
      status: 'active',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        country: 'India',
        pincode: ''
      },
      businessInfo: {
        gst: '',
        pan: '',
        phone: '',
        email: '',
        website: ''
      },
      contacts: [],
      deliveryTypes: [],
      paymentTerms: 'Net 30',
      creditLimit: 0,
      notes: '',
      rating: 0
    });
    setNewContact({
      name: '',
      designation: '',
      phone: '',
      email: '',
      isPrimary: false
    });
    setSelectedMaterialTypeId('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  const handleBusinessInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        [name]: value
      }
    }));
  };

  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      setFormData(prev => ({
        ...prev,
        contacts: [...prev.contacts, newContact]
      }));
      setNewContact({
        name: '',
        designation: '',
        phone: '',
        email: '',
        isPrimary: false
      });
    }
  };

  const handleRemoveContact = (index) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const handleAddDeliveryType = () => {
    if (selectedMaterialTypeId && !formData.deliveryTypes.some(dt => {
      const dtId = typeof dt === 'object' ? dt._id : dt;
      return dtId === selectedMaterialTypeId;
    })) {
      setFormData(prev => ({
        ...prev,
        deliveryTypes: [...prev.deliveryTypes, selectedMaterialTypeId]
      }));
      setSelectedMaterialTypeId('');
    }
  };

  const handleRemoveDeliveryType = (typeId) => {
    setFormData(prev => ({
      ...prev,
      deliveryTypes: prev.deliveryTypes.filter(dt => {
        const dtId = typeof dt === 'object' ? dt._id : dt;
        return dtId !== typeId;
      })
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert populated delivery types to ObjectIds only
    const submissionData = {
      ...formData,
      deliveryTypes: formData.deliveryTypes.map(dt =>
        typeof dt === 'object' ? dt._id : dt
      )
    };
    onSuccess(submissionData);
    onClose();
    resetForm();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Supplier Name *</label>
                <input
                  type="text"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blacklisted">Blacklisted</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Terms</label>
                <input
                  type="text"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleInputChange}
                  placeholder="e.g., Net 30, Net 60"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  name="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rating (0-5)</label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-medium mb-3">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  name="line1"
                  value={formData.address.line1}
                  onChange={handleAddressChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address Line 2</label>
                <input
                  type="text"
                  name="line2"
                  value={formData.address.line2}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.address.city}
                  onChange={handleAddressChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.address.state}
                  onChange={handleAddressChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.address.pincode}
                  onChange={handleAddressChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.address.country}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">GST Number</label>
                <input
                  type="text"
                  name="gst"
                  value={formData.businessInfo.gst}
                  onChange={handleBusinessInfoChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PAN Number</label>
                <input
                  type="text"
                  name="pan"
                  value={formData.businessInfo.pan}
                  onChange={handleBusinessInfoChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.businessInfo.phone}
                  onChange={handleBusinessInfoChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.businessInfo.email}
                  onChange={handleBusinessInfoChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.businessInfo.website}
                  onChange={handleBusinessInfoChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-lg font-medium mb-3">Contact Persons</h3>
            <div className="space-y-2 mb-3">
              {formData.contacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <div className="font-medium">{contact.name} {contact.isPrimary && <span className="text-xs text-blue-600">(Primary)</span>}</div>
                    <div className="text-sm text-gray-600">{contact.designation} • {contact.phone} • {contact.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveContact(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="Name"
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Designation"
                value={newContact.designation}
                onChange={(e) => setNewContact(prev => ({ ...prev, designation: e.target.value }))}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newContact.phone}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="email"
                placeholder="Email"
                value={newContact.email}
                onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                className="px-3 py-2 border rounded-md"
              />
              <button
                type="button"
                onClick={handleAddContact}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Delivery Types */}
          <div>
            <h3 className="text-lg font-medium mb-3">Material Types (What They Supply)</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.deliveryTypes.map((type, index) => {
                const typeName = typeof type === 'object' ? type.name :
                  materialTypes.find(mt => mt._id === type)?.name || type;
                const typeId = typeof type === 'object' ? type._id : type;
                return (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                    {typeName}
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliveryType(typeId)}
                      className="hover:text-blue-600"
                    >
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="flex gap-2">
              <select
                value={selectedMaterialTypeId}
                onChange={(e) => setSelectedMaterialTypeId(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              >
                <option value="">-- Select Material Type --</option>
                {materialTypes.map(type => (
                  <option key={type._id} value={type._id}>
                    {type.name} ({type.category})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddDeliveryType}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {supplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierModal;
