import React, { useState } from 'react';
import { 
  Edit3, 
  FileText, 
  FileSpreadsheet, 
  MessageCircle, 
  Copy, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Building2, 
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
  const canEditOrders = hasPermission('orders_edit');
  const canDeleteOrders = hasPermission('orders_delete');

  // Expanded rows state
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendente', class: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/40' };
      case 'approved':
        return { label: 'Em Produção', class: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800/40' };
      case 'in_transit':
        return { label: 'Em Trânsito', class: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800/40' };
      case 'delivered':
        return { label: 'Entregue / Faturado', class: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/40' };
      case 'cancelled':
        return { label: 'Cancelado', class: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40' };
      default:
        return { label: status, class: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700' };
    }
  };

  const handleShareWhatsApp = (order: PurchaseOrder) => {
    const phone = order.supplierPhone ? order.supplierPhone.replace(/\D/g, '') : '';
    let text = `*ZNK PACKING - ACOMPANHAMENTO DO PEDIDO Nº ${order.orderNumber}*\n`;
    text += `Olá ${order.supplierContact || 'Equipe'},\n`;
    text += `Gostaríamos de confirmar o status da nossa produção:\n`;
    text += `📅 *Previsão de Entrega:* ${formatDate(order.expectedDeliveryDate)}\n`;
    text += `👗 *Total de Peças:* ${order.totalPieces} unidades\n`;
    text += `\nCaso tenha alguma atualização, por favor nos informe por aqui. Obrigado!`;

    const encodedText = encodeURIComponent(text);
    const url = phone ? `https://wa.me/55${phone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
    window.open(url, '_blank');
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-xl p-10 text-center border border-brand-200 dark:border-stone-800 shadow-soft">
        <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h3 className="font-serif font-bold text-base text-editorial-text dark:text-stone-100">
          Nenhum pedido encontrado
        </h3>
        <p className="text-xs text-editorial-muted dark:text-stone-400 mt-1 max-w-sm mx-auto">
          Crie um novo pedido ou ajuste os filtros da busca para visualizar as ordens de compra.
        </p>
        {hasPermission('orders_create') && (
          <button
            onClick={onNewOrder}
            className="mt-4 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs shadow-xs inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeiro Pedido</span>
          </button>
        )}
      </div>
    );
  }

  // Render list of orders table
  const renderOrdersTable = (orderList: PurchaseOrder[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[940px]">
        <thead>
          <tr className="bg-brand-50/80 dark:bg-stone-800 border-b border-brand-200 dark:border-stone-700 text-[11px] font-semibold uppercase tracking-wider text-editorial-muted dark:text-stone-300">
            <th className="py-2.5 px-3 w-10 text-center"></th>
            <th className="py-2.5 px-3 w-32">Nº Pedido</th>
            <th className="py-2.5 px-3 w-52">Fornecedor</th>
            <th className="py-2.5 px-3 w-36">Status</th>
            <th className="py-2.5 px-3 w-36">Entrega</th>
            <th className="py-2.5 px-3 w-28 text-right">Volume</th>
            {layoutSettings.showSuggestedPrice && (
              <th className="py-2.5 px-3 w-36 text-right">Varejo Sugerido</th>
            )}
            <th className="py-2.5 px-3 w-36 text-right">Valor Total</th>
            <th className="py-2.5 px-3 w-40 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200/70 dark:divide-stone-800 text-xs">
          {orderList.map(order => {
            const isExpanded = !!expandedOrders[order.id];
            const deadline = getDeliveryDeadlineStatus(order.expectedDeliveryDate, order.status);
            const statusBadge = getStatusBadge(order.status);
            const totalSuggestedRetail = order.items.reduce(
              (sum, it) => sum + ((it.suggestedPrice || it.unitCost * 2.2) * it.quantity),
              0
            );

            return (
              <React.Fragment key={order.id}>
                <tr className="hover:bg-brand-50/40 dark:hover:bg-stone-800/60 transition-colors group">
                  {/* Expand Chevron */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="p-1 text-stone-400 hover:text-brand-700 dark:hover:text-stone-200 rounded transition-colors cursor-pointer"
                      title={isExpanded ? 'Ocultar itens' : 'Ver itens do pedido'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-brand-700 dark:text-amber-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Order Number & Collection */}
                  <td className="py-2.5 px-3">
                    <div className="font-mono font-bold text-brand-900 dark:text-amber-400 text-xs sm:text-sm">
                      {order.orderNumber}
                    </div>
                    <div className="text-[10px] text-editorial-muted dark:text-stone-400 truncate max-w-[130px]" title={order.collection}>
                      {order.collection || 'Geral'}
                    </div>
                  </td>

                  {/* Supplier & Contact */}
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-editorial-text dark:text-stone-100 truncate max-w-[190px]" title={order.supplierTradeName || order.supplierName}>
                      {order.supplierTradeName || order.supplierName}
                    </div>
                    <div className="text-[10px] text-editorial-muted dark:text-stone-400 truncate">
                      {order.supplierContact || order.paymentTerms}
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-2.5 px-3">
                    {canEditOrders ? (
                      <select
                        value={order.status}
                        onChange={e => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer focus:outline-none ${statusBadge.class}`}
                      >
                        <option value="pending" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Pendente</option>
                        <option value="approved" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Em Produção</option>
                        <option value="in_transit" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Em Trânsito</option>
                        <option value="delivered" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Entregue</option>
                        <option value="cancelled" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Cancelado</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    )}
                  </td>

                  {/* Delivery Deadline with Alert Indicator */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-1 font-medium text-editorial-text dark:text-stone-200 text-xs">
                      <Calendar className="w-3 h-3 text-editorial-muted dark:text-stone-400" />
                      <span>{formatDate(order.expectedDeliveryDate)}</span>
                    </div>
                    <div className="mt-0.5">
                      <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold border ${deadline.badgeClass}`}>
                        <span className={`w-1 h-1 rounded-full mr-1 ${deadline.dotClass}`} />
                        {deadline.shortLabel}
                      </span>
                    </div>
                  </td>

                  {/* Volume (Pieces) */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="font-mono font-bold text-editorial-text dark:text-stone-100 text-xs sm:text-sm">
                      {order.totalPieces.toLocaleString('pt-BR')} <span className="text-[9px] font-normal text-editorial-muted dark:text-stone-400">un</span>
                    </div>
                    <div className="text-[10px] text-editorial-muted dark:text-stone-400">
                      {order.items.length} {order.items.length === 1 ? 'modelo' : 'modelos'}
                    </div>
                  </td>

                  {/* Preço Sugerido (Varejo) se habilitado */}
                  {layoutSettings.showSuggestedPrice && (
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                        {formatCurrency(totalSuggestedRetail)}
                      </div>
                      <div className="text-[9px] text-editorial-muted dark:text-stone-400 truncate">
                        Sugerido Varejo
                      </div>
                    </td>
                  )}

                  {/* Total Amount */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="font-mono font-bold text-brand-800 dark:text-amber-400 text-xs sm:text-sm">
                      {canViewCosts ? formatCurrency(order.totalAmount) : 'R$ ••••••'}
                    </div>
                    <div className="text-[9px] text-editorial-muted dark:text-stone-400 truncate">
                      {order.paymentTerms ? order.paymentTerms.split('(')[0] : 'À vista'}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-0.5">
                      {/* Edit */}
                      {canEditOrders && (
                        <button
                          onClick={() => onEditOrder(order)}
                          className="p-1 rounded text-stone-500 dark:text-stone-400 hover:text-brand-800 dark:hover:text-amber-300 hover:bg-brand-50 dark:hover:bg-stone-800 transition-colors"
                          title="Editar pedido"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* PDF */}
                      <button
                        onClick={() => {
                          exportOrderToPdf(order, storeSettings);
                          onShowToast(`PDF ${order.orderNumber} gerado!`, 'success');
                        }}
                        className="p-1 rounded text-stone-500 dark:text-stone-400 hover:text-brand-800 dark:hover:text-amber-300 hover:bg-brand-50 dark:hover:bg-stone-800 transition-colors"
                        title="Baixar PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-amber-400" />
                      </button>

                      {/* Excel */}
                      <button
                        onClick={() => {
                          exportOrderToExcel(order);
                          onShowToast(`Excel ${order.orderNumber} exportado!`, 'success');
                        }}
                        className="p-1 rounded text-stone-500 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                        title="Exportar Excel"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </button>

                      {/* WhatsApp */}
                      <button
                        onClick={() => handleShareWhatsApp(order)}
                        className="p-1 rounded text-stone-500 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                        title="Enviar por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </button>

                      {/* Duplicate */}
                      {canEditOrders && (
                        <button
                          onClick={() => onDuplicateOrder(order)}
                          className="p-1 rounded text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Duplicar pedido"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      {canDeleteOrders && (
                        <button
                          onClick={() => {
                            if (confirm(`Excluir o pedido ${order.orderNumber}?`)) {
                              onDeleteOrder(order.id);
                            }
                          }}
                          className="p-1 rounded text-stone-400 dark:text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Excluir pedido"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded Item Breakdown Drawer */}
                {isExpanded && (
                  <tr className="bg-brand-50/20 dark:bg-stone-950/60">
                    <td colSpan={layoutSettings.showSuggestedPrice ? 9 : 8} className="p-3 sm:p-4">
                      <div className="bg-white dark:bg-stone-900 rounded-lg border border-brand-200 dark:border-stone-800 shadow-xs p-3 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-800 dark:text-amber-400 flex items-center">
                            <Sparkles className="w-3 h-3 mr-1 text-brand-600 dark:text-amber-400" />
                            Grade do Pedido ({order.items.length} itens)
                          </span>
                          <span className="text-[10px] text-editorial-muted dark:text-stone-400">
                            Emissão: {formatDate(order.issueDate)} | Frete: {order.shippingCarrier || 'FOB'}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="text-[9px] uppercase font-semibold text-editorial-muted dark:text-stone-400 border-b border-stone-200 dark:border-stone-800 pb-1">
                                <th className="py-1 px-2">REF/SKU</th>
                                <th className="py-1 px-2">Descrição</th>
                                <th className="py-1 px-2">Categoria</th>
                                <th className="py-1 px-2">Tamanho</th>
                                <th className="py-1 px-2">Cor</th>
                                <th className="py-1 px-2 text-right">Qtd</th>
                                {layoutSettings.showSuggestedPrice && (
                                  <th className="py-1 px-2 text-right">Varejo Sug.</th>
                                )}
                                <th className="py-1 px-2 text-right">Custo</th>
                                <th className="py-1 px-2 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                              {order.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                                  <td className="py-1.5 px-2 font-mono font-bold text-brand-900 dark:text-amber-400">{item.sku}</td>
                                  <td className="py-1.5 px-2 font-medium text-editorial-text dark:text-stone-200">{item.description}</td>
                                  <td className="py-1.5 px-2 text-stone-600 dark:text-stone-400">{item.category}</td>
                                  <td className="py-1.5 px-2 text-stone-700 dark:text-stone-300 font-mono">{item.size}</td>
                                  <td className="py-1.5 px-2 flex items-center space-x-1.5">
                                    {item.colorHex && (
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-stone-300 dark:border-stone-600 flex-shrink-0"
                                        style={{ backgroundColor: item.colorHex }}
                                      />
                                    )}
                                    <span className="text-stone-800 dark:text-stone-200">{item.color}</span>
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-mono font-bold text-stone-900 dark:text-stone-100">{item.quantity}</td>
                                  {layoutSettings.showSuggestedPrice && (
                                    <td className="py-1.5 px-2 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                                      {formatCurrency(item.suggestedPrice || item.unitCost * 2.2)}
                                    </td>
                                  )}
                                  <td className="py-1.5 px-2 text-right font-mono text-stone-600 dark:text-stone-400">
                                    {canViewCosts ? formatCurrency(item.unitCost) : '••••'}
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-mono font-bold text-stone-900 dark:text-stone-100">
                                    {canViewCosts ? formatCurrency(item.subtotal) : '••••'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {order.notes && (
                          <div className="text-[10px] text-editorial-muted dark:text-stone-300 bg-stone-50 dark:bg-stone-800/60 p-1.5 rounded border border-stone-200 dark:border-stone-700">
                            <strong>Obs:</strong> {order.notes}
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
      <div className="space-y-4">
        {Object.entries(groupedMap).map(([supplierName, supOrders]) => {
          const totalPieces = supOrders.reduce((sum, o) => sum + o.totalPieces, 0);
          const totalAmount = supOrders.reduce((sum, o) => sum + o.totalAmount, 0);
          const totalRetail = supOrders.reduce(
            (sum, o) => sum + o.items.reduce((s, it) => s + ((it.suggestedPrice || it.unitCost * 2.2) * it.quantity), 0),
            0
          );

          return (
            <div key={supplierName} className="bg-white dark:bg-stone-900 rounded-xl border border-brand-200 dark:border-stone-800 shadow-soft overflow-hidden">
              <div className="p-3.5 bg-brand-50/60 dark:bg-stone-800 border-b border-brand-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-brand-700 dark:text-amber-400" />
                  <div>
                    <h3 className="font-serif font-bold text-sm text-editorial-text dark:text-stone-100">{supplierName}</h3>
                    <span className="text-[10px] text-editorial-muted dark:text-stone-400">{supOrders.length} {supOrders.length === 1 ? 'pedido' : 'pedidos'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-xs font-medium">
                  <div>
                    <span className="text-editorial-muted dark:text-stone-400">Peças: </span>
                    <strong className="font-mono text-editorial-text dark:text-stone-100">{totalPieces} un</strong>
                  </div>
                  {layoutSettings.showSuggestedPrice && (
                    <div>
                      <span className="text-editorial-muted dark:text-stone-400">Varejo: </span>
                      <strong className="font-mono text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                        {formatCurrency(totalRetail)}
                      </strong>
                    </div>
                  )}
                  <div>
                    <span className="text-editorial-muted dark:text-stone-400">Total: </span>
                    <strong className="font-mono text-brand-800 dark:text-amber-400 text-xs sm:text-sm">
                      {canViewCosts ? formatCurrency(totalAmount) : 'R$ ••••••'}
                    </strong>
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
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-brand-200 dark:border-stone-800 shadow-soft overflow-hidden">
      {renderOrdersTable(orders)}
    </div>
  );
};
