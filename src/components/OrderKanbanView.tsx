import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Truck, 
  Edit3, 
  FileText, 
  Calendar, 
  Package, 
  ArrowRight, 
  ArrowLeft
} from 'lucide-react';
import { PurchaseOrder, OrderStatus } from '../types';
import { formatCurrency, formatDate, getDeliveryDeadlineStatus } from '../utils/calculations';
import { exportOrderToPdf } from '../utils/exportPdf';
import { useCustomization } from '../context/CustomizationContext';

interface OrderKanbanViewProps {
  orders: PurchaseOrder[];
  onEditOrder: (order: PurchaseOrder) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export const OrderKanbanView: React.FC<OrderKanbanViewProps> = ({
  orders,
  onEditOrder,
  onUpdateStatus,
  onShowToast,
}) => {
  const { storeSettings, layoutSettings, hasPermission } = useCustomization();
  const canViewCosts = hasPermission('orders_view_costs') && !layoutSettings.hideFinancialValues;

  const columns: { id: OrderStatus; title: string; icon: any; colorClass: string }[] = [
    { id: 'pending', title: '1. Pendentes', icon: Clock, colorClass: 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300' },
    { id: 'approved', title: '2. Em Produção', icon: Package, colorClass: 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300' },
    { id: 'in_transit', title: '3. Em Trânsito', icon: Truck, colorClass: 'border-purple-400 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-300' },
    { id: 'delivered', title: '4. Entregues', icon: CheckCircle2, colorClass: 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300' },
  ];

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'pending': return 'approved';
      case 'approved': return 'in_transit';
      case 'in_transit': return 'delivered';
      default: return null;
    }
  };

  const getPrevStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'delivered': return 'in_transit';
      case 'in_transit': return 'approved';
      case 'approved': return 'pending';
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
      {columns.map(col => {
        const columnOrders = orders.filter(o => o.status === col.id);
        const columnTotal = columnOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const columnPieces = columnOrders.reduce((sum, o) => sum + o.totalPieces, 0);
        const IconComponent = col.icon;

        return (
          <div
            key={col.id}
            className="bg-stone-50/60 dark:bg-stone-900/50 rounded-xl border border-brand-200/60 dark:border-stone-800 flex flex-col min-h-[480px]"
          >
            {/* Column Header */}
            <div className={`p-3 border-b-2 rounded-t-xl ${col.colorClass}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <IconComponent className="w-3.5 h-3.5" />
                  <h3 className="font-serif font-bold text-xs sm:text-sm">{col.title}</h3>
                </div>
                <span className="w-5 h-5 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                  {columnOrders.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] mt-1 opacity-85">
                <span>{columnPieces} pçs</span>
                <span className="font-mono font-semibold">
                  {canViewCosts ? formatCurrency(columnTotal) : 'R$ •••••'}
                </span>
              </div>
            </div>

            {/* Column Cards */}
            <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto">
              {columnOrders.length === 0 ? (
                <div className="text-center py-10 text-editorial-muted dark:text-stone-500 text-xs">
                  Nenhum pedido
                </div>
              ) : (
                columnOrders.map(order => {
                  const deadline = getDeliveryDeadlineStatus(order.expectedDeliveryDate, order.status);
                  const nextStatus = getNextStatus(order.status);
                  const prevStatus = getPrevStatus(order.status);

                  return (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-stone-900 rounded-lg p-3 border border-brand-200 dark:border-stone-800 shadow-soft hover:shadow-card transition-all space-y-2"
                    >
                      {/* Top Bar: Order & Deadline Badge */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-brand-900 dark:text-brand-300 text-xs">
                          {order.orderNumber}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${deadline.badgeClass}`}>
                          {deadline.shortLabel}
                        </span>
                      </div>

                      {/* Supplier & Collection */}
                      <div className="truncate">
                        <div className="font-semibold text-xs text-editorial-text dark:text-stone-200 truncate">
                          {order.supplierTradeName || order.supplierName}
                        </div>
                        <div className="text-[10px] text-editorial-muted dark:text-stone-400 truncate">
                          {order.collection} • {order.totalPieces} pçs
                        </div>
                      </div>

                      {/* Delivery Date & Amount */}
                      <div className="flex items-center justify-between pt-1 text-xs border-t border-stone-100 dark:border-stone-800">
                        <div className="text-[10px] text-editorial-muted dark:text-stone-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{formatDate(order.expectedDeliveryDate)}</span>
                        </div>
                        <div className="font-mono font-bold text-brand-800 dark:text-brand-300 text-xs">
                          {canViewCosts ? formatCurrency(order.totalAmount) : '•••••'}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onEditOrder(order)}
                            className="p-1 rounded text-stone-400 hover:text-brand-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              exportOrderToPdf(order, storeSettings);
                              onShowToast(`PDF ${order.orderNumber} gerado!`, 'success');
                            }}
                            className="p-1 rounded text-stone-400 hover:text-brand-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            title="PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Stage Movers */}
                        <div className="flex items-center space-x-1">
                          {prevStatus && (
                            <button
                              onClick={() => {
                                onUpdateStatus(order.id, prevStatus);
                                onShowToast(`Pedido retornado`, 'info');
                              }}
                              className="p-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs transition-colors"
                              title="Retornar etapa"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          {nextStatus && (
                            <button
                              onClick={() => {
                                onUpdateStatus(order.id, nextStatus);
                                onShowToast(`Pedido avançado`, 'success');
                              }}
                              className="px-2 py-0.5 rounded bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-semibold flex items-center space-x-0.5 transition-colors"
                              title="Avançar etapa"
                            >
                              <span>Avançar</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
