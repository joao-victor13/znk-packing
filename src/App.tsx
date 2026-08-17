import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { FilterBar } from './components/FilterBar';
import { OrderListView } from './components/OrderListView';
import { OrderKanbanView } from './components/OrderKanbanView';
import { OrderEditor } from './components/OrderEditor';
import { SuppliersView } from './components/SuppliersView';
import { SupplierModal } from './components/SupplierModal';
import { OrderPreviewModal } from './components/OrderPreviewModal';
import { SettingsView } from './components/SettingsView';
import { ToastContainer, ToastData } from './components/Toast';
import { 
  PurchaseOrder, 
  Supplier, 
  OrderFilterState, 
  OrderStatus 
} from './types';
import { 
  INITIAL_ORDERS, 
  INITIAL_SUPPLIERS 
} from './data/initialData';
import { getDeliveryDeadlineStatus } from './utils/calculations';
import { CustomizationProvider, useCustomization } from './context/CustomizationContext';

function AppContent() {
  const { layoutSettings } = useCustomization();

  // 1. Storage-backed state for Orders
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem('znk_fashion_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load orders from storage', e);
    }
    return INITIAL_ORDERS;
  });

  // 2. Storage-backed state for Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem('znk_fashion_suppliers');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load suppliers from storage', e);
    }
    return INITIAL_SUPPLIERS;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem('znk_fashion_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('znk_fashion_suppliers', JSON.stringify(suppliers));
    } catch (e) {
      console.error('Failed to save suppliers', e);
    }
  }, [suppliers]);

  // Views & Modals state
  const [activeView, setActiveView] = useState<'list' | 'editor' | 'suppliers' | 'settings'>('list');
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrder | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grouped' | 'kanban'>(
    layoutSettings?.defaultViewMode || 'table'
  );
  
  // Suppliers Modal state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  // Preview Document Modal
  const [previewOrder, setPreviewOrder] = useState<PurchaseOrder | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Filter State
  const [filters, setFilters] = useState<OrderFilterState>({
    search: '',
    supplierId: 'all',
    status: 'all',
    periodMonth: 'all',
    deadlineToFilter: 'all',
    sortBy: 'date_desc',
  });

  // Available unique months from orders
  const availableMonths = Array.from(
    new Set(
      orders
        .map(o => o.issueDate ? o.issueDate.substring(0, 7) : '')
        .filter(Boolean)
    )
  ).sort().reverse();

  // Reset to initial demo dataset
  const handleResetToDemo = () => {
    if (confirm('Deseja restaurar os dados de demonstração da coleção?')) {
      setOrders(INITIAL_ORDERS);
      setSuppliers(INITIAL_SUPPLIERS);
      localStorage.removeItem('znk_fashion_orders');
      localStorage.removeItem('znk_fashion_suppliers');
      showToast('Dados restaurados para o padrão de demonstração.', 'info');
    }
  };

  // Create new order handler
  const handleNewOrder = () => {
    setOrderToEdit(null);
    setActiveView('editor');
  };

  // Create new order for specific supplier
  const handleNewOrderForSupplier = (supplier: Supplier) => {
    setOrderToEdit(null);
    setActiveView('editor');
  };

  // Edit existing order
  const handleEditOrder = (order: PurchaseOrder) => {
    setOrderToEdit(order);
    setActiveView('editor');
  };

  // Duplicate order
  const handleDuplicateOrder = (order: PurchaseOrder) => {
    const nextNum = `PED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const cloned: PurchaseOrder = {
      ...order,
      id: `ord-${Date.now()}`,
      orderNumber: nextNum,
      status: 'pending',
      issueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOrders(prev => [cloned, ...prev]);
    showToast(`Pedido ${order.orderNumber} duplicado como ${nextNum}!`, 'success');
  };

  // Delete order
  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    showToast('Pedido excluído com sucesso.', 'info');
  };

  // Quick Status Update
  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
    );
    showToast(`Status atualizado para: ${status}`, 'success');
  };

  // Save Order from Editor
  const handleSaveOrder = (savedOrder: PurchaseOrder) => {
    if (orderToEdit) {
      // Update
      setOrders(prev => prev.map(o => (o.id === savedOrder.id ? savedOrder : o)));
      showToast(`Pedido ${savedOrder.orderNumber} atualizado com sucesso!`, 'success');
    } else {
      // Create
      setOrders(prev => [savedOrder, ...prev]);
      showToast(`Pedido ${savedOrder.orderNumber} criado e registrado!`, 'success');
    }
    setActiveView('list');
    setOrderToEdit(null);
  };

  // Save Supplier
  const handleSaveSupplier = (savedSupplier: Supplier) => {
    if (supplierToEdit) {
      setSuppliers(prev => prev.map(s => (s.id === savedSupplier.id ? savedSupplier : s)));
      showToast(`Fornecedor ${savedSupplier.tradeName} atualizado!`, 'success');
    } else {
      setSuppliers(prev => [...prev, savedSupplier]);
      showToast(`Fornecedor ${savedSupplier.tradeName} cadastrado com sucesso!`, 'success');
    }
    setSupplierToEdit(null);
  };

  // Delete Supplier
  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    showToast('Fornecedor removido com sucesso.', 'info');
  };

  // Filter and Sort Orders
  const filteredOrders = orders.filter(order => {
    // 1. Text Search (Number, Supplier, SKU, Description)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchNumber = order.orderNumber.toLowerCase().includes(q);
      const matchSupplier = (order.supplierTradeName || order.supplierName).toLowerCase().includes(q);
      const matchCollection = order.collection.toLowerCase().includes(q);
      const matchItems = order.items.some(
        item => item.sku.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.color.toLowerCase().includes(q)
      );
      if (!matchNumber && !matchSupplier && !matchCollection && !matchItems) {
        return false;
      }
    }

    // 2. Supplier filter
    if (filters.supplierId !== 'all' && order.supplierId !== filters.supplierId) {
      return false;
    }

    // 3. Status filter
    if (filters.status !== 'all' && order.status !== filters.status) {
      return false;
    }

    // 4. Month filter
    if (filters.periodMonth !== 'all') {
      if (!order.issueDate || !order.issueDate.startsWith(filters.periodMonth)) {
        return false;
      }
    }

    // 5. Deadline filter
    if (filters.deadlineToFilter !== 'all') {
      const deadline = getDeliveryDeadlineStatus(order.expectedDeliveryDate, order.status);
      if (deadline.status !== filters.deadlineToFilter) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-editorial-light text-editorial-text flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeView={activeView}
        onNavigate={view => {
          setActiveView(view);
          if (view === 'list') setOrderToEdit(null);
        }}
        onNewOrder={handleNewOrder}
        orders={orders}
        onResetToDemo={handleResetToDemo}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: Settings & Customization Center */}
        {activeView === 'settings' && (
          <SettingsView onShowToast={showToast} />
        )}

        {/* VIEW 2: Editor (Spreadsheet Data Grid) */}
        {activeView === 'editor' && (
          <OrderEditor
            orderToEdit={orderToEdit}
            existingOrders={orders}
            suppliers={suppliers}
            onSave={handleSaveOrder}
            onCancel={() => {
              setActiveView('list');
              setOrderToEdit(null);
            }}
            onOpenNewSupplierModal={() => {
              setSupplierToEdit(null);
              setIsSupplierModalOpen(true);
            }}
            onShowToast={showToast}
            onPreviewPrint={order => setPreviewOrder(order)}
          />
        )}

        {/* VIEW 3: Suppliers Directory */}
        {activeView === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            orders={orders}
            onNewSupplier={() => {
              setSupplierToEdit(null);
              setIsSupplierModalOpen(true);
            }}
            onEditSupplier={sup => {
              setSupplierToEdit(sup);
              setIsSupplierModalOpen(true);
            }}
            onDeleteSupplier={handleDeleteSupplier}
            onNewOrderForSupplier={handleNewOrderForSupplier}
          />
        )}

        {/* VIEW 4: Orders Dashboard & List View */}
        {activeView === 'list' && (
          <>
            {/* KPI Stat Cards */}
            <DashboardStats
              orders={orders}
              activeDeadlineFilter={filters.deadlineToFilter}
              onSelectDeadlineFilter={deadlineToFilter =>
                setFilters(prev => ({ ...prev, deadlineToFilter }))
              }
            />

            {/* Filters and Search Bar */}
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              suppliers={suppliers}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              availableMonths={availableMonths}
            />

            {/* List / Grouped or Kanban Content */}
            {viewMode === 'kanban' ? (
              <OrderKanbanView
                orders={filteredOrders}
                onEditOrder={handleEditOrder}
                onUpdateStatus={handleUpdateStatus}
                onShowToast={showToast}
              />
            ) : (
              <OrderListView
                orders={filteredOrders}
                onEditOrder={handleEditOrder}
                onDuplicateOrder={handleDuplicateOrder}
                onDeleteOrder={handleDeleteOrder}
                onUpdateStatus={handleUpdateStatus}
                onNewOrder={handleNewOrder}
                onShowToast={showToast}
                isGroupedBySupplier={viewMode === 'grouped'}
              />
            )}
          </>
        )}
      </main>

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        supplierToEdit={supplierToEdit}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setSupplierToEdit(null);
        }}
        onSave={handleSaveSupplier}
      />

      {/* Order Preview Modal */}
      <OrderPreviewModal
        isOpen={!!previewOrder}
        order={previewOrder}
        onClose={() => setPreviewOrder(null)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export function App() {
  return (
    <CustomizationProvider>
      <AppContent />
    </CustomizationProvider>
  );
}

export default App;
