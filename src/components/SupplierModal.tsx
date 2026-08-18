import React, { useState } from 'react';
import { X, Building2, Save, Sparkles } from 'lucide-react';
import { Supplier } from '../types';
import { PAYMENT_TERMS_OPTIONS } from '../data/initialData';
import { generateUUID } from '../utils/calculations';

interface SupplierModalProps {
  supplierToEdit?: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  supplierToEdit,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [tradeName, setTradeName] = useState(supplierToEdit?.tradeName || '');
  const [name, setName] = useState(supplierToEdit?.name || '');
  const [cnpj, setCnpj] = useState(supplierToEdit?.cnpj || '');
  const [contactName, setContactName] = useState(supplierToEdit?.contactName || '');
  const [phone, setPhone] = useState(supplierToEdit?.phone || '');
  const [email, setEmail] = useState(supplierToEdit?.email || '');
  const [city, setCity] = useState(supplierToEdit?.city || '');
  const [state, setState] = useState(supplierToEdit?.state || 'SP');
  const [categorySpecialty, setCategorySpecialty] = useState(supplierToEdit?.categorySpecialty || '');
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(
    supplierToEdit?.defaultPaymentTerms || PAYMENT_TERMS_OPTIONS[0]
  );
  const [averageLeadDays, setAverageLeadDays] = useState(supplierToEdit?.averageLeadDays || 18);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeName || !name) {
      alert('Por favor, informe a Razão Social e Nome Fantasia.');
      return;
    }

    const supplier: Supplier = {
      id: supplierToEdit ? supplierToEdit.id : generateUUID(),
      tradeName,
      name,
      corporateName: name,
      cnpj,
      contactName,
      phone,
      email,
      city,
      state,
      categorySpecialty: categorySpecialty || 'Confecção Geral',
      defaultPaymentTerms,
      averageLeadDays: Number(averageLeadDays) || 18,
      rating: supplierToEdit ? supplierToEdit.rating : 4.8,
    };

    onSave(supplier);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-brand-200 shadow-dropdown max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-brand-50/70 border-b border-brand-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-editorial-text">
                {supplierToEdit ? 'Editar Fornecedor / Oficina' : 'Novo Fornecedor / Oficina de Confecção'}
              </h2>
              <p className="text-[11px] text-editorial-muted">
                Cadastre os dados de contato e condições comerciais da oficina têxtil.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nome Fantasia */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-editorial-text">
                Nome Fantasia (Como é conhecido) *
              </label>
              <input
                type="text"
                required
                value={tradeName}
                onChange={e => setTradeName(e.target.value)}
                placeholder="Ex: Prime Tricot & Malhas"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Razão Social */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-editorial-text">
                Razão Social (Documental) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Têxtil & Malharia Prime Sul Ltda"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* CNPJ */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-editorial-text">
                CNPJ
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm font-mono text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Contato Comercial */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-editorial-text">
                Contato Comercial
              </label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="Ex: Mariana Silveira"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Telefone / WhatsApp */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-editorial-text">
                WhatsApp / Telefone *
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-editorial-text">
                Email para Pedidos
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="pedidos@fornecedor.com.br"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Cidade e UF */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-editorial-text">
                Cidade
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="São Paulo, Brusque, etc."
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-editorial-text">
                UF / Estado
              </label>
              <input
                type="text"
                maxLength={2}
                value={state}
                onChange={e => setState(e.target.value.toUpperCase())}
                placeholder="SP"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 uppercase"
              />
            </div>

            {/* Especialidade de Confecção */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-editorial-text">
                Especialidade / Tipos de Peça
              </label>
              <input
                type="text"
                value={categorySpecialty}
                onChange={e => setCategorySpecialty(e.target.value)}
                placeholder="Ex: Alfaiataria, Tricot, Linho puro, Jeanswear..."
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Condição Padrão & Lead Time */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-editorial-text">
                Condição de Pagamento Padrão
              </label>
              <select
                value={defaultPaymentTerms}
                onChange={e => setDefaultPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {PAYMENT_TERMS_OPTIONS.map((opt, idx) => (
                  <option key={idx} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-editorial-text">
                Prazo Médio de Produção (Dias)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={averageLeadDays}
                onChange={e => setAverageLeadDays(parseInt(e.target.value, 10) || 18)}
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm font-mono text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stone-200 text-editorial-muted hover:bg-stone-50 text-xs sm:text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Fornecedor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
