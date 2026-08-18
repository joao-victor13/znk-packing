import React, { useState, useEffect, useCallback } from 'react';
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
import { LoginView } from './components/LoginView';
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
import { getDeliveryDeadlineStatus, generateUUID } from './utils/calculations';
import { CustomizationProvider, useCustomization } from './context/CustomizationContext';
import { 
  fetchOrdersFromSupabase, 
  fetchSuppliersFromSupabase,
  saveOrderToSupabase,
  updateOrderStatusInSupabase,
  deleteOrderFromSupabase,
  saveSupplierToSupabase,
  deleteSupplierFromSupabase,
  subscribeToOrders,
  subscribeToSuppliers
} from './services/supabaseClient';

function AppContent() {
  const { layoutSettings, isAuthenticated, currentUser, refreshCustomization } = useCustomization();

  // 1. Storage-backed state for Orders
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem('znk_fashion_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load orders from storage', e);
    }
    return INITIAL_ORDERS;
  });

  // 2. Storage-backed state for Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem('znk_fashion_suppliers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load suppliers from storage', e);
    }
    return INITIAL_SUPPLIERS;
  });

  // Synchronization with Supabase Database (Source of Truth)
  const syncCloudData = useCallback(async () => {
    try {
      const [cloudSuppliers, cloudOrders] = await Promise.all([
        fetchSuppliersFromSupabase(),
        fetchOrdersFromSupabase()
      ]);

      if (cloudSuppliers !== null) {
        setSuppliers(cloudSuppliers);
        localStorage.setItem('znk_fashion_suppliers', JSON.stringify(cloudSuppliers));
      }

      if (cloudOrders !== null) {
        setOrders(cloudOrders);
        localStorage.setItem('znk_fashion_orders', JSON.stringify(cloudOrders));
      }
    } catch (err) {
      console.warn('Could not sync with Supabase, using local cache', err);
    }
  }, []);

  // Multi-device & multi-network realtime subscription + auto-polling on focus
  useEffect(() => {
    // Initial sync
    syncCloudData();

    // 1. Realtime websockets listeners
    const unsubOrders = subscribeToOrders(async () => {
      try {
        const freshOrders = await fetchOrdersFromSupabase();
        if (freshOrders !== null) {
          setOrders(freshOrders);
          localStorage.setItem('znk_fashion_orders', JSON.stringify(freshOrders));
        }
      } catch (e) {
        console.warn('Realtime order update error:', e);
      }
    });

    const unsubSuppliers = subscribeToSuppliers(async () => {
      try {
        const freshSuppliers = await fetchSuppliersFromSupabase();
        if (freshSuppliers !== null) {
          setSuppliers(freshSuppliers);
          localStorage.setItem('znk_fashion_suppliers', JSON.stringify(freshSuppliers));
        }
      } catch (e) {
        console.warn('Realtime supplier update error:', e);
      }
    });

    // 2. Active Tab Focus & Visibility listeners (re-syncs immediately when user switches tabs or wakes up mobile phone)
    const handleFocus = () => {
      syncCloudData();
      refreshCustomization();
    };

    window.addEventListener('focus', handleFocus);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncCloudData();
        refreshCustomization();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Periodic background sync interval (every 12 seconds)
    const syncInterval = setInterval(() => {
      syncCloudData();
    }, 12000);

    return () => {
      unsubOrders();
      unsubSuppliers();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(syncInterval);
    };
  }, [syncCloudData, refreshCustomization]);

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
  const handleNewOrderForSupplier = (_supplier: Supplier) => {
    setOrderToEdit(null);
    setActiveView('editor');
  };

  // Edit existing order
  const handleEditOrder = (order: PurchaseOrder) => {
    setOrderToEdit(order);
    setActiveView('editor');
  };

  // Duplicate order
  const handleDuplicateOrder = async (order: PurchaseOrder) => {
    const nextNum = `PED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const cloned: PurchaseOrder = {
      ...order,
      id: generateUUID(),
      orderNumber: nextNum,
      status: 'pending',
      issueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOrders(prev => [cloned, ...prev]);
    showToast(`Pedido ${order.orderNumber} duplicado como ${nextNum}!`, 'success');
    
    const cloudOrder = await saveOrderToSupabase(cloned, currentUser?.id);
    if (cloudOrder) {
      setOrders(prev => prev.map(o => (o.id === cloned.id ? cloudOrder : o)));
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    showToast('Pedido excluído com sucesso.', 'info');
    await deleteOrderFromSupabase(orderId);
    const freshOrders = await fetchOrdersFromSupabase();
    if (freshOrders !== null) {
      setOrders(freshOrders);
      localStorage.setItem('znk_fashion_orders', JSON.stringify(freshOrders));
    }
  };

  // Quick Status Update
  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
    );
    showToast(`Status atualizado para: ${status}`, 'success');
    await updateOrderStatusInSupabase(orderId, status);
  };

  // Save Order from Editor
  const handleSaveOrder = async (savedOrder: PurchaseOrder) => {
    if (orderToEdit) {
      setOrders(prev => prev.map(o => (o.id === savedOrder.id ? savedOrder : o)));
      showToast(`Pedido ${savedOrder.orderNumber} atualizado!`, 'success');
    } else {
      setOrders(prev => [savedOrder, ...prev]);
      showToast(`Pedido ${savedOrder.orderNumber} registrado!`, 'success');
    }
    setActiveView('list');
    setOrderToEdit(null);

    const cloudOrder = await saveOrderToSupabase(savedOrder, currentUser?.id);
    if (cloudOrder) {
      setOrders(prev => prev.map(o => (o.id === savedOrder.id ? cloudOrder : o)));
    }
  };

  // Save Supplier
  const handleSaveSupplier = async (savedSupplier: Supplier) => {
    if (supplierToEdit) {
      setSuppliers(prev => prev.map(s => (s.id === savedSupplier.id ? savedSupplier : s)));
      showToast(`Fornecedor ${savedSupplier.tradeName} atualizado!`, 'success');
    } else {
      setSuppliers(prev => [...prev, savedSupplier]);
      showToast(`Fornecedor ${savedSupplier.tradeName} cadastrado!`, 'success');
    }
    setSupplierToEdit(null);

    const cloudSupplier = await saveSupplierToSupabase(savedSupplier);
    if (cloudSupplier) {
      setSuppliers(prev => prev.map(s => (s.id === savedSupplier.id ? cloudSupplier : s)));
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = async (supplierId: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    showToast('Fornecedor removido com sucesso.', 'info');
    await deleteSupplierFromSupabase(supplierId);
    const freshSuppliers = await fetchSuppliersFromSupabase();
    if (freshSuppliers !== null) {
      setSuppliers(freshSuppliers);
      localStorage.setItem('znk_fashion_suppliers', JSON.stringify(freshSuppliers));
    }
  };

  // If user is not authenticated, show login screen (Hooks already called above safely)
  if (!isAuthenticated) {
    return <LoginView />;
  }

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
    <div className="min-h-screen bg-editorial-light dark:bg-stone-950 text-editorial-text dark:text-stone-100 flex flex-col transition-colors">
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* VIEW 1: Order Editor (Full spreadsheet mode) */}
        {activeView === 'editor' && (
          <OrderEditor
            orderToEdit={orderToEdit}
            suppliers={suppliers}
            existingOrders={orders}
            onSave={handleSaveOrder}
            onCancel={() => {
              setActiveView('list');
              setOrderToEdit(null);
            }}
            onShowToast={showToast}
            onPreviewPrint={order => setPreviewOrder(order)}
            onOpenNewSupplierModal={() => {
              setSupplierToEdit(null);
              setIsSupplierModalOpen(true);
            }}
          />
        )}

        {/* VIEW 2: Settings & Customization Center */}
        {activeView === 'settings' && (
          <SettingsView onShowToast={showToast} />
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

            {/* Orders Data Grid or Kanban */}
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

      {/* Supplier Create/Edit Modal */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setSupplierToEdit(null);
        }}
        onSave={handleSaveSupplier}
        supplierToEdit={supplierToEdit}
      />

      {/* Printable Preview Document Modal */}
      {previewOrder && (
        <OrderPreviewModal
          isOpen={!!previewOrder}
          order={previewOrder}
          onClose={() => setPreviewOrder(null)}
        />
      )}

      {/* Global Toast Notifications */}
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
