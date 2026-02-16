import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const MaterialTypeModal = ({ open, onClose, onSuccess, materialType = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'metal',
    density: '',
    unit: 'kg',
    specifications: {
      grade: '',
      standard: ''
    },
    description: ''
  });

  useEffect(() => {
    if (materialType) {
      setFormData({
        name: materialType.name || '',
        category: materialType.category || 'metal',
        density: materialType.density || '',
        unit: materialType.unit || 'kg',
        specifications: {
          grade: materialType.specifications?.grade || '',
          standard: materialType.specifications?.standard || ''
        },
        description: materialType.description || ''
      });
    } else {
      resetForm();
    }
  }, [materialType, open]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'metal',
      density: '',
      unit: 'kg',
      specifications: {
        grade: '',
        standard: ''
      },
      description: ''
    });
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert density to number
    const dataToSubmit = {
      ...formData,
      density: parseFloat(formData.density)
    };

    onSuccess(dataToSubmit);
    onClose();
    resetForm();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {materialType ? 'Edit Material Type' : 'Add New Material Type'}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Material Type Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Copper Rod, Aluminum Wire, PVC Compound"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Generic material name (dimensions will be added in raw materials)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="metal">Metal</option>
                  <option value="plastic">Plastic</option>
                  <option value="insulation">Insulation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Density (g/cm³) *</label>
                <input
                  type="number"
                  name="density"
                  value={formData.density}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="e.g., 8.96 for copper"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Used for weight/length calculations</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="meter">Meter (m)</option>
                  <option value="piece">Piece</option>
                </select>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div>
            <h3 className="text-lg font-medium mb-3">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Grade</label>
                <input
                  type="text"
                  name="grade"
                  value={formData.specifications.grade}
                  onChange={handleSpecificationChange}
                  placeholder="e.g., 99.99% pure, Grade A"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Standard</label>
                <input
                  type="text"
                  name="standard"
                  value={formData.specifications.standard}
                  onChange={handleSpecificationChange}
                  placeholder="e.g., IS 8130, ASTM B8"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="Additional notes about this material type..."
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Common Examples Helper */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-blue-900 mb-2">Common Material Type Examples:</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <div><strong>Copper Rod:</strong> Category: Metal, Density: 8.96 g/cm³</div>
              <div><strong>Aluminum Wire:</strong> Category: Metal, Density: 2.7 g/cm³</div>
              <div><strong>PVC Compound:</strong> Category: Plastic, Density: 1.4 g/cm³</div>
              <div><strong>XLPE Insulation:</strong> Category: Insulation, Density: 0.935 g/cm³</div>
              <div className="mt-2 text-xs italic">Note: Specific dimensions (8mm, 9.5mm) will be added when creating raw materials</div>
            </div>
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
              {materialType ? 'Update Material Type' : 'Add Material Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialTypeModal;
