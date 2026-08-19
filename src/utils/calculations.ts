import { OrderItem, PurchaseOrder, DeadlineStatus, FinancialSummary } from '../types';

export function calculateItemSubtotal(
  quantity: number, 
  unitCost: number, 
  discountPercent = 0
): number {
  const qty = isNaN(quantity) || quantity < 0 ? 0 : quantity;
  const cost = isNaN(unitCost) || unitCost < 0 ? 0 : unitCost;
  const disc = isNaN(discountPercent) || discountPercent < 0 ? 0 : Math.min(100, discountPercent);
  const netUnitCost = disc > 0 ? cost * (1 - disc / 100) : cost;
  return Math.round(qty * netUnitCost * 100) / 100;
}

export function calculateSuggestedPrice(
  unitCost: number,
  markup = 2.2,
  discountPercent = 0
): number {
  const cost = isNaN(unitCost) || unitCost < 0 ? 0 : unitCost;
  const mk = isNaN(markup) || markup <= 0 ? 2.2 : markup;
  const disc = isNaN(discountPercent) || discountPercent < 0 ? 0 : Math.min(100, discountPercent);
  const effectiveCost = disc > 0 ? cost * (1 - disc / 100) : cost;
  return Math.round(effectiveCost * mk * 100) / 100;
}

export function calculateOrderTotals(
  items: OrderItem[],
  shippingCost = 0,
  discount = 0
): { 
  totalPieces: number; 
  itemsSubtotal: number; 
  grossItemsSubtotal: number;
  itemsDiscountTotal: number;
  totalAmount: number;
  totalSuggestedRetail: number;
} {
  const totalPieces = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  
  const grossItemsSubtotal = items.reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const c = Number(item.unitCost) || 0;
    return sum + (q * c);
  }, 0);

  const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const itemsDiscountTotal = Math.max(0, grossItemsSubtotal - itemsSubtotal);

  const totalSuggestedRetail = items.reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const suggested = item.suggestedPrice || calculateSuggestedPrice(item.unitCost, item.markup || 2.2, item.discountPercent || 0);
    return sum + (q * suggested);
  }, 0);
  
  const ship = Number(shippingCost) || 0;
  const disc = Number(discount) || 0;
  const totalAmount = Math.max(0, itemsSubtotal + ship - disc);

  return {
    totalPieces,
    itemsSubtotal: Math.round(itemsSubtotal * 100) / 100,
    grossItemsSubtotal: Math.round(grossItemsSubtotal * 100) / 100,
    itemsDiscountTotal: Math.round(itemsDiscountTotal * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalSuggestedRetail: Math.round(totalSuggestedRetail * 100) / 100,
  };
}

export interface DeadlineInfo {
  status: DeadlineStatus;
  daysRemaining: number;
  label: string;
  badgeClass: string;
  dotClass: string;
  shortLabel: string;
}

export function getDeliveryDeadlineStatus(
  expectedDeliveryDateStr: string,
  orderStatus: string
): DeadlineInfo {
  if (orderStatus === 'delivered') {
    return {
      status: 'completed',
      daysRemaining: 0,
      label: 'Entregue / Faturado',
      shortLabel: 'Entregue',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60',
      dotClass: 'bg-emerald-500',
    };
  }

  if (orderStatus === 'cancelled') {
    return {
      status: 'cancelled',
      daysRemaining: 0,
      label: 'Cancelado',
      shortLabel: 'Cancelado',
      badgeClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
      dotClass: 'bg-zinc-400',
    };
  }

  if (!expectedDeliveryDateStr) {
    return {
      status: 'on_track',
      daysRemaining: 999,
      label: 'Sem data definida',
      shortLabel: 'S/ Data',
      badgeClass: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700',
      dotClass: 'bg-stone-400',
    };
  }

  // Parse YYYY-MM-DD
  const [year, month, day] = expectedDeliveryDateStr.split('-').map(Number);
  const deliveryDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = deliveryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysLate = Math.abs(diffDays);
    return {
      status: 'delayed',
      daysRemaining: diffDays,
      label: `Atrasado (${daysLate} ${daysLate === 1 ? 'dia' : 'dias'})`,
      shortLabel: `${daysLate}d atrasado`,
      badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800/60 animate-pulse',
      dotClass: 'bg-rose-500',
    };
  } else if (diffDays <= 4) {
    return {
      status: 'due_soon',
      daysRemaining: diffDays,
      label: diffDays === 0 ? 'Entrega Hoje!' : `Entrega em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`,
      shortLabel: diffDays === 0 ? 'Hoje' : `${diffDays}d restantes`,
      badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60',
      dotClass: 'bg-amber-500',
    };
  } else {
    return {
      status: 'on_track',
      daysRemaining: diffDays,
      label: `No prazo (${diffDays} dias)`,
      shortLabel: `${diffDays}d`,
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60',
      dotClass: 'bg-emerald-500',
    };
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount || 0);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '';
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cnpj;
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

export function calculateSummary(orders: PurchaseOrder[]): FinancialSummary {
  let totalPieces = 0;
  let totalOpenAmount = 0;
  let totalDeliveredAmount = 0;
  let totalCancelledAmount = 0;
  let delayedCount = 0;
  let dueSoonCount = 0;
  let onTrackCount = 0;

  for (const order of orders) {
    if (order.status === 'cancelled') {
      totalCancelledAmount += order.totalAmount;
      continue;
    }

    totalPieces += order.totalPieces;

    if (order.status === 'delivered') {
      totalDeliveredAmount += order.totalAmount;
    } else {
      totalOpenAmount += order.totalAmount;

      const deadline = getDeliveryDeadlineStatus(order.expectedDeliveryDate, order.status);
      if (deadline.status === 'delayed') {
        delayedCount++;
      } else if (deadline.status === 'due_soon') {
        dueSoonCount++;
      } else if (deadline.status === 'on_track') {
        onTrackCount++;
      }
    }
  }

  return {
    totalOrders: orders.length,
    totalPieces,
    totalOpenAmount,
    totalDeliveredAmount,
    totalCancelledAmount,
    delayedCount,
    dueSoonCount,
    onTrackCount,
  };
}

export function generateNextOrderNumber(existingOrders: PurchaseOrder[]): string {
  const year = new Date().getFullYear();
  const numbers = existingOrders
    .map(o => {
      const match = o.orderNumber.match(/PED-\d{4}-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));

  const maxNum = numbers.length > 0 ? Math.max(...numbers) : 100;
  const nextNum = String(maxNum + 1).padStart(4, '0');
  return `PED-${year}-${nextNum}`;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

