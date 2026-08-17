import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CreditCard, 
  Edit3, 
  Trash2, 
  PlusCircle,
  Star,
  Search
} from 'lucide-react';
import { Supplier, PurchaseOrder } from '../types';
import { formatCNPJ, formatPhone, formatCurrency } from '../utils/calculations';

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

  const filteredSuppliers = suppliers.filter(
    s =>
      s.tradeName.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.categorySpecialty.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white rounded-xl p-5 border border-brand-200 shadow-soft flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-editorial-text">
            Fornecedores & Oficinas de Confecção
          </h1>
          <p className="text-xs text-editorial-muted">
            Gerencie o cadastro de parceiros fabris, prazos médios de entrega e condições de pagamento.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-editorial-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar fornecedor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            onClick={onNewSupplier}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-sm transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Grid of Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSuppliers.map(sup => {
          const supOrders = orders.filter(o => o.supplierId === sup.id);
          const totalSpent = supOrders.reduce((sum, o) => sum + o.totalAmount, 0);
          const totalPieces = supOrders.reduce((sum, o) => sum + o.totalPieces, 0);

          return (
            <div
              key={sup.id}
              className="bg-white rounded-xl p-5 border border-brand-200 shadow-soft hover:shadow-card transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header: Name & Rating */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-editorial-text">
                      {sup.tradeName}
                    </h3>
                    <p className="text-xs text-editorial-muted">{sup.name}</p>
                    <span className="inline-block mt-1 font-mono text-[11px] text-editorial-subtle">
                      CNPJ: {formatCNPJ(sup.cnpj)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-amber-800 text-xs font-bold">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{sup.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Specialty Pill */}
                <div className="mt-3">
                  <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-brand-50 text-brand-900 border border-brand-200">
                    {sup.categorySpecialty}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-editorial-muted">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    <span>{sup.city} - {sup.state}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <a
                      href={`https://wa.me/55${sup.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline font-medium"
                    >
                      {formatPhone(sup.phone)} ({sup.contactName})
                    </a>
                  </div>

                  {sup.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span className="truncate">{sup.email}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    <span>{sup.defaultPaymentTerms}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                    <span>Lead time médio: <strong>{sup.averageLeadDays} dias</strong></span>
                  </div>
                </div>

                {/* Metrics Summary */}
                <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-stone-50 p-2 rounded">
                    <span className="text-[10px] text-editorial-muted block uppercase">Pedidos / Peças</span>
                    <strong className="font-mono text-editorial-text">{supOrders.length} ped ({totalPieces} un)</strong>
                  </div>
                  <div className="bg-brand-50/50 p-2 rounded">
                    <span className="text-[10px] text-brand-800 block uppercase">Volume Comprado</span>
                    <strong className="font-mono text-brand-900">{formatCurrency(totalSpent)}</strong>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onEditSupplier(sup)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-brand-800 hover:bg-brand-50 transition-colors"
                    title="Editar fornecedor"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover o fornecedor ${sup.tradeName}?`)) {
                        onDeleteSupplier(sup.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Excluir fornecedor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => onNewOrderForSupplier(sup)}
                  className="px-3 py-1.5 rounded-lg bg-brand-100 hover:bg-brand-200 text-brand-900 text-xs font-semibold flex items-center space-x-1 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-brand-700" />
                  <span>Emitir Pedido</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
