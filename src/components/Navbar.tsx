import React from 'react';
import { 
  Sparkles, 
  PlusCircle, 
  Store, 
  FileSpreadsheet, 
  Users, 
  SlidersHorizontal,
  Download, 
  RotateCcw,
  Shield,
  UserCheck
} from 'lucide-react';
import { PurchaseOrder } from '../types';
import { exportOrdersListToExcel } from '../utils/exportExcel';
import { useCustomization } from '../context/CustomizationContext';

interface NavbarProps {
  activeView: 'list' | 'editor' | 'suppliers' | 'settings';
  onNavigate: (view: 'list' | 'editor' | 'suppliers' | 'settings') => void;
  onNewOrder: () => void;
  orders: PurchaseOrder[];
  onResetToDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  onNewOrder,
  orders,
  onResetToDemo,
}) => {
  const { storeSettings, currentUser, hasPermission } = useCustomization();
  const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-200 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Store Name */}
          <div 
            className="flex items-center space-x-3 sm:space-x-4 cursor-pointer group" 
            onClick={() => onNavigate('list')}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 flex items-center justify-center text-white shadow-md shadow-brand-900/20 group-hover:scale-105 transition-transform border border-brand-300/40 relative overflow-hidden flex-shrink-0">
              <span className="font-serif font-black text-2xl sm:text-3xl tracking-tighter text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] select-none leading-none pt-0.5">
                Z
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10 pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-editorial-text uppercase">
                  {storeSettings.storeName || 'ZNK PACKING'}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-800 tracking-wider uppercase border border-brand-300">
                  <Sparkles className="w-2.5 h-2.5 mr-1 text-brand-600" />
                  Boutique ERP
                </span>
              </div>
              <p className="text-[11px] text-editorial-muted hidden sm:block truncate max-w-xs">
                {storeSettings.tagline || 'Gestão de Pedidos de Compra & Confecção Feminina'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {/* Painel de Pedidos */}
            <button
              onClick={() => onNavigate('list')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                activeView === 'list'
                  ? 'bg-brand-100 text-brand-900 font-semibold shadow-xs'
                  : 'text-editorial-muted hover:text-editorial-text hover:bg-stone-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-brand-600" />
              <span>Pedidos</span>
              {activeOrdersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-brand-600 text-white rounded-full text-[10px] font-bold">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            {/* Fornecedores */}
            <button
              onClick={() => onNavigate('suppliers')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                activeView === 'suppliers'
                  ? 'bg-brand-100 text-brand-900 font-semibold shadow-xs'
                  : 'text-editorial-muted hover:text-editorial-text hover:bg-stone-100'
              }`}
            >
              <Users className="w-4 h-4 text-brand-600" />
              <span>Fornecedores</span>
            </button>

            {/* Customização & Configurações */}
            <button
              onClick={() => onNavigate('settings')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                activeView === 'settings'
                  ? 'bg-brand-100 text-brand-900 font-semibold shadow-xs'
                  : 'text-editorial-muted hover:text-editorial-text hover:bg-stone-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-brand-600" />
              <span>Customizar</span>
            </button>

            {/* Export All Orders (if permitted) */}
            {hasPermission('export_reports') && (
              <button
                onClick={() => exportOrdersListToExcel(orders)}
                title="Exportar consolidado de pedidos em Excel (.xlsx)"
                className="p-2 rounded-lg text-editorial-muted hover:text-emerald-700 hover:bg-emerald-50 transition-colors hidden lg:flex items-center space-x-1 text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Geral</span>
              </button>
            )}

            {/* Active User Avatar Pill */}
            <div 
              onClick={() => onNavigate('settings')}
              title={`Logado como: ${currentUser.name} (${currentUser.roleTitle}). Clique para gerenciar permissões.`}
              className="flex items-center space-x-1.5 pl-2 pr-2.5 py-1 bg-stone-100 hover:bg-brand-50 rounded-full border border-stone-200 cursor-pointer transition-colors"
            >
              <div className={`w-6 h-6 rounded-full ${currentUser.avatarBg} text-white font-bold flex items-center justify-center text-[10px]`}>
                {currentUser.name.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-editorial-text hidden md:inline truncate max-w-[100px]">
                {currentUser.name.split(' ')[0]}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-brand-900 font-mono hidden xl:inline border border-stone-200">
                {currentUser.role === 'admin' ? 'Admin' : currentUser.roleTitle.split(' ')[0]}
              </span>
            </div>

            {/* Primary Action: Novo Pedido (if permitted) */}
            {hasPermission('orders_create') && (
              <button
                onClick={onNewOrder}
                className="ml-1 sm:ml-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs sm:text-sm transition-all duration-150 flex items-center space-x-1.5 shadow-sm hover:shadow-md active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Pedido</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
