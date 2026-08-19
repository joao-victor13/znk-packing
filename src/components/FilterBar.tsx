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
    onFilterChange({ ...filters, status: status as any });
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
    { key: 'approved', label: 'Produção' },
    { key: 'in_transit', label: 'Em Trânsito' },
    { key: 'delivered', label: 'Entregues' },
    { key: 'cancelled', label: 'Cancelados' },
  ];

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl p-3.5 sm:p-4 border border-brand-200 dark:border-stone-800 shadow-soft mb-5 space-y-3">
      {/* Top row: Search, Supplier, Month & View Mode */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-editorial-muted dark:text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nº pedido, ref/sku, produto ou fornecedor..."
            value={filters.search}
            onChange={handleTextChange}
            className="w-full pl-9 pr-8 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs sm:text-sm text-editorial-text dark:text-stone-100 placeholder-editorial-muted dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
          {/* Supplier Dropdown */}
          <div className="relative min-w-[150px] flex-1 sm:flex-none">
            <select
              value={filters.supplierId}
              onChange={handleSupplierChange}
              className="w-full appearance-none pl-3 pr-7 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">Todos os Fornecedores</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.tradeName || s.corporateName}
                </option>
              ))}
            </select>
            <Building2 className="w-3.5 h-3.5 text-editorial-muted dark:text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Month / Period Dropdown */}
          <div className="relative min-w-[130px] flex-1 sm:flex-none">
            <select
              value={filters.periodMonth}
              onChange={handleMonthChange}
              className="w-full appearance-none pl-3 pr-7 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">Todos os Meses</option>
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
            <Filter className="w-3.5 h-3.5 text-editorial-muted dark:text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              onClick={() => onViewModeChange('table')}
              title="Visualização em Tabela"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-brand-600 dark:bg-brand-600 text-white shadow-sm ring-1 ring-brand-700/20'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-xs">Tabela</span>
            </button>

            <button
              onClick={() => onViewModeChange('grouped')}
              title="Agrupado por Fornecedor"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'grouped'
                  ? 'bg-brand-600 dark:bg-brand-600 text-white shadow-sm ring-1 ring-brand-700/20'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-xs">Agrupado</span>
            </button>

            <button
              onClick={() => onViewModeChange('kanban')}
              title="Kanban de Produção"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-brand-600 dark:bg-brand-600 text-white shadow-sm ring-1 ring-brand-700/20'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-xs">Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Status Pills & Active filter reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-editorial-muted dark:text-stone-400 mr-1">Status:</span>
          {statusOptions.map(st => (
            <button
              key={st.key}
              onClick={() => handleStatusChange(st.key)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                filters.status === st.key
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-editorial-light dark:bg-stone-800 text-editorial-muted dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-editorial-text dark:hover:text-stone-100 border border-brand-200 dark:border-stone-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>
    </div>
  );
};
