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
  DollarSign,
  RotateCcw,
  CheckCircle2,
  Clock,
  Keyboard,
  Percent,
  TrendingUp
} from 'lucide-react';
import { 
  PurchaseOrder, 
  OrderItem, 
  Supplier, 
  ProductCategory
} from '../types';
import { 
  calculateItemSubtotal, 
  calculateSuggestedPrice,
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
import { useGridNavigation } from '../hooks/useGridNavigation';
import { ToastAction } from './Toast';

interface OrderEditorProps {
  orderToEdit?: PurchaseOrder | null;
  existingOrders: PurchaseOrder[];
  suppliers: Supplier[];
  onSave: (order: PurchaseOrder) => void;
  onCancel: () => void;
  onOpenNewSupplierModal: () => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'error', action?: ToastAction) => void;
  onPreviewPrint: (order: PurchaseOrder) => void;
}

const DRAFT_STORAGE_KEY = 'znk_order_editor_draft_v1';

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
  const canViewCosts = hasPermission('orders_view_costs') && !layoutSettings.hideFinancialValues;

  // Global markup and discount defaults for this order
  const [defaultMarkup, setDefaultMarkup] = useState<number>(
    orderToEdit?.defaultMarkup !== undefined ? Number(orderToEdit.defaultMarkup) : 2.2
  );
  const [defaultDiscountPercent, setDefaultDiscountPercent] = useState<number>(
    orderToEdit?.discountPercentage !== undefined ? Number(orderToEdit.discountPercentage) : 0
  );

  // Generate empty item template
  const createEmptyItem = (index?: number): OrderItem => {
    const mk = defaultMarkup || 2.2;
    const disc = defaultDiscountPercent || 0;
    return {
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
      discountPercent: disc,
      markup: mk,
      suggestedPrice: 0,
      subtotal: 0,
      notes: '',
    };
  };

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
    orderToEdit?.notes || 'Conferir referências e embalagem individual com cabides e tags da ZNK Packing.'
  );

  // Items State (The Dynamic Grid)
  const [items, setItems] = useState<OrderItem[]>(() => {
    if (orderToEdit?.items && orderToEdit.items.length > 0) {
      return orderToEdit.items.map(it => ({
        ...it,
        discountPercent: it.discountPercent !== undefined ? Number(it.discountPercent) : 0,
        markup: it.markup !== undefined ? Number(it.markup) : (defaultMarkup || 2.2),
        subtotal: it.subtotal || calculateItemSubtotal(it.quantity, it.unitCost, it.discountPercent || 0),
        suggestedPrice: it.suggestedPrice || calculateSuggestedPrice(it.unitCost, it.markup || defaultMarkup || 2.2, it.discountPercent || 0),
      }));
    }
    return [createEmptyItem(0), createEmptyItem(1), createEmptyItem(2)];
  });

  // Dirty state tracking & Auto-save
  const [isDirty, setIsDirty] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  const [hasDraftAvailable, setHasDraftAvailable] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);

  // Color picker popup active state
  const [activeColorPickerRowIndex, setActiveColorPickerRowIndex] = useState<number | null>(null);
  const [activeCatalogRowIndex, setActiveCatalogRowIndex] = useState<number | null>(null);

  // Reference to table container for scroll shadow calculation
  const tableRef = useRef<HTMLTableElement>(null);

  // Selected supplier details
  const currentSupplier = suppliers.find(s => s.id === selectedSupplierId);

  // 1. RECOVER SESSION DRAFT IF AVAILABLE (on create mode)
  useEffect(() => {
    if (!orderToEdit) {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
            setHasDraftAvailable(true);
            setDraftTimestamp(parsed.savedAt ? new Date(parsed.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recente');
          }
        }
      } catch (e) {
        console.warn('Failed to parse order draft', e);
      }
    }
  }, [orderToEdit]);

  // Restore Draft Action
  const handleRestoreDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.items) setItems(parsed.items);
        if (parsed.selectedSupplierId) setSelectedSupplierId(parsed.selectedSupplierId);
        if (parsed.collection) setCollection(parsed.collection);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.paymentTerms) setPaymentTerms(parsed.paymentTerms);
        if (parsed.shippingCarrier) setShippingCarrier(parsed.shippingCarrier);
        if (parsed.shippingCost !== undefined) setShippingCost(parsed.shippingCost);
        if (parsed.discount !== undefined) setDiscount(parsed.discount);
        setHasDraftAvailable(false);
        setIsDirty(true);
        onShowToast('Rascunho do pedido restaurado com sucesso!', 'success');
      }
    } catch (e) {
      onShowToast('Não foi possível restaurar o rascunho.', 'error');
    }
  };

  // Discard Draft Action
  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraftAvailable(false);
    onShowToast('Rascunho anterior descartado.', 'info');
  };

  // 2. SILENT AUTO-SAVE TO LOCALSTORAGE EVERY 10 SECONDS
  useEffect(() => {
    if (orderToEdit) return; // Do not overwrite draft when editing existing saved order

    const interval = setInterval(() => {
      if (isDirty && items.length > 0) {
        const draftData = {
          orderNumber,
          selectedSupplierId,
          issueDate,
          expectedDeliveryDate,
          paymentTerms,
          status,
          collection,
          shippingCarrier,
          shippingCost,
          discount,
          notes,
          items,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        setLastAutoSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [orderToEdit, isDirty, orderNumber, selectedSupplierId, issueDate, expectedDeliveryDate, paymentTerms, status, collection, shippingCarrier, shippingCost, discount, notes, items]);

  // 3. PROTECTION AGAINST ACCIDENTAL EXIT (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Safe Cancel with Unsaved Changes Confirmation
  const handleSafeCancel = () => {
    if (isDirty) {
      if (confirm('Você possui alterações não salvas neste pedido. Deseja realmente sair e descartar?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  // Update payment terms default when supplier changes if creating new order
  const handleSupplierChange = (supId: string) => {
    setSelectedSupplierId(supId);
    setIsDirty(true);
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

  // Recalculate item subtotal and suggested price
  const updateItemField = (index: number, field: keyof OrderItem, value: any) => {
    setIsDirty(true);
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    const q = field === 'quantity' ? Math.max(0, Number(value) || 0) : Number(item.quantity) || 0;
    const c = field === 'unitCost' ? Math.max(0, Number(value) || 0) : Number(item.unitCost) || 0;
    const disc = field === 'discountPercent' ? Math.min(100, Math.max(0, Number(value) || 0)) : (Number(item.discountPercent) || 0);
    const mk = field === 'markup' ? Math.max(0.1, Number(value) || 2.2) : (Number(item.markup) || defaultMarkup || 2.2);

    if (field === 'quantity' || field === 'unitCost' || field === 'discountPercent') {
      item.subtotal = calculateItemSubtotal(q, c, disc);
      item.suggestedPrice = calculateSuggestedPrice(c, mk, disc);
      item.discountPercent = disc;
      item.markup = mk;
    } else if (field === 'markup') {
      item.markup = mk;
      item.suggestedPrice = calculateSuggestedPrice(c, mk, disc);
    } else if (field === 'suggestedPrice') {
      const sp = Math.max(0, Number(value) || 0);
      item.suggestedPrice = sp;
      const effectiveCost = disc > 0 ? c * (1 - disc / 100) : c;
      if (effectiveCost > 0 && sp > 0) {
        item.markup = Math.round((sp / effectiveCost) * 100) / 100;
      }
    }

    updated[index] = item;
    setItems(updated);
  };

  // Batch apply markup multiplier across all items in spreadsheet
  const handleApplyBatchMarkup = (newMarkup: number) => {
    const mk = Math.max(0.1, Number(newMarkup) || 2.2);
    setDefaultMarkup(mk);
    setIsDirty(true);
    setItems(prev => prev.map(item => ({
      ...item,
      markup: mk,
      suggestedPrice: calculateSuggestedPrice(item.unitCost, mk, item.discountPercent || 0),
    })));
    onShowToast(`Markup de ${mk}x aplicado a todos os produtos!`, 'success');
  };

  // Batch apply discount percentage across all items in spreadsheet
  const handleApplyBatchDiscount = (newDiscount: number) => {
    const disc = Math.min(100, Math.max(0, Number(newDiscount) || 0));
    setDefaultDiscountPercent(disc);
    setIsDirty(true);
    setItems(prev => prev.map(item => {
      const subtotal = calculateItemSubtotal(item.quantity, item.unitCost, disc);
      const suggested = calculateSuggestedPrice(item.unitCost, item.markup || defaultMarkup || 2.2, disc);
      return {
        ...item,
        discountPercent: disc,
        subtotal,
        suggestedPrice: suggested,
      };
    }));
    onShowToast(`Desconto de ${disc}% aplicado a todos os produtos!`, 'success');
  };

  // Add new row
  const handleAddRow = () => {
    setIsDirty(true);
    setItems(prev => [...prev, createEmptyItem(prev.length)]);
    onShowToast('Nova linha adicionada à planilha', 'info');
  };

  // Add full size run (P, M, G, GG) for selected catalog piece
  const handleAddFullSizeRun = () => {
    setIsDirty(true);
    const sample = PRODUCT_CATALOG_SUGGESTIONS[Math.floor(Math.random() * PRODUCT_CATALOG_SUGGESTIONS.length)];
    const color = FASHION_COLORS[Math.floor(Math.random() * FASHION_COLORS.length)];
    const sizes = ['P (5 un)', 'M (10 un)', 'G (10 un)', 'GG (5 un)'];
    
    const newItems = sizes.map((sizeLabel, idx) => {
      const qty = sizeLabel.includes('10') ? 10 : 5;
      const disc = defaultDiscountPercent || 0;
      const mk = defaultMarkup || 2.2;
      return {
        id: generateUUID(),
        sku: `${sample.sku}-${sizeLabel.split(' ')[0]}`,
        description: `${sample.description} - Tam ${sizeLabel.split(' ')[0]}`,
        category: sample.category,
        sizeGridType: 'letter' as const,
        size: sizeLabel,
        color: color.name,
        colorHex: color.hex,
        quantity: qty,
        unitCost: sample.defaultCost,
        discountPercent: disc,
        markup: mk,
        suggestedPrice: calculateSuggestedPrice(sample.defaultCost, mk, disc),
        subtotal: calculateItemSubtotal(qty, sample.defaultCost, disc),
        notes: 'Grade completa distribuída',
      };
    });

    setItems(prev => [...prev, ...newItems]);
    onShowToast(`Grade completa (${sample.category}) inserida com sucesso!`, 'success');
  };

  // Duplicate specific row (Ctrl + D / Action button)
  const handleDuplicateRow = (index: number) => {
    setIsDirty(true);
    const itemToClone = items[index];
    const cloned: OrderItem = {
      ...itemToClone,
      id: generateUUID(),
      sku: itemToClone.sku ? `${itemToClone.sku}-VAR` : '',
    };
    const updated = [...items];
    updated.splice(index + 1, 0, cloned);
    setItems(updated);
    onShowToast(`Linha #${index + 1} duplicada com sucesso! (Ctrl+D)`, 'info');
  };

  // Remove row with Toast Undo Action
  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) {
      onShowToast('O pedido deve conter pelo menos 1 item.', 'error');
      return;
    }

    const removedItem = items[index];
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    setIsDirty(true);

    onShowToast(
      `Linha #${index + 1} "${removedItem.description || removedItem.sku || 'Item'}" removida.`,
      'info',
      {
        label: 'Desfazer',
        onClick: () => {
          setItems(prev => {
            const restored = [...prev];
            restored.splice(index, 0, removedItem);
            return restored;
          });
          onShowToast('Linha restaurada com sucesso!', 'success');
        }
      }
    );
  };

  // Apply catalog template to item
  const handleSelectCatalogItem = (index: number, catItem: typeof PRODUCT_CATALOG_SUGGESTIONS[0]) => {
    setIsDirty(true);
    const updated = [...items];
    const current = updated[index];
    const qty = current.quantity || 10;
    const disc = current.discountPercent || defaultDiscountPercent || 0;
    const mk = current.markup || defaultMarkup || 2.2;
    
    updated[index] = {
      ...current,
      sku: catItem.sku,
      description: catItem.description,
      category: catItem.category,
      unitCost: catItem.defaultCost,
      discountPercent: disc,
      markup: mk,
      suggestedPrice: calculateSuggestedPrice(catItem.defaultCost, mk, disc),
      subtotal: calculateItemSubtotal(qty, catItem.defaultCost, disc),
    };
    setItems(updated);
    setActiveCatalogRowIndex(null);
  };

  // 4. EXCEL-LIKE SPREADSHEET GRID NAVIGATION HOOK
  const gridNav = useGridNavigation({
    rowCount: items.length,
    colCount: 9,
    onAddRow: handleAddRow,
    onDuplicateRow: handleDuplicateRow,
    onDeleteRow: handleRemoveRow,
  });

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
      discountPercentage: Number(defaultDiscountPercent) || 0,
      defaultMarkup: Number(defaultMarkup) || 2.2,
      totalPieces: totals.totalPieces,
      totalAmount: totals.totalAmount,
      notes,
      items,
      createdAt: orderToEdit ? orderToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Clean auto-save draft
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setIsDirty(false);
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
    <div className="space-y-6 pb-28">
      {/* Draft Recovery Banner */}
      {hasDraftAvailable && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2.5">
            <RotateCcw className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-950 dark:text-amber-200">
              Encontramos um rascunho de pedido não finalizado salvo às <strong>{draftTimestamp}</strong>. Deseja recuperá-lo?
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-xs font-medium transition-colors"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              Restaurar Rascunho
            </button>
          </div>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-brand-200 dark:border-stone-800 shadow-soft sticky top-20 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSafeCancel}
            className="p-2 rounded-lg text-editorial-muted dark:text-stone-400 hover:text-editorial-text dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Voltar para a listagem"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-editorial-text dark:text-stone-100">
                {orderToEdit ? `Editar Pedido ${orderNumber}` : 'Novo Pedido de Compra'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${deadlineInfo.badgeClass}`}>
                {deadlineInfo.label}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <p className="text-xs text-editorial-muted dark:text-stone-400">
                Preencha os dados e insira os itens diretamente na grade estilo planilha.
              </p>
              {lastAutoSavedAt && (
                <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Salvo {lastAutoSavedAt}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* WhatsApp share */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-colors"
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
            className="px-3 py-2 rounded-lg border border-brand-300 dark:border-stone-700 text-brand-800 dark:text-stone-300 bg-brand-50 dark:bg-stone-800 hover:bg-brand-100 text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-colors"
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
              onShowToast('Planilha Excel (.xlsx) exportada com sucesso!', 'success');
            }}
            className="px-3 py-2 rounded-lg border border-brand-300 dark:border-stone-700 text-brand-800 dark:text-stone-300 bg-brand-50 dark:bg-stone-800 hover:bg-brand-100 text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-colors"
            title="Exportar em Planilha Excel com Grade Completa"
          >
            <FileSpreadsheet className="w-4 h-4 text-brand-600" />
            <span className="hidden md:inline">Excel</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveOrder}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-md shadow-brand-900/10 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Pedido</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Cabeçalho do Pedido (Dados Gerais & Fornecedor) */}
      <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-brand-200 dark:border-stone-800 shadow-soft space-y-4">
        <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-brand-700 dark:text-brand-400" />
            <h2 className="text-base font-serif font-bold text-editorial-text dark:text-stone-100">
              1. Identificação do Pedido & Fornecedor
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold text-brand-800 dark:text-brand-300 bg-brand-50 dark:bg-stone-800 px-2 py-1 rounded">
            Nº {orderNumber}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fornecedor / Fabricante */}
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-editorial-text dark:text-stone-200">
                Fornecedor / Confecção / Facção *
              </label>
              <button
                type="button"
                onClick={onOpenNewSupplierModal}
                className="text-[11px] text-brand-700 dark:text-brand-400 hover:underline font-semibold flex items-center space-x-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Novo Fornecedor</span>
              </button>
            </div>
            <select
              value={selectedSupplierId}
              onChange={e => handleSupplierChange(e.target.value)}
              className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs sm:text-sm font-medium text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {suppliers.map(sup => (
                <option key={sup.id} value={sup.id}>
                  {sup.tradeName} ({sup.contactName} - {sup.phone})
                </option>
              ))}
            </select>
            {currentSupplier && (
              <p className="text-[11px] text-editorial-muted dark:text-stone-400 truncate">
                CNPJ: {formatCNPJ(currentSupplier.cnpj)} • {currentSupplier.city}/{currentSupplier.state} • Prazo Médio: {currentSupplier.averageLeadDays} dias
              </p>
            )}
          </div>

          {/* Número do Pedido */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-editorial-text dark:text-stone-200">
              Número da Ordem (Identificador)
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={e => {
                setOrderNumber(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Ex: ORD-2026-010"
              className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs sm:text-sm font-mono font-medium text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Condição de Pagamento */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-editorial-text dark:text-stone-200">
              Condição de Pagamento
            </label>
            <input
              type="text"
              list="payment-terms-list"
              value={paymentTerms}
              onChange={e => {
                setPaymentTerms(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Ex: 30/60 DDL"
              className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs sm:text-sm text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <datalist id="payment-terms-list">
              {PAYMENT_TERMS_OPTIONS.map((opt, i) => (
                <option key={i} value={opt} />
              ))}
            </datalist>
          </div>

          {/* Status do Pedido */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-editorial-text dark:text-stone-200">
              Status do Pedido
            </label>
            <select
              value={status}
              onChange={e => {
                setStatus(e.target.value as PurchaseOrder['status']);
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs sm:text-sm font-medium text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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
            <label className="text-xs font-semibold text-editorial-text dark:text-stone-200 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-editorial-muted dark:text-stone-400" />
              <span>Data de Emissão</span>
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={e => {
                setIssueDate(e.target.value);
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs sm:text-sm text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Data de Previsão de Entrega */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-editorial-text dark:text-stone-200 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Previsão de Entrega *</span>
              </label>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${deadlineInfo.badgeClass}`}>
                {deadlineInfo.shortLabel}
              </span>
            </div>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={e => {
                setExpectedDeliveryDate(e.target.value);
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs sm:text-sm font-semibold text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Coleção / Linha */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-editorial-text dark:text-stone-200">
              Coleção / Cápsula
            </label>
            <input
              type="text"
              value={collection}
              onChange={e => {
                setCollection(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Ex: Alto Verão 2026"
              className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs sm:text-sm text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Transportadora */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-editorial-text dark:text-stone-200 flex items-center space-x-1">
              <Truck className="w-3.5 h-3.5 text-editorial-muted dark:text-stone-400" />
              <span>Transportadora</span>
            </label>
            <input
              type="text"
              value={shippingCarrier}
              onChange={e => {
                setShippingCarrier(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Ex: Braspress, Jadlog, Sedex"
              className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs sm:text-sm text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Observações Gerais */}
          <div className="lg:col-span-4 space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-editorial-text dark:text-stone-200">
              Observações & Instruções Especiais de Confecção / Embalagem
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => {
                setNotes(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Ex: Embalagem individual, dobrada em cabides, aviamentos de qualidade, etiqueta da ZNK Packing inclusa..."
              className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs sm:text-sm text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Grade Dinâmica de Produtos (Excel / Spreadsheet Data Grid) */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-brand-200 dark:border-stone-800 shadow-soft overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 bg-brand-50/70 dark:bg-stone-800 border-b border-brand-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-brand-700 dark:text-amber-400" />
            <div>
              <h2 className="text-base font-serif font-bold text-editorial-text dark:text-stone-100">
                2. Grade de Produtos & Linhas de Pedido (Planilha Dinâmica)
              </h2>
              <div className="flex items-center space-x-2 text-xs text-editorial-muted dark:text-stone-400 mt-0.5">
                <span className="flex items-center space-x-1">
                  <Keyboard className="w-3.5 h-3.5 text-brand-600 dark:text-amber-400" />
                  <span>Navegação por setas <kbd className="px-1 py-0.2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded font-mono text-[10px]">↑↓←→</kbd></span>
                </span>
                <span>•</span>
                <span><kbd className="px-1 py-0.2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded font-mono text-[10px]">Enter</kbd> nova linha</span>
                <span>•</span>
                <span><kbd className="px-1 py-0.2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded font-mono text-[10px]">Ctrl+D</kbd> duplicar</span>
              </div>
            </div>
          </div>

          {/* Quick Grid Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Linha</span>
            </button>

            <button
              type="button"
              onClick={handleAddFullSizeRun}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-brand-300 dark:border-stone-700 text-brand-800 dark:text-stone-200 hover:bg-brand-100 dark:hover:bg-stone-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Gera automaticamente 4 linhas com a grade padrão (P, M, G, GG)"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>+ Grade P/M/G/GG Rápida</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const sample = PRODUCT_CATALOG_SUGGESTIONS[Math.floor(Math.random() * PRODUCT_CATALOG_SUGGESTIONS.length)];
                const color = FASHION_COLORS[Math.floor(Math.random() * FASHION_COLORS.length)];
                const disc = defaultDiscountPercent || 0;
                const mk = defaultMarkup || 2.2;
                setIsDirty(true);
                setItems(prev => [
                  ...prev,
                  {
                    id: generateUUID(),
                    sku: sample.sku,
                    description: sample.description,
                    category: sample.category,
                    sizeGridType: 'letter',
                    size: 'Grade P/M/G',
                    color: color.name,
                    colorHex: color.hex,
                    quantity: 20,
                    unitCost: sample.defaultCost,
                    discountPercent: disc,
                    markup: mk,
                    suggestedPrice: calculateSuggestedPrice(sample.defaultCost, mk, disc),
                    subtotal: calculateItemSubtotal(20, sample.defaultCost, disc),
                    notes: '',
                  }
                ]);
                onShowToast(`Modelo ${sample.description} adicionado!`, 'success');
              }}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-editorial-text dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-750 text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <span>+ Sugerir Peça Catálogo</span>
            </button>
          </div>
        </div>

        {/* Quick Pricing & Discount Bar */}
        <div className="px-4 py-2.5 bg-amber-50/40 dark:bg-stone-850/80 border-b border-amber-200/60 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Markup Sugerido Multiplier */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-editorial-text dark:text-stone-200 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" />
                Markup Padrão:
              </span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={defaultMarkup}
                  onChange={e => setDefaultMarkup(parseFloat(e.target.value) || 2.2)}
                  className="w-16 px-2 py-1 bg-white dark:bg-stone-900 border border-amber-300 dark:border-stone-700 rounded text-center font-mono font-bold text-amber-900 dark:text-amber-400 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="font-mono text-editorial-muted dark:text-stone-400 text-xs">x</span>
                <button
                  type="button"
                  onClick={() => handleApplyBatchMarkup(defaultMarkup)}
                  className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-amber-900 dark:text-amber-300 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Aplica este multiplicador de markup a todos os itens da grade"
                >
                  Aplicar Geral
                </button>
              </div>
            </div>

            {/* Desconto no Produto % */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-editorial-text dark:text-stone-200 flex items-center">
                <Percent className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                Desconto Recebido (%):
              </span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={defaultDiscountPercent}
                  onChange={e => setDefaultDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-800 rounded text-center font-mono font-bold text-emerald-800 dark:text-emerald-300 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="font-mono text-editorial-muted dark:text-stone-400 text-xs">%</span>
                <button
                  type="button"
                  onClick={() => handleApplyBatchDiscount(defaultDiscountPercent)}
                  className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Aplica este percentual de desconto a todos os itens da grade"
                >
                  Aplicar Geral
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-editorial-muted dark:text-stone-400 hidden sm:block">
            Preço Varejo = (Custo Líquido) × Markup
          </div>
        </div>

        {/* The Spreadsheet Grid Table with Scroll Shadow Container */}
        <div className="overflow-x-auto relative">
          <table ref={tableRef} className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-editorial-light dark:bg-stone-800/90 border-b border-brand-200 dark:border-stone-800 text-[11px] font-semibold uppercase tracking-wider text-editorial-muted dark:text-stone-400">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 w-32">Cód / SKU</th>
                <th className="py-2.5 px-3 w-56">Descrição do Modelo</th>
                <th className="py-2.5 px-3 w-32">Categoria</th>
                <th className="py-2.5 px-3 w-28">Grade / Tam</th>
                <th className="py-2.5 px-3 w-36">Cor / Variante</th>
                <th className="py-2.5 px-3 w-20 text-right">Qtd</th>
                <th className="py-2.5 px-3 w-24 text-right">Custo Bruto</th>
                <th className="py-2.5 px-3 w-20 text-center">Desc %</th>
                <th className="py-2.5 px-3 w-20 text-center">Markup</th>
                {layoutSettings.showSuggestedPrice && (
                  <th className="py-2.5 px-3 w-28 text-right">Preço Varejo</th>
                )}
                <th className="py-2.5 px-3 w-28 text-right">Subtotal Líq.</th>
                <th className="py-2.5 px-3 w-20 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70 dark:divide-stone-800/80 text-xs">
              {items.map((item, index) => (
                <tr 
                  key={item.id}
                  className="hover:bg-brand-50/40 dark:hover:bg-stone-800/50 transition-colors group"
                >
                  {/* Row Number */}
                  <td className="py-2 px-3 text-center font-mono text-[11px] text-editorial-muted dark:text-stone-500 bg-stone-50/50 dark:bg-stone-900/50 select-none">
                    {index + 1}
                  </td>

                  {/* SKU / Reference (Col 0) */}
                  <td className="py-1.5 px-2 relative">
                    <div className="relative">
                      <input
                        ref={el => gridNav.registerCell(index, 0, el)}
                        type="text"
                        value={item.sku}
                        onChange={e => updateItemField(index, 'sku', e.target.value)}
                        onKeyDown={e => gridNav.handleCellKeyDown(e, index, 0)}
                        placeholder="Ex: VEST-2401"
                        className="grid-cell-input font-mono font-medium text-brand-900 dark:text-brand-300 uppercase focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none"
                      />
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
                      <div className="absolute left-2 top-full mt-1 z-50 w-72 bg-white dark:bg-stone-900 rounded-lg border border-brand-300 dark:border-stone-700 shadow-dropdown p-2 max-h-60 overflow-y-auto">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-editorial-muted dark:text-stone-400 pb-1 mb-1 border-b dark:border-stone-800">
                          Sugestões de Modelos
                        </div>
                        {PRODUCT_CATALOG_SUGGESTIONS.map((cat, ci) => (
                          <div
                            key={ci}
                            onClick={() => handleSelectCatalogItem(index, cat)}
                            className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-stone-800 cursor-pointer text-xs transition-colors flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-bold text-brand-800 dark:text-brand-300 mr-1.5">{cat.sku}</span>
                              <span className="text-editorial-text dark:text-stone-200">{cat.description}</span>
                            </div>
                            <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{formatCurrency(cat.defaultCost)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Description (Col 1) */}
                  <td className="py-1.5 px-2">
                    <input
                      ref={el => gridNav.registerCell(index, 1, el)}
                      type="text"
                      value={item.description}
                      onChange={e => updateItemField(index, 'description', e.target.value)}
                      onKeyDown={e => gridNav.handleCellKeyDown(e, index, 1)}
                      placeholder="Nome ou detalhe do modelo..."
                      className="grid-cell-input font-medium focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none"
                    />
                  </td>

                  {/* Category */}
                  <td className="py-1.5 px-2">
                    <select
                      value={item.category}
                      onChange={e => updateItemField(index, 'category', e.target.value as ProductCategory)}
                      className="grid-cell-input text-xs cursor-pointer font-medium text-stone-700 dark:text-stone-300 focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Size / Grade (Col 2) */}
                  <td className="py-1.5 px-2">
                    <input
                      ref={el => gridNav.registerCell(index, 2, el)}
                      type="text"
                      value={item.size}
                      onChange={e => updateItemField(index, 'size', e.target.value)}
                      onKeyDown={e => gridNav.handleCellKeyDown(e, index, 2)}
                      placeholder="P, M, G, 38-44"
                      className="grid-cell-input font-medium text-center focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none"
                    />
                  </td>

                  {/* Color / Variant (Col 3) */}
                  <td className="py-1.5 px-2 relative">
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveColorPickerRowIndex(activeColorPickerRowIndex === index ? null : index)}
                        className="w-5 h-5 rounded-full border border-stone-300 dark:border-stone-700 shadow-2xs flex-shrink-0 flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: item.colorHex || '#FAF9F6' }}
                        title="Escolher paleta de cores de moda"
                      >
                        <Palette className="w-2.5 h-2.5 text-stone-700 opacity-50 hover:opacity-100 mix-blend-difference" />
                      </button>
                      <input
                        ref={el => gridNav.registerCell(index, 3, el)}
                        type="text"
                        value={item.color}
                        onChange={e => updateItemField(index, 'color', e.target.value)}
                        onKeyDown={e => gridNav.handleCellKeyDown(e, index, 3)}
                        placeholder="Ex: Terracota"
                        className="grid-cell-input focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    {/* Color Swatches Popup */}
                    {activeColorPickerRowIndex === index && (
                      <div className="absolute left-2 top-full mt-1 z-50 w-64 bg-white dark:bg-stone-900 rounded-xl border border-brand-300 dark:border-stone-700 shadow-dropdown p-3">
                        <div className="text-[11px] font-semibold text-editorial-text dark:text-stone-200 mb-2 flex items-center justify-between">
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
                              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-xs transition-colors"
                            >
                              <span
                                className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-700 shadow-2xs flex-shrink-0"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="truncate text-stone-800 dark:text-stone-200 font-medium text-[11px]">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Quantity (Col 4) */}
                  <td className="py-1.5 px-2">
                    <input
                      ref={el => gridNav.registerCell(index, 4, el)}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={e => updateItemField(index, 'quantity', Math.max(0, parseInt(e.target.value, 10) || 0))}
                      onKeyDown={e => gridNav.handleCellKeyDown(e, index, 4)}
                      className="grid-cell-input grid-cell-number font-bold text-brand-900 dark:text-brand-300 focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none"
                    />
                  </td>

                  {/* Unit Cost (Col 5) */}
                  <td className="py-1.5 px-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-editorial-muted dark:text-stone-500 font-mono pointer-events-none">
                        R$
                      </span>
                      <input
                        ref={el => gridNav.registerCell(index, 5, el)}
                        type="number"
                        min="0"
                        step="0.50"
                        value={item.unitCost === 0 ? '' : item.unitCost}
                        onChange={e => updateItemField(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        onKeyDown={e => gridNav.handleCellKeyDown(e, index, 5)}
                        className="grid-cell-input grid-cell-number pl-6 font-mono font-medium focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </td>

                  {/* Discount % (Col 6) */}
                  <td className="py-1.5 px-1.5 text-center">
                    <div className="relative">
                      <input
                        ref={el => gridNav.registerCell(index, 6, el)}
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={item.discountPercent === 0 ? '' : (item.discountPercent || '')}
                        onChange={e => updateItemField(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                        onKeyDown={e => gridNav.handleCellKeyDown(e, index, 6)}
                        placeholder="0%"
                        className="grid-cell-input grid-cell-number text-center font-mono font-semibold text-emerald-700 dark:text-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </td>

                  {/* Markup Multiplier (Col 7) */}
                  <td className="py-1.5 px-1.5 text-center">
                    <div className="relative">
                      <input
                        ref={el => gridNav.registerCell(index, 7, el)}
                        type="number"
                        min="0.1"
                        max="20"
                        step="0.1"
                        value={item.markup || defaultMarkup || 2.2}
                        onChange={e => updateItemField(index, 'markup', parseFloat(e.target.value) || 2.2)}
                        onKeyDown={e => gridNav.handleCellKeyDown(e, index, 7)}
                        placeholder="2.2"
                        className="grid-cell-input grid-cell-number text-center font-mono font-bold text-amber-800 dark:text-amber-400 focus-visible:ring-2 focus-visible:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </td>

                  {/* Suggested Retail Price (Col 8) */}
                  {layoutSettings.showSuggestedPrice && (
                    <td className="py-1.5 px-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono pointer-events-none">
                          R$
                        </span>
                        <input
                          ref={el => gridNav.registerCell(index, 8, el)}
                          type="number"
                          min="0"
                          step="0.50"
                          value={item.suggestedPrice === 0 ? '' : (item.suggestedPrice || '')}
                          onChange={e => updateItemField(index, 'suggestedPrice', parseFloat(e.target.value) || 0)}
                          onKeyDown={e => gridNav.handleCellKeyDown(e, index, 8)}
                          placeholder="0,00"
                          className="grid-cell-input grid-cell-number pl-6 font-mono font-semibold text-emerald-700 dark:text-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </td>
                  )}

                  {/* Subtotal Líquido (Calculated) */}
                  <td className="py-2 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100 bg-brand-50/20 dark:bg-stone-900/30">
                    <div>{canViewCosts ? formatCurrency(item.subtotal) : '••••••'}</div>
                    {Boolean(item.discountPercent && item.discountPercent > 0) && (
                      <div className="text-[9px] font-normal text-emerald-600 dark:text-emerald-400">
                        -{item.discountPercent}% desc
                      </div>
                    )}
                  </td>

                  {/* Row Actions */}
                  <td className="py-1.5 px-2 text-center">
                    <div className="flex items-center justify-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleDuplicateRow(index)}
                        className="p-1 rounded text-stone-500 dark:text-stone-400 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-brand-100 dark:hover:bg-stone-800 transition-colors"
                        title="Duplicar linha (Ctrl+D)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Excluir linha (com opção de desfazer)"
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
        <div className="p-3 bg-stone-50 dark:bg-stone-800 border-t border-brand-200 dark:border-stone-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddRow}
            className="text-xs font-semibold text-brand-700 dark:text-amber-400 hover:text-brand-900 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-brand-100/60 dark:hover:bg-stone-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar nova linha na planilha</span>
          </button>
          <span className="text-xs text-editorial-muted dark:text-stone-400">
            Total de linhas: <strong className="text-editorial-text dark:text-stone-200">{items.length}</strong> itens
          </span>
        </div>
      </div>

      {/* SECTION 3: Resumo Financeiro & Totais do Pedido */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left note/delivery warning */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-xl p-5 border border-brand-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-semibold text-editorial-text dark:text-stone-100">
              Validação de Prazos & Custos de Confecção
            </h3>
          </div>
          <div className="p-3 rounded-lg bg-brand-50/50 dark:bg-stone-800/60 border border-brand-200/60 dark:border-stone-700 text-xs text-editorial-muted dark:text-stone-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Status do Prazo:</span>
              <span className={`font-semibold px-2 py-0.5 rounded border text-[11px] ${deadlineInfo.badgeClass}`}>
                {deadlineInfo.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tempo Estimado de Produção:</span>
              <span className="font-semibold text-editorial-text dark:text-stone-200">{currentSupplier?.averageLeadDays || 18} dias úteis</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Custo Médio por Peça:</span>
              <span className="font-semibold text-brand-800 dark:text-brand-300">
                {totals.totalPieces > 0 ? formatCurrency(totals.totalAmount / totals.totalPieces) : 'R$ 0,00'} / peça
              </span>
            </div>
            {layoutSettings.showSuggestedPrice && totals.totalSuggestedRetail > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-brand-200/40 dark:border-stone-700">
                <span>Faturamento Estimado (Varejo):</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {canViewCosts ? formatCurrency(totals.totalSuggestedRetail) : 'R$ ••••••'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Financial Calculation Card */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-xl p-5 border border-brand-300 dark:border-stone-700 shadow-card space-y-3">
          <h3 className="text-sm font-serif font-bold text-editorial-text dark:text-stone-100 uppercase tracking-wider pb-2 border-b border-stone-100 dark:border-stone-800">
            Resumo Financeiro do Pedido
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-editorial-muted dark:text-stone-400">
              <span>Volume Total de Peças:</span>
              <span className="font-bold text-editorial-text dark:text-stone-100 font-mono text-sm">{totals.totalPieces} un</span>
            </div>

            {totals.itemsDiscountTotal > 0 && (
              <>
                <div className="flex items-center justify-between text-editorial-muted dark:text-stone-400">
                  <span>Subtotal Bruto dos Produtos:</span>
                  <span className="font-medium text-editorial-text dark:text-stone-200 font-mono">
                    {canViewCosts ? formatCurrency(totals.grossItemsSubtotal) : 'R$ ••••••'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Desconto Total em Produtos (-):</span>
                  <span className="font-semibold font-mono">
                    {canViewCosts ? `- ${formatCurrency(totals.itemsDiscountTotal)}` : '••••••'}
                  </span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between text-editorial-muted dark:text-stone-400">
              <span>Subtotal Líquido dos Produtos:</span>
              <span className="font-semibold text-editorial-text dark:text-stone-100 font-mono text-sm">
                {canViewCosts ? formatCurrency(totals.itemsSubtotal) : 'R$ ••••••'}
              </span>
            </div>

            {/* Frete Adicional */}
            <div className="flex items-center justify-between">
              <span className="text-editorial-muted dark:text-stone-400 flex items-center">
                Frete (+):
              </span>
              <div className="w-28 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-editorial-muted dark:text-stone-500 font-mono">R$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={shippingCost === 0 ? '' : shippingCost}
                  onChange={e => {
                    setShippingCost(parseFloat(e.target.value) || 0);
                    setIsDirty(true);
                  }}
                  placeholder="0,00"
                  className="w-full pl-6 pr-2 py-1 bg-editorial-light dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs text-right font-mono font-medium text-editorial-text dark:text-stone-100 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Desconto Geral */}
            <div className="flex items-center justify-between">
              <span className="text-editorial-muted dark:text-stone-400 flex items-center text-rose-700 dark:text-rose-400">
                Desconto Financeiro Geral (-):
              </span>
              <div className="w-28 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-rose-600 font-mono">R$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={discount === 0 ? '' : discount}
                  onChange={e => {
                    setDiscount(parseFloat(e.target.value) || 0);
                    setIsDirty(true);
                  }}
                  placeholder="0,00"
                  className="w-full pl-6 pr-2 py-1 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded text-xs text-right font-mono font-medium text-rose-800 dark:text-rose-300 focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-brand-200 dark:border-stone-800 flex items-baseline justify-between">
              <span className="text-sm font-bold text-brand-900 dark:text-brand-300 uppercase">
                Valor Total Líquido:
              </span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-brand-700 dark:text-brand-400">
                {canViewCosts ? formatCurrency(totals.totalAmount) : 'R$ ••••••'}
              </span>
            </div>

            {layoutSettings.showSuggestedPrice && totals.totalSuggestedRetail > 0 && (
              <div className="pt-2 border-t border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Margem Bruta no Varejo:</span>
                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  {canViewCosts ? `${formatCurrency(totals.totalSuggestedRetail - totals.totalAmount)} (${(((totals.totalSuggestedRetail - totals.totalAmount) / totals.totalSuggestedRetail) * 100).toFixed(1)}%)` : '••••••'}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveOrder}
              className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all hover:shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Confirmar e Salvar Ordem de Compra</span>
            </button>
          </div>
        </div>
      </div>

      {/* STICKY FLOATING BOTTOM BAR (appears on long tables for effortless ergonomics) */}
      {items.length >= 4 && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[92%] bg-stone-900/90 dark:bg-stone-900/95 text-white p-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl border border-stone-700/80 backdrop-blur-md flex items-center justify-between animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center space-x-4 sm:space-x-6 truncate">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Volume</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-stone-100">{totals.totalPieces} pçs</span>
            </div>
            <div className="h-7 w-px bg-stone-700 hidden sm:block" />
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total Líquido</span>
              <span className="text-xs sm:text-base font-bold font-serif text-amber-300">{formatCurrency(totals.totalAmount)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 text-xs font-semibold hidden md:flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Linha</span>
            </button>

            <button
              type="button"
              onClick={handleSaveOrder}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-semibold text-xs sm:text-sm flex items-center space-x-1.5 shadow-lg shadow-brand-900/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Ordem</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
