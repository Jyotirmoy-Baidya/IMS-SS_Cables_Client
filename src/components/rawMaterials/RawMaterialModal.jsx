import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const RawMaterialModal = ({ open, onClose, onSuccess, material = null, materialTypes = [], suppliers = [] }) => {
  const [formData, setFormData] = useState({
    materialTypeId: '',
    name: '',
    category: 'metal',
    specifications: {
      dimensions: '',
      dimensionValue: '',
      dimensionUnit: 'sq mm',
      grade: '',
      color: ''
    },
    preferredSuppliers: [],
    measurementType: 'both',
    reorderLevel: 0,
    notes: ''
  });

  const [selectedSupplier, setSelectedSupplier] = useState('');

  useEffect(() => {
    if (material) {
      setFormData({
        materialTypeId: material.materialTypeId?._id || material.materialTypeId || '',
        name: material.name || '',
        category: material.category || 'metal',
        specifications: {
          dimensions: material.specifications?.dimensions || '',
          dimensionValue: material.specifications?.dimensionValue || '',
          dimensionUnit: material.specifications?.dimensionUnit || 'sq mm',
          grade: material.specifications?.grade || '',
          color: material.specifications?.color || ''
        },
        preferredSuppliers: material.preferredSuppliers?.map(s => s._id || s) || [],
        measurementType: material.measurementType || 'both',
        reorderLevel: material.reorderLevel || 0,
        notes: material.notes || ''
      });
    } else {
      resetForm();
    }
  }, [material, open]);

  const resetForm = () => {
    setFormData({
      materialTypeId: '',
      name: '',
      category: 'metal',
      specifications: {
        dimensions: '',
        dimensionValue: '',
        dimensionUnit: 'sq mm',
        grade: '',
        color: ''
      },
      preferredSuppliers: [],
      measurementType: 'both',
      reorderLevel: 0,
      notes: ''
    });
    setSelectedSupplier('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecificationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [name]: value
      }
    }));

    // Auto-generate dimensions string
    if (name === 'dimensionValue' || name === 'dimensionUnit') {
      const dimValue = name === 'dimensionValue' ? value : formData.specifications.dimensionValue;
      const dimUnit = name === 'dimensionUnit' ? value : formData.specifications.dimensionUnit;

      if (dimValue && dimUnit) {
        setFormData(prev => ({
          ...prev,
          specifications: {
            ...prev.specifications,
            dimensions: `${dimValue} ${dimUnit}`
          }
        }));
      }
    }
  };

  const handleMaterialTypeChange = (e) => {
    const typeId = e.target.value;
    const selectedType = materialTypes.find(t => t._id === typeId);
    const category = selectedType?.category || 'metal';

    setFormData(prev => ({
      ...prev,
      materialTypeId: typeId,
      category,
      name: selectedType?.name || '',
      // Non-metal materials are always weight-only
      measurementType: category === 'metal' ? prev.measurementType : 'weight'
    }));
  };

  const handleAddSupplier = () => {
    if (selectedSupplier && !formData.preferredSuppliers.includes(selectedSupplier)) {
      setFormData(prev => ({
        ...prev,
        preferredSuppliers: [...prev.preferredSuppliers, selectedSupplier]
      }));
      setSelectedSupplier('');
    }
  };

  const handleRemoveSupplier = (supplierId) => {
    setFormData(prev => ({
      ...prev,
      preferredSuppliers: prev.preferredSuppliers.filter(id => id !== supplierId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      reorderLevel: parseFloat(formData.reorderLevel) || 0,
      specifications: {
        ...formData.specifications,
        dimensionValue: parseFloat(formData.specifications.dimensionValue) || 0
      }
    };

    onSuccess(dataToSubmit);
    onClose();
    resetForm();
  };

  if (!open) return null;

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s._id === supplierId);
    return supplier?.supplierName || 'Unknown';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {material ? 'Edit Raw Material' : 'Add New Raw Material'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Material Type Selection */}
          <div>
            <h3 className="text-lg font-medium mb-3">Material Type</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Material Type *</label>
                <select
                  name="materialTypeId"
                  value={formData.materialTypeId}
                  onChange={handleMaterialTypeChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">-- Select Material Type --</option>
                  {materialTypes.map(type => (
                    <option key={type._id} value={type._id}>
                      {type.name} ({type.category}, {type.density} g/cm³)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose the base material type (e.g., Copper Rod, PVC Compound)
                </p>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div>
            <h3 className="text-lg font-medium mb-3">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Material Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Copper Rod 8mm"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Include dimensions in the name</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  disabled
                  className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
                />
              </div>

              {formData.category === 'metal' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dimension Value *</label>
                    <input
                      type="number"
                      name="dimensionValue"
                      value={formData.specifications.dimensionValue}
                      onChange={handleSpecificationChange}
                      step="0.1"
                      min="0"
                      placeholder="e.g., 8, 9.5, 12"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Dimension Unit *</label>
                    <select
                      name="dimensionUnit"
                      value={formData.specifications.dimensionUnit}
                      onChange={handleSpecificationChange}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="sq mm">sq mm</option>
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="inch">inch</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Full Dimensions</label>
                    <input
                      type="text"
                      value={formData.specifications.dimensions}
                      disabled
                      className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
                      placeholder="Auto-generated from dimension value and unit"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Grade</label>
                <input
                  type="text"
                  name="grade"
                  value={formData.specifications.grade}
                  onChange={handleSpecificationChange}
                  placeholder="e.g., 99.99% pure"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.specifications.color}
                  onChange={handleSpecificationChange}
                  placeholder="e.g., Red, Natural"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Measurement & Stock */}
          <div>
            <h3 className="text-lg font-medium mb-3">Measurement & Stock</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Measurement Type</label>
                {formData.category === 'metal' ? (
                  <select
                    name="measurementType"
                    value={formData.measurementType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="weight">Weight Only</option>
                    <option value="length">Length Only</option>
                    <option value="both">Both Weight & Length</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value="Weight Only"
                    disabled
                    className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed text-gray-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reorder Level (kg)</label>
                <input
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  placeholder="e.g., 100"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Preferred Suppliers */}
          <div>
            <h3 className="text-lg font-medium mb-1">Preferred Suppliers</h3>
            <p className="text-xs text-gray-500 mb-3">Optional — can be linked later via Purchase Orders</p>
            <div className="space-y-2 mb-3">
              {formData.preferredSuppliers.map((supplierId) => (
                <div key={supplierId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span>{getSupplierName(supplierId)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSupplier(supplierId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              >
                <option value="">-- Select Supplier --</option>
                {suppliers
                  .filter(s => !formData.preferredSuppliers.includes(s._id))
                  .map(supplier => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.supplierName}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAddSupplier}
                disabled={!selectedSupplier}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
              placeholder="Additional notes..."
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
              {material ? 'Update Material' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RawMaterialModal;
