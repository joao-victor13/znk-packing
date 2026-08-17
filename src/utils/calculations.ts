import { OrderItem, PurchaseOrder, DeadlineStatus, FinancialSummary } from '../types';

export function calculateItemSubtotal(quantity: number, unitCost: number): number {
  const qty = isNaN(quantity) || quantity < 0 ? 0 : quantity;
  const cost = isNaN(unitCost) || unitCost < 0 ? 0 : unitCost;
  return Math.round(qty * cost * 100) / 100;
}

export function calculateOrderTotals(
  items: OrderItem[],
  shippingCost = 0,
  discount = 0
): { totalPieces: number; itemsSubtotal: number; totalAmount: number } {
  const totalPieces = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  
  const ship = Number(shippingCost) || 0;
  const disc = Number(discount) || 0;
  const totalAmount = Math.max(0, itemsSubtotal + ship - disc);

  return {
    totalPieces,
    itemsSubtotal: Math.round(itemsSubtotal * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
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
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
    };
  }

  if (orderStatus === 'cancelled') {
    return {
      status: 'cancelled',
      daysRemaining: 0,
      label: 'Cancelado',
      shortLabel: 'Cancelado',
      badgeClass: 'bg-zinc-100 text-zinc-500 border-zinc-200',
      dotClass: 'bg-zinc-400',
    };
  }

  if (!expectedDeliveryDateStr) {
    return {
      status: 'on_track',
      daysRemaining: 999,
      label: 'Sem data definida',
      shortLabel: 'S/ Data',
      badgeClass: 'bg-stone-100 text-stone-600 border-stone-200',
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
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
      dotClass: 'bg-rose-500',
    };
  } else if (diffDays <= 4) {
    return {
      status: 'due_soon',
      daysRemaining: diffDays,
      label: diffDays === 0 ? 'Entrega Hoje!' : `Entrega em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`,
      shortLabel: diffDays === 0 ? 'Hoje' : `${diffDays}d restantes`,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      dotClass: 'bg-amber-500',
    };
  } else {
    return {
      status: 'on_track',
      daysRemaining: diffDays,
      label: `No prazo (${diffDays} dias)`,
      shortLabel: `${diffDays}d`,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
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
