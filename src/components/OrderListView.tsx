import React, { useState } from 'react';
import { 
  Eye, 
  Edit3, 
  FileText, 
  FileSpreadsheet, 
  MessageCircle, 
  Copy, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Package, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  Sparkles,
  Plus
} from 'lucide-react';
import { PurchaseOrder, OrderStatus } from '../types';
import { 
  formatCurrency, 
  formatDate, 
  getDeliveryDeadlineStatus 
} from '../utils/calculations';
import { exportOrderToPdf } from '../utils/exportPdf';
import { exportOrderToExcel } from '../utils/exportExcel';
import { useCustomization } from '../context/CustomizationContext';

interface OrderListViewProps {
  orders: PurchaseOrder[];
  onEditOrder: (order: PurchaseOrder) => void;
  onDuplicateOrder: (order: PurchaseOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onNewOrder: () => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'error') => void;
  isGroupedBySupplier?: boolean;
}

export const OrderListView: React.FC<OrderListViewProps> = ({
  orders,
  onEditOrder,
  onDuplicateOrder,
  onDeleteOrder,
  onUpdateStatus,
  onNewOrder,
  onShowToast,
  isGroupedBySupplier = false,
}) => {
  const { storeSettings, layoutSettings, hasPermission } = useCustomization();
  const canViewCosts = hasPermission('orders_view_costs') && !layoutSettings.hideFinancialValues;

  // Expanded rows state
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'draft':
        return { label: 'Rascunho', class: 'bg-stone-100 text-stone-700 border-stone-300' };
      case 'pending':
        return { label: 'Pendente', class: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'approved':
        return { label: 'Em Produção', class: 'bg-blue-50 text-blue-800 border-blue-300' };
      case 'in_transit':
        return { label: 'Em Trânsito', class: 'bg-purple-50 text-purple-800 border-purple-300' };
      case 'delivered':
        return { label: 'Entregue / Faturado', class: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'cancelled':
        return { label: 'Cancelado', class: 'bg-rose-50 text-rose-800 border-rose-200' };
    }
  };

  const handleShareWhatsApp = (order: PurchaseOrder) => {
    const phone = order.supplierPhone ? order.supplierPhone.replace(/\D/g, '') : '';
    let text = `*ZNK PACKING - ACOMPANHAMENTO DO PEDIDO Nº ${order.orderNumber}*\n`;
    text += `Olá ${order.supplierContact || 'Equipe'},\n`;
    text += `Gostaríamos de confirmar o status da nossa produção:\n`;
    text += `📅 *Previsão de Entrega:* ${formatDate(order.expectedDeliveryDate)}\n`;
    text += `📦 *Total de Peças:* ${order.totalPieces} un | 💰 *Total:* ${formatCurrency(order.totalAmount)}\n`;
    text += `🏷️ *Coleção:* ${order.collection}\n\n`;
    text += `Podem nos confirmar a previsão de despacho? Obrigado!`;

    const url = phone
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
    onShowToast('Mensagem de WhatsApp formatada!', 'success');
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 border border-brand-200 shadow-soft text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center mx-auto text-brand-600">
          <Package className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-serif font-bold text-editorial-text">
            Nenhum pedido encontrado
          </h3>
          <p className="text-xs sm:text-sm text-editorial-muted max-w-md mx-auto mt-1">
            Não há pedidos de compra correspondentes aos filtros selecionados. Crie um novo pedido ou limpe os filtros.
          </p>
        </div>
        <button
          onClick={onNewOrder}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Primeiro Pedido de Compra</span>
        </button>
      </div>
    );
  }

  // Render list of orders table
  const renderOrdersTable = (orderList: PurchaseOrder[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[980px]">
        <thead>
          <tr className="bg-brand-50/70 border-b border-brand-200 text-[11px] font-semibold uppercase tracking-wider text-editorial-muted">
            <th className="py-3 px-3 w-10 text-center"></th>
            <th className="py-3 px-3 w-32">Nº Pedido</th>
            <th className="py-3 px-3 w-56">Fornecedor</th>
            <th className="py-3 px-3 w-36">Status</th>
            <th className="py-3 px-3 w-36">Previsão Entrega</th>
            <th className="py-3 px-3 w-28 text-right">Volume</th>
            <th className="py-3 px-3 w-36 text-right">Valor Total</th>
            <th className="py-3 px-3 w-48 text-center">Ações Rápidas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200/80 text-xs">
          {orderList.map(order => {
            const isExpanded = !!expandedOrders[order.id];
            const deadline = getDeliveryDeadlineStatus(order.expectedDeliveryDate, order.status);
            const statusBadge = getStatusBadge(order.status);

            return (
              <React.Fragment key={order.id}>
                <tr className="hover:bg-brand-50/30 transition-colors group">
                  {/* Expand Chevron */}
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="p-1 text-stone-400 hover:text-brand-700 rounded transition-colors"
                      title={isExpanded ? 'Ocultar itens' : 'Ver itens do pedido'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-brand-700" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Order Number & Collection */}
                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-brand-900 text-sm">
                      {order.orderNumber}
                    </div>
                    <div className="text-[11px] text-editorial-muted truncate max-w-[140px]" title={order.collection}>
                      {order.collection || 'Coleção Geral'}
                    </div>
                  </td>

                  {/* Supplier & Contact */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-editorial-text truncate max-w-[200px]" title={order.supplierTradeName || order.supplierName}>
                      {order.supplierTradeName || order.supplierName}
                    </div>
                    <div className="text-[11px] text-editorial-muted">
                      {order.supplierContact || order.paymentTerms}
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3 px-3">
                    <select
                      value={order.status}
                      onChange={e => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer focus:outline-none ${statusBadge.class}`}
                    >
                      <option value="draft">Rascunho</option>
                      <option value="pending">Pendente</option>
                      <option value="approved">Em Produção</option>
                      <option value="in_transit">Em Trânsito</option>
                      <option value="delivered">Entregue / Faturado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>

                  {/* Delivery Deadline with Alert Indicator */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1.5 font-medium text-editorial-text">
                      <Calendar className="w-3.5 h-3.5 text-editorial-muted" />
                      <span>{formatDate(order.expectedDeliveryDate)}</span>
                    </div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${deadline.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${deadline.dotClass}`} />
                        {deadline.label}
                      </span>
                    </div>
                  </td>

                  {/* Volume (Pieces) */}
                  <td className="py-3 px-3 text-right">
                    <div className="font-mono font-bold text-editorial-text text-sm">
                      {order.totalPieces.toLocaleString('pt-BR')} <span className="text-[10px] font-normal text-editorial-muted">un</span>
                    </div>
                    <div className="text-[11px] text-editorial-muted">
                      {order.items.length} {order.items.length === 1 ? 'modelo' : 'modelos'}
                    </div>
                  </td>

                  {/* Total Amount */}
                  <td className="py-3 px-3 text-right">
                    <div className="font-mono font-bold text-brand-800 text-sm">
                      {canViewCosts ? formatCurrency(order.totalAmount) : 'R$ ••••••'}
                    </div>
                    <div className="text-[10px] text-editorial-muted">
                      {order.paymentTerms.split('(')[0]}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {/* Edit */}
                      <button
                        onClick={() => onEditOrder(order)}
                        className="p-1.5 rounded-md text-stone-600 hover:text-brand-800 hover:bg-brand-100 transition-colors"
                        title="Editar pedido na planilha"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* PDF */}
                      <button
                        onClick={() => {
                          exportOrderToPdf(order, storeSettings);
                          onShowToast(`PDF do pedido ${order.orderNumber} gerado!`, 'success');
                        }}
                        className="p-1.5 rounded-md text-stone-600 hover:text-brand-800 hover:bg-brand-100 transition-colors"
                        title="Baixar Ordem de Compra em PDF"
                      >
                        <FileText className="w-4 h-4 text-brand-600" />
                      </button>

                      {/* Excel */}
                      <button
                        onClick={() => {
                          exportOrderToExcel(order);
                          onShowToast(`Excel do pedido ${order.orderNumber} exportado!`, 'success');
                        }}
                        className="p-1.5 rounded-md text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Exportar para Excel (.xlsx)"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      </button>

                      {/* WhatsApp */}
                      <button
                        onClick={() => handleShareWhatsApp(order)}
                        className="p-1.5 rounded-md text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Enviar resumo por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => onDuplicateOrder(order)}
                        className="p-1.5 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="Duplicar pedido"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir o pedido ${order.orderNumber}?`)) {
                            onDeleteOrder(order.id);
                          }
                        }}
                        className="p-1.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Excluir pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Item Breakdown Drawer */}
                {isExpanded && (
                  <tr className="bg-brand-50/20">
                    <td colSpan={8} className="p-4 sm:p-5">
                      <div className="bg-white rounded-lg border border-brand-200 shadow-xs p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-brand-800 flex items-center">
                            <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-600" />
                            Grade de Peças & Itens ({order.items.length} referências)
                          </span>
                          <span className="text-xs text-editorial-muted">
                            Emissão: {formatDate(order.issueDate)} | Transportadora: {order.shippingCarrier || 'FOB'}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="text-[10px] uppercase font-semibold text-editorial-muted border-b border-stone-200 pb-1">
                                <th className="py-1.5 px-2">REF/SKU</th>
                                <th className="py-1.5 px-2">Descrição</th>
                                <th className="py-1.5 px-2">Categoria</th>
                                <th className="py-1.5 px-2">Grade</th>
                                <th className="py-1.5 px-2">Cor</th>
                                <th className="py-1.5 px-2 text-right">Qtd</th>
                                <th className="py-1.5 px-2 text-right">Custo Unit.</th>
                                <th className="py-1.5 px-2 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {order.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-stone-50">
                                  <td className="py-1.5 px-2 font-mono font-bold text-brand-900">{item.sku}</td>
                                  <td className="py-1.5 px-2 font-medium text-editorial-text">{item.description}</td>
                                  <td className="py-1.5 px-2 text-stone-600">{item.category}</td>
                                  <td className="py-1.5 px-2 text-stone-700">{item.size}</td>
                                  <td className="py-1.5 px-2 flex items-center space-x-1.5">
                                    {item.colorHex && (
                                      <span
                                        className="w-3 h-3 rounded-full border border-stone-300 flex-shrink-0"
                                        style={{ backgroundColor: item.colorHex }}
                                      />
                                    )}
                                    <span>{item.color}</span>
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-mono font-bold">{item.quantity}</td>
                                  <td className="py-1.5 px-2 text-right font-mono">{formatCurrency(item.unitCost)}</td>
                                  <td className="py-1.5 px-2 text-right font-mono font-bold text-stone-900">{formatCurrency(item.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {order.notes && (
                          <div className="text-[11px] text-editorial-muted bg-stone-50 p-2 rounded border border-stone-200">
                            <strong>Instruções de confecção:</strong> {order.notes}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Grouped by Supplier Mode
  if (isGroupedBySupplier) {
    const groupedMap = orders.reduce<Record<string, PurchaseOrder[]>>((acc, order) => {
      const key = order.supplierTradeName || order.supplierName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(order);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {Object.entries(groupedMap).map(([supplierName, supOrders]) => {
          const totalPieces = supOrders.reduce((sum, o) => sum + o.totalPieces, 0);
          const totalAmount = supOrders.reduce((sum, o) => sum + o.totalAmount, 0);

          return (
            <div key={supplierName} className="bg-white rounded-xl border border-brand-200 shadow-soft overflow-hidden">
              <div className="p-4 bg-brand-50/60 border-b border-brand-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-brand-700" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-editorial-text">{supplierName}</h3>
                    <span className="text-xs text-editorial-muted">{supOrders.length} {supOrders.length === 1 ? 'pedido' : 'pedidos'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-xs font-medium">
                  <div>
                    <span className="text-editorial-muted">Peças: </span>
                    <strong className="font-mono text-editorial-text">{totalPieces} un</strong>
                  </div>
                  <div>
                    <span className="text-editorial-muted">Total: </span>
                    <strong className="font-mono text-brand-800 text-sm">{formatCurrency(totalAmount)}</strong>
                  </div>
                </div>
              </div>
              {renderOrdersTable(supOrders)}
            </div>
          );
        })}
      </div>
    );
  }

  // Standard Table View
  return (
    <div className="bg-white rounded-xl border border-brand-200 shadow-soft overflow-hidden">
      {renderOrdersTable(orders)}
    </div>
  );
};
