import React from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Layers, 
  List, 
  Kanban,
  Building2
} from 'lucide-react';
import { Supplier, OrderFilterState } from '../types';

interface FilterBarProps {
  filters: OrderFilterState;
  onFilterChange: (filters: OrderFilterState) => void;
  suppliers: Supplier[];
  viewMode: 'table' | 'grouped' | 'kanban';
  onViewModeChange: (mode: 'table' | 'grouped' | 'kanban') => void;
  availableMonths: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  suppliers,
  viewMode,
  onViewModeChange,
  availableMonths,
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, supplierId: e.target.value });
  };

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...filters, status });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, periodMonth: e.target.value });
  };

  const handleResetFilters = () => {
    onFilterChange({
      search: '',
      supplierId: 'all',
      status: 'all',
      periodMonth: 'all',
      deadlineToFilter: 'all',
      sortBy: 'date_desc',
    });
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.supplierId !== 'all' ||
    filters.status !== 'all' ||
    filters.periodMonth !== 'all' ||
    filters.deadlineToFilter !== 'all';

  const statusOptions = [
    { key: 'all', label: 'Todos' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'approved', label: 'Aprovados / Em Produção' },
    { key: 'in_transit', label: 'Em Trânsito' },
    { key: 'delivered', label: 'Entregues' },
    { key: 'cancelled', label: 'Cancelados' },
  ];

  return (
    <div className="bg-white rounded-xl p-4 border border-brand-200 shadow-soft mb-6 space-y-4">
      {/* Top row: Search, Supplier, Month & View Mode */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-editorial-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nº pedido, ref/sku, produto ou fornecedor..."
            value={filters.search}
            onChange={handleTextChange}
            className="w-full pl-9 pr-4 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text placeholder-editorial-subtle focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
          {/* Supplier Dropdown */}
          <div className="relative min-w-[160px] flex-1 sm:flex-none">
            <select
              value={filters.supplierId}
              onChange={handleSupplierChange}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
            >
              <option value="all">Todos os Fornecedores</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.tradeName || s.name}
                </option>
              ))}
            </select>
            <Building2 className="w-3.5 h-3.5 text-editorial-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Month / Period Dropdown */}
          <div className="relative min-w-[140px] flex-1 sm:flex-none">
            <select
              value={filters.periodMonth}
              onChange={handleMonthChange}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
            >
              <option value="all">Todos os Períodos</option>
              {availableMonths.map(m => {
                const [year, month] = m.split('-');
                const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                return (
                  <option key={m} value={m}>
                    {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                  </option>
                );
              })}
            </select>
            <Filter className="w-3.5 h-3.5 text-editorial-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              onClick={() => onViewModeChange('table')}
              title="Visualização em Tabela Detalhada"
              className={`p-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-brand-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden xl:inline text-xs">Tabela</span>
            </button>

            <button
              onClick={() => onViewModeChange('grouped')}
              title="Agrupar por Fornecedor"
              className={`p-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition-all ${
                viewMode === 'grouped'
                  ? 'bg-white text-brand-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden xl:inline text-xs">Agrupado</span>
            </button>

            <button
              onClick={() => onViewModeChange('kanban')}
              title="Visualização Kanban de Produção"
              className={`p-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-brand-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden xl:inline text-xs">Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Status Pills & Active filter reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-editorial-muted mr-1">Status:</span>
          {statusOptions.map(st => (
            <button
              key={st.key}
              onClick={() => handleStatusChange(st.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filters.status === st.key
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-editorial-light text-editorial-muted hover:bg-stone-100 hover:text-editorial-text border border-brand-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center space-x-1 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>
    </div>
  );
};
