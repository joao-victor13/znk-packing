import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Phone, 
  MapPin, 
  Clock, 
  Edit3, 
  Trash2, 
  PlusCircle,
  Star,
  Search
} from 'lucide-react';
import { Supplier, PurchaseOrder } from '../types';
import { formatCNPJ, formatPhone, formatCurrency } from '../utils/calculations';
import { useCustomization } from '../context/CustomizationContext';

interface SuppliersViewProps {
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  onNewSupplier: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onNewOrderForSupplier: (supplier: Supplier) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  orders,
  onNewSupplier,
  onEditSupplier,
  onDeleteSupplier,
  onNewOrderForSupplier,
}) => {
  const [search, setSearch] = useState('');
  const { hasPermission } = useCustomization();
  const canManageSuppliers = hasPermission('suppliers_manage');

  const filteredSuppliers = suppliers.filter(
    s =>
      (s.tradeName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.corporateName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header & Search */}
      <div className="bg-white dark:bg-stone-900 rounded-xl p-4 sm:p-5 border border-brand-200 dark:border-stone-800 shadow-soft flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-serif font-bold text-editorial-text dark:text-stone-100">
            Fornecedores & Facções
          </h1>
          <p className="text-xs text-editorial-muted dark:text-stone-400">
            Cadastro de confecções parceiras, prazos médios e contatos de compras.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-editorial-muted dark:text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar fornecedor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {canManageSuppliers && (
            <button
              onClick={onNewSupplier}
              className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs transition-all flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredSuppliers.map(sup => {
          const supOrders = orders.filter(o => o.supplierId === sup.id);
          const totalSpent = supOrders.reduce((sum, o) => sum + o.totalAmount, 0);
          const totalPieces = supOrders.reduce((sum, o) => sum + o.totalPieces, 0);

          return (
            <div
              key={sup.id}
              className="bg-white dark:bg-stone-900 rounded-xl p-4 border border-brand-200 dark:border-stone-800 shadow-soft hover:shadow-card transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                {/* Header: Name & Rating */}
                <div className="flex items-start justify-between">
                  <div className="truncate">
                    <h3 className="font-serif font-bold text-sm text-editorial-text dark:text-stone-100 truncate">
                      {sup.tradeName || sup.corporateName}
                    </h3>
                    <p className="text-[11px] font-mono text-editorial-muted dark:text-stone-400 mt-0.5 truncate">
                      CNPJ: {formatCNPJ(sup.cnpj)}
                    </p>
                  </div>
                  {sup.rating !== undefined && (
                    <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold flex-shrink-0">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{sup.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Category & Lead Time Chips */}
                <div className="flex items-center space-x-1.5 mt-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-300 border border-brand-200 dark:border-brand-800/40">
                    {sup.category || 'Confecção'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 flex items-center">
                    <Clock className="w-2.5 h-2.5 mr-1" />
                    {sup.averageLeadDays || 15}d prazo
                  </span>
                </div>

                {/* Concise Details */}
                <div className="mt-3 space-y-1.5 text-xs text-editorial-muted dark:text-stone-400">
                  {(sup.city || sup.state) && (
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <MapPin className="w-3 h-3 text-stone-400 flex-shrink-0" />
                      <span>{sup.city}{sup.state ? ` - ${sup.state}` : ''}</span>
                    </div>
                  )}

                  {sup.phone && (
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <a
                        href={`https://wa.me/55${sup.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium truncate"
                      >
                        {formatPhone(sup.phone)} ({sup.contactName || 'Comercial'})
                      </a>
                    </div>
                  )}
                </div>

                {/* Metrics Pill */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-editorial-muted dark:text-stone-400">
                    {supOrders.length} ped ({totalPieces} pçs)
                  </span>
                  <span className="font-mono font-bold text-brand-800 dark:text-brand-300 text-xs">
                    {formatCurrency(totalSpent)}
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {canManageSuppliers && (
                    <>
                      <button
                        onClick={() => onEditSupplier(sup)}
                        className="p-1 rounded text-stone-400 hover:text-brand-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remover fornecedor ${sup.tradeName}?`)) {
                            onDeleteSupplier(sup.id);
                          }
                        }}
                        className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => onNewOrderForSupplier(sup)}
                  className="px-2.5 py-1 rounded bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 text-brand-900 dark:text-brand-300 text-[11px] font-semibold flex items-center space-x-1 border border-brand-200 dark:border-brand-800/40 transition-colors"
                >
                  <PlusCircle className="w-3 h-3 text-brand-700 dark:text-brand-400" />
                  <span>Novo Pedido</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
