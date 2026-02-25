import { BrowserRouter, Route, Routes } from 'react-router-dom'
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
import LocationsPage from './pages/LocationsPage'

const App = () => {
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
          <Route path='purchase-orders' element={<PurchaseOrdersPage />} />
          <Route path='process-master' element={<ProcessMasterPage />} />
          <Route path='users' element={<UsersPage />} />
          <Route path='work-orders' element={<WorkOrdersPage />} />
          <Route path='work-orders/kanban' element={<WorkOrderKanbanPage />} />
          <Route path='work-order/:id' element={<WorkOrderDetailPage />} />
          <Route path='settings/locations' element={<LocationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
