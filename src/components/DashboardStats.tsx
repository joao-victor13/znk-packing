import React from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  CalendarClock
} from 'lucide-react';
import { PurchaseOrder } from '../types';
import { calculateSummary, formatCurrency } from '../utils/calculations';
import { useCustomization } from '../context/CustomizationContext';

interface DashboardStatsProps {
  orders: PurchaseOrder[];
  onSelectDeadlineFilter: (status: 'all' | 'delayed' | 'due_soon' | 'on_track') => void;
  activeDeadlineFilter: 'all' | 'delayed' | 'due_soon' | 'on_track';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Volume de Peças */}
      <div className="bg-white rounded-xl p-5 border border-brand-200 shadow-soft hover:shadow-card transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-editorial-muted">
            Volume de Peças
          </span>
          <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-serif text-editorial-text">
            {summary.totalPieces.toLocaleString('pt-BR')} <span className="text-sm font-sans font-normal text-editorial-muted">peças</span>
          </div>
          <p className="mt-1 text-xs text-editorial-muted flex items-center">
            Distribuídas em <span className="font-semibold text-brand-700 mx-1">{summary.totalOrders}</span> pedidos registrados
          </p>
        </div>
      </div>

      {/* Card 2: Valor em Aberto */}
      <div className="bg-white rounded-xl p-5 border border-amber-200/80 shadow-soft hover:shadow-card transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Valor em Aberto (Estoque)
          </span>
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-amber-900 font-mono">
            {canViewCosts ? formatCurrency(summary.totalOpenAmount) : 'R$ •••••••'}
          </div>
          <p className="mt-1 text-xs text-amber-700/80">
            Aguardando confecção ou despacho
          </p>
        </div>
      </div>

      {/* Card 3: Total Faturado / Entregue */}
      <div className="bg-white rounded-xl p-5 border border-emerald-200/80 shadow-soft hover:shadow-card transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Total Faturado / Entregue
          </span>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-emerald-900 font-mono">
            {canViewCosts ? formatCurrency(summary.totalDeliveredAmount) : 'R$ •••••••'}
          </div>
          <p className="mt-1 text-xs text-emerald-700/80">
            Estoque conferido e integrado
          </p>
        </div>
      </div>

      {/* Card 4: Controle de Prazos com Alertas Visuais */}
      <div className="bg-white rounded-xl p-5 border border-brand-200 shadow-soft hover:shadow-card transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-editorial-muted">
            Controle de Prazos
          </span>
          <CalendarClock className="w-5 h-5 text-brand-600" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {/* Atrasados (Vermelho) */}
          <button
            onClick={() => onSelectDeadlineFilter(activeDeadlineFilter === 'delayed' ? 'all' : 'delayed')}
            className={`p-2 rounded-lg text-center transition-all border ${
              activeDeadlineFilter === 'delayed'
                ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-400/30'
                : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
            }`}
            title="Clique para filtrar apenas pedidos em atraso"
          >
            <div className="flex items-center justify-center space-x-1 text-rose-700">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="font-bold text-base">{summary.delayedCount}</span>
            </div>
            <span className="text-[10px] font-medium text-rose-800 block mt-0.5">
              Atrasados
            </span>
          </button>

          {/* Próximos (Amarelo) */}
          <button
            onClick={() => onSelectDeadlineFilter(activeDeadlineFilter === 'due_soon' ? 'all' : 'due_soon')}
            className={`p-2 rounded-lg text-center transition-all border ${
              activeDeadlineFilter === 'due_soon'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100'
            }`}
            title="Clique para filtrar pedidos com entrega nos próximos 4 dias"
          >
            <div className="flex items-center justify-center space-x-1 text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-bold text-base">{summary.dueSoonCount}</span>
            </div>
            <span className="text-[10px] font-medium text-amber-800 block mt-0.5">
              Próximos
            </span>
          </button>

          {/* No Prazo (Verde) */}
          <button
            onClick={() => onSelectDeadlineFilter(activeDeadlineFilter === 'on_track' ? 'all' : 'on_track')}
            className={`p-2 rounded-lg text-center transition-all border ${
              activeDeadlineFilter === 'on_track'
                ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400/30'
                : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Clique para filtrar pedidos rigorosamente no prazo"
          >
            <div className="flex items-center justify-center space-x-1 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-bold text-base">{summary.onTrackCount}</span>
            </div>
            <span className="text-[10px] font-medium text-emerald-800 block mt-0.5">
              No Prazo
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
