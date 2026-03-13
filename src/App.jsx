import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import DashboardLayout from './layouts/DashboardLayout'
import CreateQuotePage from './pages/CreateQuotePage'
import QuotationsPage from './pages/QuotationsPage'
import CustomerPage from './pages/CustomerPage'
import SuppliersPage from './pages/SuppliersPage'
import RawMaterialsPage from './pages/RawMaterialsPage'
import PurchaseOrdersPage from './pages/PurchaseOrdersPage'
import ProcessMasterPage from './pages/ProcessMasterPage'
import UsersPage from './pages/UsersPage'
import WorkOrdersPage from './pages/WorkOrdersPage'
import WorkOrderDetailPage from './pages/WorkOrderDetailPage'
import WorkOrderKanbanPage from './pages/WorkOrderKanbanPage'
import WIPInventoryPage from './pages/WIPInventoryPage'
import FinishedGoodsPage from './pages/FinishedGoodsPage'
import LocationsPage from './pages/LocationsPage'
import EmployeeLoginPage from './pages/EmployeeLoginPage'
import EmployeeDashboardPage from './pages/EmployeeDashboardPage'
import IntermediateProductPage from './pages/IntermediateProductPage'
import CoreMasterPage from './pages/CoreMasterPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import EmployeeDashboardLayout from './layouts/EmployeeDashboardLayout'
import EmployeeDashboard from './pages/EmployeeDashboard'
import EmployeeProcessDetailPage from './pages/EmployeeProcessDetailPage'

const App = () => {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<DashboardLayout />}>
          {/* Default → quotations list */}
          <Route index element={<QuotationsPage />} />
          <Route path='dashboard' element={<QuotationsPage />} />

          {/* Quotation routes */}
          <Route path='quotations' element={<QuotationsPage />} />
          <Route path='quotation/create' element={<CreateQuotePage />} />
          <Route path='quotation/edit/:id' element={<CreateQuotePage />} />

          {/* Other pages */}
          <Route path='customers' element={<CustomerPage />} />
          <Route path='suppliers' element={<SuppliersPage />} />
          <Route path='inventory/raw' element={<RawMaterialsPage />} />
          <Route path='inventory/wip' element={<WIPInventoryPage />} />
          <Route path='inventory/finished' element={<FinishedGoodsPage />} />
          <Route path='purchase-orders' element={<PurchaseOrdersPage />} />
          <Route path='process-master' element={<ProcessMasterPage />} />
          <Route path='intermediate-products' element={<IntermediateProductPage />} />
          <Route path='users' element={<UsersPage />} />
          <Route path='work-orders' element={<WorkOrdersPage />} />
          <Route path='work-orders/kanban' element={<WorkOrderKanbanPage />} />
          <Route path='work-order/:id' element={<WorkOrderDetailPage />} />
          <Route path='settings/locations' element={<LocationsPage />} />
        </Route>

        {/* Employee Routes */}
        <Route path="/employee" element={<EmployeeDashboardLayout />}>
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="process/:id" element={<EmployeeProcessDetailPage />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
