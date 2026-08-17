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
  ArrowLeft,
  MessageCircle,
  Building2
} from 'lucide-react';
import { PurchaseOrder, OrderStatus } from '../types';
import { formatCurrency, formatDate, getDeliveryDeadlineStatus } from '../utils/calculations';
import { exportOrderToPdf } from '../utils/exportPdf';

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
  const columns: { id: OrderStatus; title: string; icon: any; colorClass: string }[] = [
    { id: 'pending', title: '1. Pendentes / Aguardando', icon: Clock, colorClass: 'border-amber-400 bg-amber-50/40 text-amber-900' },
    { id: 'approved', title: '2. Em Produção / Corte', icon: Package, colorClass: 'border-blue-400 bg-blue-50/40 text-blue-900' },
    { id: 'in_transit', title: '3. Em Trânsito / Despachado', icon: Truck, colorClass: 'border-purple-400 bg-purple-50/40 text-purple-900' },
    { id: 'delivered', title: '4. Entregues & Faturados', icon: CheckCircle2, colorClass: 'border-emerald-400 bg-emerald-50/40 text-emerald-900' },
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map(col => {
        const columnOrders = orders.filter(o => o.status === col.id);
        const columnTotal = columnOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const columnPieces = columnOrders.reduce((sum, o) => sum + o.totalPieces, 0);
        const IconComponent = col.icon;

        return (
          <div
            key={col.id}
            className="bg-stone-50/80 rounded-xl border border-brand-200/80 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className={`p-3.5 border-b-2 rounded-t-xl ${col.colorClass}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <IconComponent className="w-4 h-4" />
                  <h3 className="font-serif font-bold text-xs sm:text-sm">{col.title}</h3>
                </div>
                <span className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center text-xs font-bold font-mono">
                  {columnOrders.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1.5 opacity-80">
                <span>{columnPieces} peças</span>
                <span className="font-mono font-semibold">{formatCurrency(columnTotal)}</span>
              </div>
            </div>

            {/* Column Cards */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
              {columnOrders.length === 0 ? (
                <div className="text-center py-10 text-editorial-subtle text-xs">
                  Nenhum pedido nesta etapa
                </div>
              ) : (
                columnOrders.map(order => {
                  const deadline = getDeliveryDeadlineStatus(order.expectedDeliveryDate, order.status);
                  const nextStatus = getNextStatus(order.status);
                  const prevStatus = getPrevStatus(order.status);

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg p-3.5 border border-brand-200 shadow-soft hover:shadow-card transition-all space-y-3"
                    >
                      {/* Card Header: Order # & Deadline */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-brand-900 text-xs">
                          {order.orderNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${deadline.badgeClass}`}>
                          {deadline.shortLabel}
                        </span>
                      </div>

                      {/* Supplier & Collection */}
                      <div>
                        <div className="font-semibold text-xs text-editorial-text truncate" title={order.supplierTradeName || order.supplierName}>
                          {order.supplierTradeName || order.supplierName}
                        </div>
                        <div className="text-[11px] text-editorial-muted truncate">
                          {order.collection}
                        </div>
                      </div>

                      {/* Items mini summary */}
                      <div className="bg-stone-50 p-2 rounded text-[11px] text-editorial-muted space-y-0.5 border border-stone-100">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex justify-between truncate">
                            <span className="truncate">{item.sku} - {item.category}</span>
                            <span className="font-mono font-medium ml-1">{item.quantity}un</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-[10px] text-brand-700 font-semibold pt-0.5">
                            + {order.items.length - 2} outros modelos
                          </div>
                        )}
                      </div>

                      {/* Totals & Delivery Date */}
                      <div className="flex items-center justify-between pt-1 text-xs border-t border-stone-100">
                        <div className="text-[11px] text-editorial-muted flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{formatDate(order.expectedDeliveryDate)}</span>
                        </div>
                        <div className="font-mono font-bold text-brand-800 text-xs">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </div>

                      {/* Card Actions & Stage Movers */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onEditOrder(order)}
                            className="p-1 rounded text-stone-500 hover:text-brand-800 hover:bg-stone-100 transition-colors"
                            title="Editar pedido"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              exportOrderToPdf(order);
                              onShowToast(`PDF ${order.orderNumber} baixado!`, 'success');
                            }}
                            className="p-1 rounded text-stone-500 hover:text-brand-800 hover:bg-stone-100 transition-colors"
                            title="Exportar PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-brand-600" />
                          </button>
                        </div>

                        {/* Prev / Next Stage buttons */}
                        <div className="flex items-center space-x-1">
                          {prevStatus && (
                            <button
                              onClick={() => {
                                onUpdateStatus(order.id, prevStatus);
                                onShowToast(`Pedido movido para etapa anterior`, 'info');
                              }}
                              className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs transition-colors"
                              title="Retornar etapa"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          {nextStatus && (
                            <button
                              onClick={() => {
                                onUpdateStatus(order.id, nextStatus);
                                onShowToast(`Pedido avançado para próxima etapa`, 'success');
                              }}
                              className="px-2 py-1 rounded bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-semibold flex items-center space-x-0.5 shadow-2xs transition-colors"
                              title="Avançar etapa"
                            >
                              <span>Avançar</span>
                              <ArrowRight className="w-3 h-3" />
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
