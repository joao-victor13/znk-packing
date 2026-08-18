import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Copy, 
  FileText, 
  FileSpreadsheet, 
  MessageCircle, 
  Calendar, 
  Building2, 
  AlertCircle, 
  Sparkles,
  Layers,
  ChevronDown,
  Palette,
  Truck,
  DollarSign
} from 'lucide-react';
import { 
  PurchaseOrder, 
  OrderItem, 
  Supplier, 
  ProductCategory
} from '../types';
import { 
  calculateItemSubtotal, 
  calculateOrderTotals, 
  getDeliveryDeadlineStatus, 
  formatCurrency, 
  formatDate,
  formatCNPJ, 
  formatPhone,
  generateNextOrderNumber,
  generateUUID
} from '../utils/calculations';
import { 
  FASHION_COLORS, 
  PAYMENT_TERMS_OPTIONS, 
  PRODUCT_CATALOG_SUGGESTIONS 
} from '../data/initialData';
import { exportOrderToPdf } from '../utils/exportPdf';
import { exportOrderToExcel } from '../utils/exportExcel';
import { useCustomization } from '../context/CustomizationContext';

interface OrderEditorProps {
  orderToEdit?: PurchaseOrder | null;
  existingOrders: PurchaseOrder[];
  suppliers: Supplier[];
  onSave: (order: PurchaseOrder) => void;
  onCancel: () => void;
  onOpenNewSupplierModal: () => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'error') => void;
  onPreviewPrint: (order: PurchaseOrder) => void;
}

