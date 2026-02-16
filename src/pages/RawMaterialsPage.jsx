import { useState, useEffect } from 'react';
import { Plus, Package, TrendingUp, AlertTriangle, Search, Eye, Edit, Trash2, Layers, RefreshCw } from 'lucide-react';
import api from '../api/axiosInstance';
import MaterialTypeModal from '../components/rawMaterials/MaterialTypeModal';
import RawMaterialModal from '../components/rawMaterials/RawMaterialModal';

const RawMaterialsPage = () => {
  const [activeTab, setActiveTab] = useState('types'); // 'types' or 'inventory'
  const [materials, setMaterials] = useState([]);
  const [lots, setLots] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedMaterialType, setSelectedMaterialType] = useState(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showLotsModal, setShowLotsModal] = useState(false);
  const [reprocessModal, setReprocessModal] = useState(null); // material object
  const [reprocessForm, setReprocessForm] = useState({ weight: '', pricePerKg: '' });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [materialsRes, typesRes, suppliersRes] = await Promise.all([
        api.get('/raw-material/get-all-materials'),
        api.get('/material-type/get-all-material-types'),
        api.get('/supplier/get-all-suppliers')
      ]);
      setMaterials(materialsRes.data);
      setMaterialTypes(typesRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLotsForMaterial = async (materialId) => {
    try {
      const res = await api.get(`/material-lot/get-lots-by-material/${materialId}`);
      setLots(res.data);
    } catch (error) {
      console.error('Error fetching lots:', error);
    }
  };

  // Material Type handlers
  const handleAddMaterialType = async (typeData) => {
    try {
      await api.post('/material-type/add-material-type', typeData);
      fetchAllData();
    } catch (error) {
      console.error('Error adding material type:', error);
      alert('Error adding material type: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUpdateMaterialType = async (typeData) => {
    try {
      await api.put(`/material-type/update-material-type/${selectedMaterialType._id}`, typeData);
      fetchAllData();
      setSelectedMaterialType(null);
    } catch (error) {
      console.error('Error updating material type:', error);
      alert('Error updating material type');
    }
  };

  const handleDeleteMaterialType = async (id) => {
    if (!confirm('Are you sure you want to delete this material type?')) return;

    try {
      await api.delete(`/material-type/delete-material-type/${id}`);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting material type:', error);
      alert('Error deleting material type');
    }
  };

  const openTypeModal = (type = null) => {
    setSelectedMaterialType(type);
    setShowTypeModal(true);
  };

  const closeTypeModal = () => {
    setShowTypeModal(false);
    setSelectedMaterialType(null);
  };

  // Raw Material handlers
  const handleAddRawMaterial = async (materialData) => {
    try {
      await api.post('/raw-material/add-material', materialData);
      fetchAllData();
    } catch (error) {
      console.error('Error adding raw material:', error);
      alert('Error adding raw material: ' + (error?.message || JSON.stringify(error) || 'Unknown error'));
    }
  };

  const handleUpdateRawMaterial = async (materialData) => {
    try {
      await api.put(`/raw-material/update-material/${selectedMaterial._id}`, materialData);
      fetchAllData();
      setSelectedMaterial(null);
    } catch (error) {
      console.error('Error updating raw material:', error);
      alert('Error updating raw material: ' + (error?.message || JSON.stringify(error) || 'Unknown error'));
    }
  };

  const handleDeleteRawMaterial = async (id) => {
    if (!confirm('Are you sure you want to delete this raw material?')) return;

    try {
      await api.delete(`/raw-material/delete-material/${id}`);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting raw material:', error);
      alert('Error deleting raw material: ' + (error?.message || JSON.stringify(error) || 'Unknown error'));
    }
  };

  const openMaterialModal = (material = null) => {
    setSelectedMaterial(material);
    setShowMaterialModal(true);
  };

  const closeMaterialModal = () => {
    setShowMaterialModal(false);
    setSelectedMaterial(null);
  };

  const handleViewLots = async (material) => {
    setSelectedMaterial(material);
    await fetchLotsForMaterial(material._id);
    setShowLotsModal(true);
  };

  const handleAddReprocess = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/raw-material/add-reprocess/${reprocessModal._id}`, {
        weight: parseFloat(reprocessForm.weight),
        pricePerKg: parseFloat(reprocessForm.pricePerKg)
      });
      fetchAllData();
      setReprocessModal(null);
      setReprocessForm({ weight: '', pricePerKg: '' });
    } catch (error) {
      alert('Error adding reprocess: ' + (error?.message || JSON.stringify(error)));
    }
  };

  const filteredMaterialTypes = materialTypes.filter(mt =>
    mt.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mt.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMaterials = materials.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.materialCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockMaterials = materials.filter(m =>
    m.inventory.totalWeight < m.reorderLevel
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Raw Materials Management</h1>
        <p className="text-gray-600">Manage material types, inventory, and procurement lots</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Material Types</div>
              <div className="text-2xl font-bold">{materialTypes.length}</div>
            </div>
            <Layers className="text-purple-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Materials</div>
              <div className="text-2xl font-bold">{materials.length}</div>
            </div>
            <Package className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Active Lots</div>
              <div className="text-2xl font-bold">
                {materials.reduce((sum, m) => sum + (m.inventory?.activeLots || 0), 0)}
              </div>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Low Stock Items</div>
              <div className="text-2xl font-bold text-orange-600">{lowStockMaterials.length}</div>
            </div>
            <AlertTriangle className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('types')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'types'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Material Types ({materialTypes.length})
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'inventory'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Inventory ({materials.length})
            </button>
            <button
              onClick={() => setActiveTab('reprocessed')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'reprocessed'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Reprocessed Items ({materials.filter(m => (m.reprocessInventory?.totalWeight || 0) > 0).length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Material Types Tab */}
          {activeTab === 'types' && (
            <div>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search material types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md"
                  />
                </div>
                <button
                  onClick={() => openTypeModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Add Material Type
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Name</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Category</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Density (g/cm³)</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Grade</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Standard</th>
                      <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredMaterialTypes.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No material types found. Click "Add Material Type" to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredMaterialTypes.map((type) => (
                        <tr key={type._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium">{type.name}</div>
                            {type.description && (
                              <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              type.category === 'metal' ? 'bg-gray-100 text-gray-800' :
                              type.category === 'plastic' ? 'bg-blue-100 text-blue-800' :
                              type.category === 'insulation' ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {type.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium">{type.density}</td>
                          <td className="px-6 py-4 text-sm">{type.specifications?.grade || '-'}</td>
                          <td className="px-6 py-4 text-sm">{type.specifications?.standard || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openTypeModal(type)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterialType(type._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md"
                  />
                </div>
                <button
                  onClick={() => openMaterialModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus size={20} />
                  Add Raw Material
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Code</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Material</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Category</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Stock (kg)</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Avg Price/kg</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Last Price/kg</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-purple-700">Reprocess (kg)</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-purple-700">Reprocess ₹/kg</th>
                      <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">Active Lots</th>
                      <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredMaterials.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="px-6 py-8 text-center text-gray-500">
                          No materials in inventory. Click "Add Raw Material" to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredMaterials.map((material) => {
                        const isLowStock = material.inventory.totalWeight < material.reorderLevel;
                        return (
                          <tr key={material._id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-orange-50' : ''}`}>
                            <td className="px-6 py-4 text-sm font-mono">{material.materialCode}</td>
                            <td className="px-6 py-4">
                              <div className="font-medium">{material.name}</div>
                              {material.specifications?.dimensions && (
                                <div className="text-xs text-gray-500">{material.specifications.dimensions}</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                material.category === 'metal' ? 'bg-gray-100 text-gray-800' :
                                material.category === 'plastic' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {material.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium">
                              {material.inventory?.totalWeight?.toFixed(2) || '0.00'}
                              {isLowStock && (
                                <span className="ml-2 text-orange-500">⚠</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              ₹{material.inventory?.avgPricePerKg?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              ₹{material.inventory?.lastPricePerKg?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-6 py-4 text-right text-purple-700 font-medium">
                              {(material.reprocessInventory?.totalWeight || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-purple-700">
                              {material.reprocessInventory?.pricePerKg
                                ? `₹${material.reprocessInventory.pricePerKg.toFixed(2)}`
                                : '—'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {material.inventory?.activeLots || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isLowStock ? (
                                <span className="text-xs text-orange-600 font-medium">Low Stock</span>
                              ) : (
                                <span className="text-xs text-green-600 font-medium">In Stock</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openMaterialModal(material)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                  title="Edit"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleViewLots(material)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                                  title="View Lots"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() => { setReprocessModal(material); setReprocessForm({ weight: '', pricePerKg: '' }); }}
                                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-md"
                                  title="Add Reprocess Stock"
                                >
                                  <RefreshCw size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteRawMaterial(material._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Reprocessed Items Tab */}
          {activeTab === 'reprocessed' && (() => {
            const allSorted = [...materials].sort((a, b) => {
              const aStock = a.reprocessInventory?.totalWeight || 0;
              const bStock = b.reprocessInventory?.totalWeight || 0;
              if (bStock > 0 && aStock === 0) return 1;
              if (aStock > 0 && bStock === 0) return -1;
              return a.name.localeCompare(b.name);
            });
            const withStock = allSorted.filter(m => (m.reprocessInventory?.totalWeight || 0) > 0);
            const totalValue = withStock.reduce((sum, m) =>
              sum + (m.reprocessInventory.totalWeight * m.reprocessInventory.pricePerKg), 0);
            const totalWeight = withStock.reduce((sum, m) =>
              sum + m.reprocessInventory.totalWeight, 0);

            return (
              <div>
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Materials with Reprocess Stock</div>
                    <div className="text-2xl font-bold text-purple-700">{withStock.length}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Reprocess Stock</div>
                    <div className="text-2xl font-bold text-purple-700">{totalWeight.toFixed(2)} kg</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Reprocess Value</div>
                    <div className="text-2xl font-bold text-purple-700">₹{totalValue.toFixed(2)}</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-50 border-b">
                      <tr>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Code</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Material</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Category</th>
                        <th className="text-right px-6 py-3 text-sm font-semibold text-purple-700">Reprocess Stock (kg)</th>
                        <th className="text-right px-6 py-3 text-sm font-semibold text-purple-700">Price/kg (₹)</th>
                        <th className="text-right px-6 py-3 text-sm font-semibold text-purple-700">Total Value (₹)</th>
                        <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {allSorted.map(material => {
                        const stock = material.reprocessInventory?.totalWeight || 0;
                        const price = material.reprocessInventory?.pricePerKg || 0;
                        const value = stock * price;
                        const hasStock = stock > 0;
                        return (
                          <tr
                            key={material._id}
                            className={hasStock ? 'bg-purple-50 hover:bg-purple-100' : 'hover:bg-gray-50'}
                          >
                            <td className="px-6 py-4 text-sm font-mono text-gray-500">{material.materialCode}</td>
                            <td className="px-6 py-4">
                              <div className="font-medium">{material.name}</div>
                              {material.specifications?.dimensions && (
                                <div className="text-xs text-gray-500">{material.specifications.dimensions}</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                material.category === 'metal' ? 'bg-gray-100 text-gray-800' :
                                material.category === 'plastic' ? 'bg-blue-100 text-blue-800' :
                                material.category === 'insulation' ? 'bg-purple-100 text-purple-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {material.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium">
                              {hasStock
                                ? <span className="text-purple-700">{stock.toFixed(2)}</span>
                                : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {hasStock
                                ? <span className="text-purple-700">₹{price.toFixed(2)}</span>
                                : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {hasStock
                                ? <span className="font-semibold text-purple-700">₹{value.toFixed(2)}</span>
                                : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => { setReprocessModal(material); setReprocessForm({ weight: '', pricePerKg: '' }); }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700"
                                title="Add Reprocess Stock"
                              >
                                <RefreshCw size={13} />
                                {hasStock ? 'Add More' : 'Add Stock'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {allSorted.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No materials found. Add raw materials in the Inventory tab first.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Reprocess Modal */}
      {reprocessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Add Reprocess Stock</h2>
                <p className="text-sm text-gray-500 mt-0.5">{reprocessModal.name}</p>
              </div>
              <button onClick={() => setReprocessModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleAddReprocess} className="p-6 space-y-4">
              {reprocessModal.reprocessInventory?.totalWeight > 0 && (
                <div className="bg-purple-50 rounded-lg p-3 text-sm">
                  <div className="text-purple-700 font-medium mb-1">Current Reprocess Inventory</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Stock: <strong>{reprocessModal.reprocessInventory.totalWeight.toFixed(2)} kg</strong></div>
                    <div>Avg Price: <strong>₹{reprocessModal.reprocessInventory.pricePerKg.toFixed(2)}/kg</strong></div>
                  </div>
                  <p className="text-xs text-purple-500 mt-1">New entry will be added to existing stock (weighted avg price updated)</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Weight to Add (kg) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={reprocessForm.weight}
                  onChange={e => setReprocessForm(f => ({ ...f, weight: e.target.value }))}
                  placeholder="e.g., 50"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price per kg (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={reprocessForm.pricePerKg}
                  onChange={e => setReprocessForm(f => ({ ...f, pricePerKg: e.target.value }))}
                  placeholder="e.g., 80"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-400 mt-1">Typically lower than fresh material cost</p>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setReprocessModal(null)} className="px-4 py-2 border rounded-md hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  Add Reprocess Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Type Modal */}
      <MaterialTypeModal
        open={showTypeModal}
        onClose={closeTypeModal}
        onSuccess={selectedMaterialType ? handleUpdateMaterialType : handleAddMaterialType}
        materialType={selectedMaterialType}
      />

      {/* Raw Material Modal */}
      <RawMaterialModal
        open={showMaterialModal}
        onClose={closeMaterialModal}
        onSuccess={selectedMaterial && selectedMaterial._id ? handleUpdateRawMaterial : handleAddRawMaterial}
        material={selectedMaterial}
        materialTypes={materialTypes}
        suppliers={suppliers}
      />

      {/* Lots Modal */}
      {showLotsModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selectedMaterial.name} - Lot Details</h2>
                <p className="text-sm text-gray-600 mt-1">
                  LIFO Order (Latest First) • {lots.length} Active Lots
                </p>
              </div>
              <button
                onClick={() => setShowLotsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Stock</div>
                  <div className="text-2xl font-bold">{selectedMaterial.inventory?.totalWeight?.toFixed(2)} kg</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Avg Price/kg</div>
                  <div className="text-2xl font-bold">₹{selectedMaterial.inventory?.avgPricePerKg?.toFixed(2)}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Last Purchase Price/kg</div>
                  <div className="text-2xl font-bold">₹{selectedMaterial.inventory?.lastPricePerKg?.toFixed(2)}</div>
                </div>
              </div>

              {/* Lots Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Lot Number</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Supplier</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Date</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold">Initial (kg)</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold">Remaining (kg)</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold">Price/kg</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Storage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lots.map((lot, index) => (
                      <tr key={lot._id} className={index === 0 ? 'bg-green-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-mono">
                          {lot.lotNumber}
                          {index === 0 && (
                            <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                              Will be consumed first
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {lot.supplierId?.supplierName || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(lot.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {lot.initialQuantity?.weight?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {lot.remainingQuantity?.weight?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          ₹{lot.pricing?.pricePerKg?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1">
                            {lot.storage?.location}
                            {lot.storage?.containerCount > 0 && (
                              <span className="text-xs text-gray-500">
                                ({lot.storage.containerCount})
                              </span>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {lots.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No active lots for this material
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowLotsModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RawMaterialsPage;
