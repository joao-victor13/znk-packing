import React from 'react';
import { X, Printer, Download, FileSpreadsheet, Building2, Calendar, Package } from 'lucide-react';
import { PurchaseOrder } from '../types';
import { 
  formatCurrency, 
  formatDate, 
  formatCNPJ, 
  formatPhone, 
  getDeliveryDeadlineStatus 
} from '../utils/calculations';
import { exportOrderToPdf } from '../utils/exportPdf';
import { exportOrderToExcel } from '../utils/exportExcel';
import { useCustomization } from '../context/CustomizationContext';

interface OrderPreviewModalProps {
  order: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderPreviewModal: React.FC<OrderPreviewModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { storeSettings } = useCustomization();
  if (!isOpen || !order) return null;

  const deadline = getDeliveryDeadlineStatus(order.expectedDeliveryDate, order.status);
  const itemsSubtotal = order.items.reduce((acc, i) => acc + i.subtotal, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl border border-brand-300 shadow-dropdown max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Actions */}
        <div className="p-4 bg-brand-50 border-b border-brand-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-brand-900 text-sm">
              {order.orderNumber}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${deadline.badgeClass}`}>
              {deadline.label}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-medium flex items-center space-x-1 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={() => exportOrderToExcel(order)}
              className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-medium flex items-center space-x-1 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={() => exportOrderToPdf(order, storeSettings)}
              className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body (Printable Purchase Order Layout) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-editorial-text bg-white">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-brand-600 pb-4 gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-brand-900 uppercase">
                {storeSettings.storeName || 'ZNK PACKING'}
              </h1>
              <p className="text-xs uppercase font-semibold tracking-wider text-brand-700">
                {storeSettings.tagline || 'Moda Feminina & Confecção Premium'}
              </p>
              <p className="text-[11px] text-editorial-muted mt-1">
                CNPJ: {formatCNPJ(storeSettings.cnpj)} | {storeSettings.email} | {storeSettings.city} - {storeSettings.state}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                Ordem de Compra
              </div>
              <div className="text-xl font-mono font-bold text-editorial-text">
                Nº {order.orderNumber}
              </div>
              <div className="text-xs text-editorial-muted mt-1">
                Emissão: <strong>{formatDate(order.issueDate)}</strong>
              </div>
              <div className="text-xs text-brand-800 font-semibold">
                Previsão de Entrega: <strong>{formatDate(order.expectedDeliveryDate)}</strong>
              </div>
            </div>
          </div>

          {/* 2-Column Info Boxes: Supplier vs Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Box 1: Supplier */}
            <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-200 space-y-1.5">
              <span className="font-bold text-brand-800 uppercase tracking-wider block text-[10px]">
                Dados do Fornecedor / Oficina
              </span>
              <div className="font-bold text-sm text-editorial-text">
                {order.supplierTradeName || order.supplierName}
              </div>
              <div className="text-editorial-muted">
                <strong>Razão Social:</strong> {order.supplierName}
              </div>
              <div className="text-editorial-muted font-mono">
                <strong>CNPJ:</strong> {formatCNPJ(order.supplierCnpj || '')}
              </div>
              <div className="text-editorial-muted">
                <strong>Contato Comercial:</strong> {order.supplierContact || '-'}
              </div>
              <div className="text-editorial-muted">
                <strong>WhatsApp / Tel:</strong> {formatPhone(order.supplierPhone || '')}
              </div>
            </div>

            {/* Box 2: Terms & Logistics */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
              <span className="font-bold text-brand-800 uppercase tracking-wider block text-[10px]">
                Condições Comerciais & Entrega
              </span>
              <div>
                <strong>Condição de Pagamento:</strong> {order.paymentTerms}
              </div>
              <div>
                <strong>Coleção:</strong> {order.collection}
              </div>
              <div>
                <strong>Transportadora:</strong> {order.shippingCarrier || 'FOB / A combinar'}
              </div>
              <div>
                <strong>Status Atual:</strong> <span className="capitalize font-semibold">{order.status}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-brand-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-brand-100/60 border-b border-brand-200 text-[11px] font-bold text-editorial-text uppercase">
                  <th className="py-2.5 px-3 text-center w-8">#</th>
                  <th className="py-2.5 px-3">REF / SKU</th>
                  <th className="py-2.5 px-3">Descrição do Produto</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Cor</th>
                  <th className="py-2.5 px-3 text-right">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Custo Unit.</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-brand-50/20">
                    <td className="py-2 px-3 text-center text-editorial-muted font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono font-bold text-brand-900">{item.sku}</td>
                    <td className="py-2 px-3 font-medium">{item.description || '-'}</td>
                    <td className="py-2 px-3 text-stone-600">{item.category}</td>
                    <td className="py-2 px-3 text-stone-700">{item.size}</td>
                    <td className="py-2 px-3 flex items-center space-x-1.5">
                      {item.colorHex && (
                        <span
                          className="w-3 h-3 rounded-full border border-stone-300 flex-shrink-0"
                          style={{ backgroundColor: item.colorHex }}
                        />
                      )}
                      <span>{item.color}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold">{item.quantity}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.unitCost)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes & Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
              <strong className="block font-semibold text-editorial-text">Observações & Instruções:</strong>
              <p className="text-editorial-muted leading-relaxed">
                {order.notes || 'Sem observações adicionais.'}
              </p>
            </div>

            <div className="p-4 bg-brand-50/70 rounded-xl border border-brand-300 space-y-2 text-xs">
              <div className="flex justify-between text-editorial-muted">
                <span>Volume Total de Peças:</span>
                <strong className="font-mono text-editorial-text">{order.totalPieces} un</strong>
              </div>
              <div className="flex justify-between text-editorial-muted">
                <span>Subtotal Itens:</span>
                <strong className="font-mono text-editorial-text">{formatCurrency(itemsSubtotal)}</strong>
              </div>
              {order.shippingCost ? (
                <div className="flex justify-between text-editorial-muted">
                  <span>Frete (+):</span>
                  <strong className="font-mono text-editorial-text">{formatCurrency(order.shippingCost)}</strong>
                </div>
              ) : null}
              {order.discount ? (
                <div className="flex justify-between text-rose-700">
                  <span>Desconto (-):</span>
                  <strong className="font-mono text-rose-800">{formatCurrency(order.discount)}</strong>
                </div>
              ) : null}
              <div className="pt-2 border-t border-brand-200 flex justify-between items-baseline text-brand-900 font-bold">
                <span className="text-sm">VALOR TOTAL DO PEDIDO:</span>
                <span className="text-lg font-serif">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs text-editorial-muted border-t border-stone-200">
            <div>
              <div className="border-b border-stone-400 w-3/4 mx-auto mb-2"></div>
              <span>{(storeSettings.storeName || 'ZNK PACKING').toUpperCase()} - Gestão de Compras</span>
            </div>
            <div>
              <div className="border-b border-stone-400 w-3/4 mx-auto mb-2"></div>
              <span>Aceite e Confirmação do Fornecedor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