export const OrderEditor: React.FC<OrderEditorProps> = ({
  orderToEdit,
  existingOrders,
  suppliers,
  onSave,
  onCancel,
  onOpenNewSupplierModal,
  onShowToast,
  onPreviewPrint,
}) => {
  const { categories, storeSettings, layoutSettings, hasPermission } = useCustomization();

  // Generate empty item template
  const createEmptyItem = (index?: number): OrderItem => ({
    id: generateUUID(),
    sku: index !== undefined ? `REF-${String(index + 1).padStart(3, '0')}` : '',
    description: '',
    category: categories[0]?.name || 'Vestidos',
    sizeGridType: 'letter',
    size: 'Grade P/M/G',
    color: 'Off-White',
    colorHex: '#FAF9F6',
    quantity: 10,
    unitCost: 0,
    subtotal: 0,
    notes: '',
  });

  // State for order header
  const [orderNumber, setOrderNumber] = useState<string>(
    orderToEdit ? orderToEdit.orderNumber : generateNextOrderNumber(existingOrders)
  );
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    orderToEdit ? orderToEdit.supplierId : (suppliers[0]?.id || '')
  );
  const [issueDate, setIssueDate] = useState<string>(
    orderToEdit ? orderToEdit.issueDate : new Date().toISOString().split('T')[0]
  );
  
  // Default delivery date: 18 days from now
  const getDefaultDeliveryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 18);
    return d.toISOString().split('T')[0];
  };

  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    orderToEdit ? orderToEdit.expectedDeliveryDate : getDefaultDeliveryDate()
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    orderToEdit ? orderToEdit.paymentTerms : (suppliers[0]?.defaultPaymentTerms || PAYMENT_TERMS_OPTIONS[0])
  );
  const [status, setStatus] = useState<PurchaseOrder['status']>(
    orderToEdit ? orderToEdit.status : 'pending'
  );
  const [collection, setCollection] = useState<string>(
    orderToEdit ? orderToEdit.collection : 'Alto Verão 2026 - Cápsula Resort'
  );
  const [shippingCarrier, setShippingCarrier] = useState<string>(
    orderToEdit?.shippingCarrier || 'Braspress Cargas Rápidas'
  );
  const [shippingCost, setShippingCost] = useState<number>(
    orderToEdit?.shippingCost || 0
  );
  const [discount, setDiscount] = useState<number>(
    orderToEdit?.discount || 0
  );
  const [notes, setNotes] = useState<string>(
    orderToEdit?.notes || 'Conferir referências e embalagem individual com cabides e tags da ZNK Atelier.'
  );

  // Items State (The Dynamic Grid)
  const [items, setItems] = useState<OrderItem[]>(
    orderToEdit?.items && orderToEdit.items.length > 0
      ? orderToEdit.items
      : [createEmptyItem(0), createEmptyItem(1), createEmptyItem(2)]
  );

  // Color picker popup active state
  const [activeColorPickerRowIndex, setActiveColorPickerRowIndex] = useState<number | null>(null);
  const [activeCatalogRowIndex, setActiveCatalogRowIndex] = useState<number | null>(null);

  // Reference to last input for auto-focusing on new row
  const tableRef = useRef<HTMLTableElement>(null);

  // Selected supplier details
  const currentSupplier = suppliers.find(s => s.id === selectedSupplierId);

  // Update payment terms default when supplier changes if creating new order
  const handleSupplierChange = (supId: string) => {
    setSelectedSupplierId(supId);
    const sup = suppliers.find(s => s.id === supId);
    if (sup && !orderToEdit) {
      if (sup.defaultPaymentTerms) {
        setPaymentTerms(sup.defaultPaymentTerms);
      }
      if (sup.averageLeadDays) {
        const d = new Date(issueDate || new Date().toISOString().split('T')[0]);
        d.setDate(d.getDate() + sup.averageLeadDays);
        setExpectedDeliveryDate(d.toISOString().split('T')[0]);
      }
    }
  };

  // Recalculate item subtotal
  const updateItemField = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitCost') {
      const q = field === 'quantity' ? Number(value) : item.quantity;
      const c = field === 'unitCost' ? Number(value) : item.unitCost;
      item.subtotal = calculateItemSubtotal(q, c);
    }

    updated[index] = item;
    setItems(updated);
  };

  // Add new row
  const handleAddRow = () => {
    setItems(prev => [...prev, createEmptyItem(prev.length)]);
    onShowToast('Nova linha adicionada à planilha', 'info');
  };

  // Add full size run (P, M, G, GG) for selected catalog piece
  const handleAddFullSizeRun = () => {
    const sample = PRODUCT_CATALOG_SUGGESTIONS[Math.floor(Math.random() * PRODUCT_CATALOG_SUGGESTIONS.length)];
    const color = FASHION_COLORS[Math.floor(Math.random() * FASHION_COLORS.length)];
    const sizes = ['P (5 un)', 'M (10 un)', 'G (10 un)', 'GG (5 un)'];
    
    const newItems = sizes.map((sizeLabel, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      sku: `${sample.sku}-${sizeLabel.split(' ')[0]}`,
      description: `${sample.description} - Tam ${sizeLabel.split(' ')[0]}`,
      category: sample.category,
      sizeGridType: 'letter' as const,
      size: sizeLabel,
      color: color.name,
      colorHex: color.hex,
      quantity: sizeLabel.includes('10') ? 10 : 5,
      unitCost: sample.defaultCost,
      subtotal: calculateItemSubtotal(sizeLabel.includes('10') ? 10 : 5, sample.defaultCost),
      notes: 'Grade completa distribuída',
    }));

    setItems(prev => [...prev, ...newItems]);
    onShowToast(`Grade completa (${sample.category}) inserida com sucesso!`, 'success');
  };

  // Duplicate specific row
  const handleDuplicateRow = (index: number) => {
    const itemToClone = items[index];
    const cloned: OrderItem = {
      ...itemToClone,
      id: generateUUID(),
      sku: itemToClone.sku ? `${itemToClone.sku}-COP` : '',
    };
    const updated = [...items];
    updated.splice(index + 1, 0, cloned);
    setItems(updated);
    onShowToast('Item duplicado com sucesso', 'info');
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) {
      onShowToast('O pedido deve conter pelo menos 1 item.', 'error');
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Apply catalog template to item
  const handleSelectCatalogItem = (index: number, catItem: typeof PRODUCT_CATALOG_SUGGESTIONS[0]) => {
    const updated = [...items];
    const current = updated[index];
    const qty = current.quantity || 10;
    
    updated[index] = {
      ...current,
      sku: catItem.sku,
      description: catItem.description,
      category: catItem.category,
      unitCost: catItem.defaultCost,
      suggestedPrice: catItem.suggestedPrice,
      subtotal: calculateItemSubtotal(qty, catItem.defaultCost),
    };
    setItems(updated);
    setActiveCatalogRowIndex(null);
  };

  // Key navigation handler (Enter creates new row when in last inputs)
  const handleKeyDown = (e: React.KeyboardEvent, index: number, isLastField: boolean) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === items.length - 1 && isLastField) {
        handleAddRow();
      }
    }
  };

  // Calculate live totals
  const totals = calculateOrderTotals(items, shippingCost, discount);
  const deadlineInfo = getDeliveryDeadlineStatus(expectedDeliveryDate, status);

  // Validate and Save
  const handleSaveOrder = () => {
    if (!selectedSupplierId) {
      onShowToast('Por favor, selecione um Fornecedor.', 'error');
      return;
    }

    if (items.length === 0 || items.every(i => !i.sku && !i.description)) {
      onShowToast('Adicione pelo menos um produto com SKU ou Descrição.', 'error');
      return;
    }

    const sup = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

    const newOrder: PurchaseOrder = {
      id: orderToEdit ? orderToEdit.id : generateUUID(),
      orderNumber,
      supplierId: sup.id,
      supplierName: sup.tradeName || sup.corporateName || sup.name || 'Fornecedor',
      supplierTradeName: sup.tradeName,
      supplierCnpj: sup.cnpj,
      supplierContact: sup.contactName,
      supplierPhone: sup.phone,
      supplierEmail: sup.email,
      issueDate,
      expectedDeliveryDate,
      paymentTerms,
      status,
      collection,
      shippingCarrier,
      shippingCost: Number(shippingCost) || 0,
      discount: Number(discount) || 0,
      totalPieces: totals.totalPieces,
      totalAmount: totals.totalAmount,
      notes,
      items,
      createdAt: orderToEdit ? orderToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newOrder);
  };

  // Quick WhatsApp Share
  const handleShareWhatsApp = () => {
    const sup = suppliers.find(s => s.id === selectedSupplierId);
    const phone = sup?.phone.replace(/\D/g, '') || '';
    
    const storeTitle = (storeSettings.storeName || 'ZNK PACKING').toUpperCase();
    let text = `*${storeTitle} - ORDEM DE COMPRA Nº ${orderNumber}*\n`;
    text += `Olá ${sup?.contactName || 'Equipe Comercial'},\n\n`;
    text += `Segue nosso pedido de confecção formal:\n`;
    text += `📅 *Emissão:* ${formatDate(issueDate)} | *Previsão de Entrega:* ${formatDate(expectedDeliveryDate)}\n`;
    text += `👗 *Coleção:* ${collection}\n`;
    text += `💳 *Condição:* ${paymentTerms}\n\n`;
    text += `*RESUMO DOS ITENS:*\n`;
    
    items.forEach((item, idx) => {
      if (item.sku || item.description) {
        text += `${idx + 1}. *[${item.sku || 'REF'}]* ${item.description || item.category} | Tam: ${item.size} | Cor: ${item.color} | *${item.quantity} un* x ${formatCurrency(item.unitCost)} = ${formatCurrency(item.subtotal)}\n`;
      }
    });

    text += `\n📦 *Volume Total:* ${totals.totalPieces} peças`;
    text += `\n💰 *Valor Total do Pedido:* ${formatCurrency(totals.totalAmount)}`;
    if (notes) {
      text += `\n\n📌 *Obs:* ${notes}`;
    }
    text += `\n\nFavor confirmar recebimento e prazo de entrega.`;

    const url = phone
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
    onShowToast('Ordem de compra formatada para WhatsApp!', 'success');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-brand-200 shadow-soft sticky top-20 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-editorial-muted hover:text-editorial-text hover:bg-stone-100 transition-colors"
            title="Voltar para a listagem"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-editorial-text">
                {orderToEdit ? `Editar Pedido ${orderNumber}` : 'Novo Pedido de Compra'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${deadlineInfo.badgeClass}`}>
                {deadlineInfo.label}
              </span>
            </div>
            <p className="text-xs text-editorial-muted">
              Preencha os dados do cabeçalho e insira os itens diretamente na grade estilo planilha.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* WhatsApp share */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3 py-2 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-colors"
            title="Enviar Ordem de Compra por WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">WhatsApp</span>
          </button>

          {/* Export PDF */}
          <button
            type="button"
            onClick={() => {
              const currentSup = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];
              const tempOrder: PurchaseOrder = {
                id: orderToEdit ? orderToEdit.id : 'temp',
                orderNumber,
                supplierId: currentSup.id,
                supplierName: currentSup.tradeName || currentSup.corporateName || currentSup.name || 'Fornecedor',
                supplierTradeName: currentSup.tradeName,
                supplierCnpj: currentSup.cnpj,
                supplierContact: currentSup.contactName,
                supplierPhone: currentSup.phone,
                supplierEmail: currentSup.email,
                issueDate,
                expectedDeliveryDate,
                paymentTerms,
                status,
                collection,
                shippingCarrier,
                shippingCost: Number(shippingCost) || 0,
                discount: Number(discount) || 0,
                totalPieces: totals.totalPieces,
                totalAmount: totals.totalAmount,
                notes,
                items,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              exportOrderToPdf(tempOrder);
              onShowToast('PDF da Ordem de Compra gerado com sucesso!', 'success');
            }}
            className="px-3 py-2 rounded-lg border border-brand-300 text-brand-800 bg-brand-50 hover:bg-brand-100 text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-colors"
            title="Exportar Ordem de Compra em PDF Oficial"
          >
            <FileText className="w-4 h-4 text-brand-600" />
            <span className="hidden md:inline">PDF</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={() => {
              const currentSup = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];
              const tempOrder: PurchaseOrder = {
                id: orderToEdit ? orderToEdit.id : 'temp',
                orderNumber,
                supplierId: currentSup.id,
                supplierName: currentSup.tradeName || currentSup.corporateName || currentSup.name || 'Fornecedor',
                supplierTradeName: currentSup.tradeName,
                supplierCnpj: currentSup.cnpj,
                supplierContact: currentSup.contactName,
                supplierPhone: currentSup.phone,
                supplierEmail: currentSup.email,
                issueDate,
                expectedDeliveryDate,
                paymentTerms,
                status,
                collection,
                shippingCarrier,
                shippingCost: Number(shippingCost) || 0,
                discount: Number(discount) || 0,
                totalPieces: totals.totalPieces,
                totalAmount: totals.totalAmount,
                notes,
                items,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              exportOrderToExcel(tempOrder);
              onShowToast('Planilha Excel exportada com sucesso!', 'success');
            }}
            className="px-3 py-2 rounded-lg border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-colors"
            title="Exportar itens para planilha Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Excel</span>
          </button>

          {/* Primary Save Button */}
          <button
            type="button"
            onClick={handleSaveOrder}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Pedido</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Cabeçalho do Pedido (General Data) */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-brand-200 shadow-soft">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-100">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-editorial-text">
              1. Cabeçalho do Pedido & Condições Comerciais
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-editorial-muted">Nº Controle:</span>
            <input
              type="text"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              className="w-32 px-2.5 py-1 text-xs font-mono font-bold bg-brand-50 border border-brand-300 rounded text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-500 text-center"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fornecedor */}
          <div className="space-y-1.5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-editorial-text">
                Fornecedor / Oficina de Confecção *
              </label>
              <button
                type="button"
                onClick={onOpenNewSupplierModal}
                className="text-[11px] font-semibold text-brand-700 hover:text-brand-900 underline flex items-center"
              >
                + Novo Fornecedor
              </button>
            </div>
            <select
              value={selectedSupplierId}
              onChange={e => handleSupplierChange(e.target.value)}
              className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm font-medium text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {suppliers.map(sup => (
                <option key={sup.id} value={sup.id}>
                  {sup.tradeName || sup.name} ({sup.city}/{sup.state}) - {sup.categorySpecialty}
                </option>
              ))}
            </select>
            {currentSupplier && (
              <div className="mt-2 p-2.5 bg-brand-50/60 rounded-lg border border-brand-200/60 text-[11px] text-editorial-muted grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="font-semibold text-editorial-text block">CNPJ:</span>
                  {formatCNPJ(currentSupplier.cnpj)}
                </div>
                <div>
                  <span className="font-semibold text-editorial-text block">Contato Comercial:</span>
                  {currentSupplier.contactName}
                </div>
                <div>
                  <span className="font-semibold text-editorial-text block">WhatsApp:</span>
                  {formatPhone(currentSupplier.phone)}
                </div>
              </div>
            )}
          </div>

          {/* Condição de Pagamento */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-editorial-text">
              Condição de Pagamento *
            </label>
            <input
              type="text"
              list="payment-terms-list"
              value={paymentTerms}
              onChange={e => setPaymentTerms(e.target.value)}
              placeholder="Ex: 30 / 60 dias (Boleto)"
              className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <datalist id="payment-terms-list">
              {PAYMENT_TERMS_OPTIONS.map((opt, i) => (
                <option key={i} value={opt} />
              ))}
            </datalist>
          </div>

          {/* Status do Pedido */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-editorial-text">
              Status do Pedido
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as PurchaseOrder['status'])}
              className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm font-medium text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="draft">Rascunho (Não enviado)</option>
              <option value="pending">Pendente (Enviado ao Fornecedor)</option>
              <option value="approved">Aprovado / Em Produção</option>
              <option value="in_transit">Em Trânsito / Despachado</option>
              <option value="delivered">Entregue / Faturado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Data de Emissão */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-editorial-text flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-editorial-muted" />
              <span>Data de Emissão</span>
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={e => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Data de Previsão de Entrega com Alerta Visual */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-editorial-text flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                <span>Previsão de Entrega *</span>
              </label>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${deadlineInfo.badgeClass}`}>
                {deadlineInfo.shortLabel}
              </span>
            </div>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={e => setExpectedDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm font-semibold text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Coleção / Linha */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-editorial-text">
              Coleção / Cápsula
            </label>
            <input
              type="text"
              value={collection}
              onChange={e => setCollection(e.target.value)}
              placeholder="Ex: Alto Verão 2026"
              className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Transportadora */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-editorial-text flex items-center space-x-1">
              <Truck className="w-3.5 h-3.5 text-editorial-muted" />
              <span>Transportadora</span>
            </label>
            <input
              type="text"
              value={shippingCarrier}
              onChange={e => setShippingCarrier(e.target.value)}
              placeholder="Ex: Braspress, Jadlog, Sedex"
              className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Observações Gerais */}
          <div className="lg:col-span-4 space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-editorial-text">
              Observações & Instruções Especiais de Confecção / Embalagem
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Embalagem individual, dobrada em cabides, aviamentos de qualidade, etiqueta da ZNK Packing inclusa..."
              className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Grade Dinâmica de Produtos (Excel / Spreadsheet Data Grid) */}
      <div className="bg-white rounded-xl border border-brand-200 shadow-soft overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 bg-brand-50/70 border-b border-brand-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-brand-700" />
            <div>
              <h2 className="text-base font-serif font-bold text-editorial-text">
                2. Grade de Produtos & Linhas de Pedido (Planilha Dinâmica)
              </h2>
              <p className="text-xs text-editorial-muted">
                Edição inline direta. Pressione <kbd className="px-1.5 py-0.5 bg-white border border-stone-300 rounded font-mono text-[10px]">Enter</kbd> para criar nova linha ou use os botões rápidos.
              </p>
            </div>
          </div>

          {/* Quick Grid Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Linha</span>
            </button>

            <button
              type="button"
              onClick={handleAddFullSizeRun}
              className="px-3 py-1.5 rounded-lg bg-white border border-brand-300 text-brand-800 hover:bg-brand-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              title="Gera automaticamente 4 linhas com a grade padrão (P, M, G, GG)"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>+ Grade P/M/G/GG Rápida</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const sample = PRODUCT_CATALOG_SUGGESTIONS[Math.floor(Math.random() * PRODUCT_CATALOG_SUGGESTIONS.length)];
                const color = FASHION_COLORS[Math.floor(Math.random() * FASHION_COLORS.length)];
                setItems(prev => [
                  ...prev,
                  {
                    id: `item-${Date.now()}`,
                    sku: sample.sku,
                    description: sample.description,
                    category: sample.category,
                    sizeGridType: 'letter',
                    size: 'Grade P/M/G',
                    color: color.name,
                    colorHex: color.hex,
                    quantity: 20,
                    unitCost: sample.defaultCost,
                    suggestedPrice: sample.suggestedPrice,
                    subtotal: calculateItemSubtotal(20, sample.defaultCost),
                    notes: '',
                  }
                ]);
                onShowToast(`Modelo ${sample.description} adicionado!`, 'success');
              }}
              className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-editorial-text hover:bg-stone-50 text-xs font-medium flex items-center space-x-1 transition-colors"
            >
              <span>+ Sugerir Peça Catálogo</span>
            </button>
          </div>
        </div>

        {/* The Spreadsheet Grid Table */}
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-editorial-light border-b border-brand-200 text-[11px] font-semibold uppercase tracking-wider text-editorial-muted">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 w-36">Cód / SKU</th>
                <th className="py-2.5 px-3 w-64">Descrição do Modelo</th>
                <th className="py-2.5 px-3 w-36">Categoria</th>
                <th className="py-2.5 px-3 w-32">Grade / Tam</th>
                <th className="py-2.5 px-3 w-44">Cor / Variante</th>
                <th className="py-2.5 px-3 w-24 text-right">Qtd (un)</th>
                <th className="py-2.5 px-3 w-28 text-right">Custo Unit.</th>
                <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
                <th className="py-2.5 px-3 w-20 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70 text-xs">
              {items.map((item, index) => (
                <tr 
                  key={item.id}
                  className="hover:bg-brand-50/40 transition-colors group"
                >
                  {/* Row Number */}
                  <td className="py-2 px-3 text-center font-mono text-[11px] text-editorial-muted bg-stone-50/50">
                    {index + 1}
                  </td>

                  {/* SKU / Reference */}
                  <td className="py-1.5 px-2 relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={item.sku}
                        onChange={e => updateItemField(index, 'sku', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, index, false)}
                        placeholder="Ex: VEST-2401"
                        className="grid-cell-input font-mono font-medium text-brand-900 uppercase"
                      />
                      {/* Dropdown toggle for suggestions */}
                      <button
                        type="button"
                        onClick={() => setActiveCatalogRowIndex(activeCatalogRowIndex === index ? null : index)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-stone-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                        title="Ver sugestões do catálogo"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Catalog suggestion popup */}
                    {activeCatalogRowIndex === index && (
                      <div className="absolute left-2 top-full mt-1 z-50 w-72 bg-white rounded-lg border border-brand-300 shadow-dropdown p-2 max-h-60 overflow-y-auto">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-editorial-muted pb-1 mb-1 border-b">
                          Sugestões de Modelos
                        </div>
                        {PRODUCT_CATALOG_SUGGESTIONS.map((cat, ci) => (
                          <div
                            key={ci}
                            onClick={() => handleSelectCatalogItem(index, cat)}
                            className="p-1.5 rounded hover:bg-brand-50 cursor-pointer text-xs transition-colors flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-bold text-brand-800 mr-1.5">{cat.sku}</span>
                              <span className="text-editorial-text">{cat.description}</span>
                            </div>
                            <span className="text-[11px] font-mono text-emerald-700 font-semibold">{formatCurrency(cat.defaultCost)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Description */}
                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateItemField(index, 'description', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, index, false)}
                      placeholder="Nome ou detalhe do modelo..."
                      className="grid-cell-input font-medium"
                    />
                  </td>

                  {/* Category */}
                  <td className="py-1.5 px-2">
                    <select
                      value={item.category}
                      onChange={e => updateItemField(index, 'category', e.target.value as ProductCategory)}
                      className="grid-cell-input text-xs cursor-pointer font-medium text-stone-700"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Size / Grade */}
                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      value={item.size}
                      onChange={e => updateItemField(index, 'size', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, index, false)}
                      placeholder="P, M, G, 38-44"
                      className="grid-cell-input font-medium text-center"
                    />
                  </td>

                  {/* Color / Variant with Color Swatch Popup */}
                  <td className="py-1.5 px-2 relative">
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveColorPickerRowIndex(activeColorPickerRowIndex === index ? null : index)}
                        className="w-5 h-5 rounded-full border border-stone-300 shadow-2xs flex-shrink-0 flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: item.colorHex || '#FAF9F6' }}
                        title="Escolher paleta de cores de moda"
                      >
                        <Palette className="w-2.5 h-2.5 text-stone-700 opacity-50 hover:opacity-100 mix-blend-difference" />
                      </button>
                      <input
                        type="text"
                        value={item.color}
                        onChange={e => updateItemField(index, 'color', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, index, false)}
                        placeholder="Ex: Terracota"
                        className="grid-cell-input"
                      />
                    </div>

                    {/* Color Swatches Popup */}
                    {activeColorPickerRowIndex === index && (
                      <div className="absolute left-2 top-full mt-1 z-50 w-64 bg-white rounded-xl border border-brand-300 shadow-dropdown p-3">
                        <div className="text-[11px] font-semibold text-editorial-text mb-2 flex items-center justify-between">
                          <span>Paleta de Cores (Coleção)</span>
                          <button
                            type="button"
                            onClick={() => setActiveColorPickerRowIndex(null)}
                            className="text-stone-400 hover:text-stone-600 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                          {FASHION_COLORS.map(c => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => {
                                updateItemField(index, 'color', c.name);
                                updateItemField(index, 'colorHex', c.hex);
                                setActiveColorPickerRowIndex(null);
                              }}
                              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-stone-100 text-left text-xs transition-colors"
                            >
                              <span
                                className="w-4 h-4 rounded-full border border-stone-300 shadow-2xs flex-shrink-0"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="truncate text-stone-800 font-medium text-[11px]">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={e => updateItemField(index, 'quantity', Math.max(0, parseInt(e.target.value, 10) || 0))}
                      onKeyDown={e => handleKeyDown(e, index, false)}
                      className="grid-cell-input grid-cell-number font-bold text-brand-900"
                    />
                  </td>

                  {/* Unit Cost */}
                  <td className="py-1.5 px-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-editorial-muted font-mono pointer-events-none">
                        R$
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        value={item.unitCost === 0 ? '' : item.unitCost}
                        onChange={e => updateItemField(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        onKeyDown={e => handleKeyDown(e, index, true)}
                        className="grid-cell-input grid-cell-number pl-6 font-mono font-medium"
                      />
                    </div>
                  </td>

                  {/* Subtotal (Calculated) */}
                  <td className="py-2 px-3 text-right font-mono font-bold text-stone-900 bg-brand-50/20">
                    {formatCurrency(item.subtotal)}
                  </td>

                  {/* Row Actions */}
                  <td className="py-1.5 px-2 text-center">
                    <div className="flex items-center justify-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleDuplicateRow(index)}
                        className="p-1 rounded text-stone-500 hover:text-brand-700 hover:bg-brand-100 transition-colors"
                        title="Duplicar linha (Alt+D)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Excluir linha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Spreadsheet Footer: Add Row Bar */}
        <div className="p-3 bg-stone-50 border-t border-brand-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddRow}
            className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-brand-100/60 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar nova linha na planilha</span>
          </button>
          <span className="text-xs text-editorial-muted">
            Total de linhas: <strong className="text-editorial-text">{items.length}</strong> itens
          </span>
        </div>
      </div>

      {/* SECTION 3: Resumo Financeiro & Totais do Pedido */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left note/delivery warning */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-brand-200 shadow-soft space-y-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-editorial-text">
              Validação de Prazos & Custos de Confecção
            </h3>
          </div>
          <div className="p-3 rounded-lg bg-brand-50/50 border border-brand-200/60 text-xs text-editorial-muted space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Status do Prazo:</span>
              <span className={`font-semibold px-2 py-0.5 rounded border text-[11px] ${deadlineInfo.badgeClass}`}>
                {deadlineInfo.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tempo Estimado de Produção:</span>
              <span className="font-semibold text-editorial-text">{currentSupplier?.averageLeadDays || 18} dias úteis</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Custo Médio por Peça:</span>
              <span className="font-semibold text-brand-800">
                {totals.totalPieces > 0 ? formatCurrency(totals.totalAmount / totals.totalPieces) : 'R$ 0,00'} / peça
              </span>
            </div>
          </div>
        </div>

        {/* Right Financial Calculation Card */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-brand-300 shadow-card space-y-3">
          <h3 className="text-sm font-serif font-bold text-editorial-text uppercase tracking-wider pb-2 border-b border-stone-100">
            Resumo Financeiro do Pedido
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-editorial-muted">
              <span>Volume Total de Peças:</span>
              <span className="font-bold text-editorial-text font-mono text-sm">{totals.totalPieces} un</span>
            </div>

            <div className="flex items-center justify-between text-editorial-muted">
              <span>Subtotal dos Produtos:</span>
              <span className="font-semibold text-editorial-text font-mono text-sm">{formatCurrency(totals.itemsSubtotal)}</span>
            </div>

            {/* Frete Adicional */}
            <div className="flex items-center justify-between">
              <span className="text-editorial-muted flex items-center">
                Frete (+):
              </span>
              <div className="w-28 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-editorial-muted font-mono">R$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={shippingCost === 0 ? '' : shippingCost}
                  onChange={e => setShippingCost(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full pl-6 pr-2 py-1 bg-editorial-light border border-stone-200 rounded text-xs text-right font-mono font-medium focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Desconto */}
            <div className="flex items-center justify-between">
              <span className="text-editorial-muted flex items-center text-rose-700">
                Desconto / Bonificação (-):
              </span>
              <div className="w-28 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-rose-600 font-mono">R$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={discount === 0 ? '' : discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full pl-6 pr-2 py-1 bg-rose-50/50 border border-rose-200 rounded text-xs text-right font-mono font-medium text-rose-800 focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-brand-200 flex items-baseline justify-between">
              <span className="text-sm font-bold text-brand-900 uppercase">
                Valor Total Líquido:
              </span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-brand-700">
                {formatCurrency(totals.totalAmount)}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveOrder}
              className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all hover:shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Confirmar e Salvar Ordem de Compra</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
