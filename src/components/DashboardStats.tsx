import React from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  CalendarClock
} from 'lucide-react';
import { PurchaseOrder } from '../types';
import { calculateSummary, formatCurrency } from '../utils/calculations';
import { useCustomization } from '../context/CustomizationContext';

interface DashboardStatsProps {
  orders: PurchaseOrder[];
  onSelectDeadlineFilter: (status: 'all' | 'delayed' | 'due_soon' | 'on_track' | 'completed') => void;
  activeDeadlineFilter: 'all' | 'delayed' | 'due_soon' | 'on_track' | 'completed';
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  orders,
  onSelectDeadlineFilter,
  activeDeadlineFilter,
}) => {
  const summary = calculateSummary(orders);
  const { layoutSettings, hasPermission } = useCustomization();
  const canViewCosts = hasPermission('orders_view_costs') && !layoutSettings.hideFinancialValues;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Card 1: Volume de Peças */}
      <div className="bg-white dark:bg-stone-900 rounded-xl p-4 border border-brand-200 dark:border-stone-800 shadow-soft transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-editorial-muted dark:text-stone-400">
            Total de Peças
          </span>
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/40 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-serif text-editorial-text dark:text-stone-100">
            {summary.totalPieces.toLocaleString('pt-BR')}
          </div>
          <span className="text-xs text-brand-700 dark:text-brand-400 font-medium bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800/50">
            {summary.totalOrders} pedidos
          </span>
        </div>
      </div>

      {/* Card 2: Valor em Aberto */}
      <div className="bg-white dark:bg-stone-900 rounded-xl p-4 border border-amber-200/80 dark:border-amber-900/40 shadow-soft transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Em Aberto
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-300">
            {canViewCosts ? formatCurrency(summary.totalOpenAmount) : 'R$ •••••••'}
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
            Pendente
          </span>
        </div>
      </div>

      {/* Card 3: Total Entregue / Faturado */}
      <div className="bg-white dark:bg-stone-900 rounded-xl p-4 border border-emerald-200/80 dark:border-emerald-900/40 shadow-soft transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            Faturado
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-300">
            {canViewCosts ? formatCurrency(summary.totalDeliveredAmount) : 'R$ •••••••'}
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50">
            Entregue
          </span>
        </div>
      </div>

      {/* Card 4: Controle de Prazos (Filtros compactos) */}
      <div className="bg-white dark:bg-stone-900 rounded-xl p-4 border border-brand-200 dark:border-stone-800 shadow-soft transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-editorial-muted dark:text-stone-400">
            Prazos de Entrega
          </span>
          <CalendarClock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
        </div>
        
        <div className="grid grid-cols-3 gap-1.5">
          {/* Atrasados */}
          <button
            onClick={() => onSelectDeadlineFilter(activeDeadlineFilter === 'delayed' ? 'all' : 'delayed')}
            className={`py-1.5 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center ${
              activeDeadlineFilter === 'delayed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 hover:bg-rose-100 border border-rose-200/60 dark:border-rose-900/40'
            }`}
          >
            <span className="text-xs font-bold leading-tight">{summary.delayedCount}</span>
            <span className="text-[9px] uppercase font-medium mt-0.5">Atraso</span>
          </button>

          {/* Próximos 7d */}
          <button
            onClick={() => onSelectDeadlineFilter(activeDeadlineFilter === 'due_soon' ? 'all' : 'due_soon')}
            className={`py-1.5 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center ${
              activeDeadlineFilter === 'due_soon'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/60 dark:border-amber-900/40'
            }`}
          >
            <span className="text-xs font-bold leading-tight">{summary.approachingCount}</span>
            <span className="text-[9px] uppercase font-medium mt-0.5">Próx 7d</span>
          </button>

          {/* No Prazo */}
          <button
            onClick={() => onSelectDeadlineFilter(activeDeadlineFilter === 'on_track' ? 'all' : 'on_track')}
            className={`py-1.5 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center ${
              activeDeadlineFilter === 'on_track'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/60 dark:border-emerald-900/40'
            }`}
          >
            <span className="text-xs font-bold leading-tight">{summary.onTimeCount}</span>
            <span className="text-[9px] uppercase font-medium mt-0.5">No Prazo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
