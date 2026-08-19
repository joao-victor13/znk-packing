import React from 'react';
import { 
  Sparkles, 
  PlusCircle, 
  FileSpreadsheet, 
  Users, 
  SlidersHorizontal,
  Download, 
  Sun,
  Moon,
  Monitor,
  LogOut,
  ShieldCheck,
  Search,
  Command
} from 'lucide-react';
import { PurchaseOrder, ThemeMode } from '../types';
import { exportOrdersListToExcel } from '../utils/exportExcel';
import { useCustomization } from '../context/CustomizationContext';
import { getUserRoleLabel } from '../data/initialCustomization';

interface NavbarProps {
  activeView: 'list' | 'editor' | 'suppliers' | 'settings';
  onNavigate: (view: 'list' | 'editor' | 'suppliers' | 'settings') => void;
  onNewOrder: () => void;
  orders: PurchaseOrder[];
  onResetToDemo: () => void;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  onNewOrder,
  orders,
  onOpenCommandPalette,
}) => {
  const { storeSettings, currentUser, hasPermission, isAdmin, themeMode, setThemeMode, logout } = useCustomization();
  const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

  const cycleTheme = () => {
    const nextMode: Record<ThemeMode, ThemeMode> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    };
    setThemeMode(nextMode[themeMode] || 'light');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-brand-200 dark:border-stone-800 shadow-soft transition-colors">
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
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-editorial-text dark:text-stone-100 uppercase">
                  {storeSettings.storeName || 'ZNK PACKING'}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 dark:bg-brand-950/60 text-brand-800 dark:text-brand-300 tracking-wider uppercase border border-brand-300 dark:border-brand-800">
                  <Sparkles className="w-2.5 h-2.5 mr-1 text-brand-600 dark:text-brand-400" />
                  ERP
                </span>
              </div>
              <p className="text-[11px] text-editorial-muted dark:text-stone-400 hidden sm:block truncate max-w-xs">
                {storeSettings.tagline || 'Gestão de Pedidos & Confecção'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {/* Painel de Pedidos */}
            <button
              onClick={() => onNavigate('list')}
              className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                activeView === 'list'
                  ? 'bg-brand-100 dark:bg-stone-800 text-brand-900 dark:text-amber-300 shadow-xs border border-brand-300/60 dark:border-stone-700'
                  : 'text-editorial-muted dark:text-stone-400 hover:text-editorial-text dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-brand-600 dark:text-amber-400" />
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
              className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                activeView === 'suppliers'
                  ? 'bg-brand-100 dark:bg-stone-800 text-brand-900 dark:text-amber-300 shadow-xs border border-brand-300/60 dark:border-stone-700'
                  : 'text-editorial-muted dark:text-stone-400 hover:text-editorial-text dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/50'
              }`}
            >
              <Users className="w-4 h-4 text-brand-600 dark:text-amber-400" />
              <span>Fornecedores</span>
            </button>

            {/* Configurações */}
            <button
              onClick={() => onNavigate('settings')}
              className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                activeView === 'settings'
                  ? 'bg-brand-100 dark:bg-stone-800 text-brand-900 dark:text-amber-300 shadow-xs border border-brand-300/60 dark:border-stone-700'
                  : 'text-editorial-muted dark:text-stone-400 hover:text-editorial-text dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-brand-600 dark:text-amber-400" />
              <span>Configurações</span>
            </button>

            {/* Global Command Palette Trigger Button */}
            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                title="Busca Global & Ações Rápidas (Ctrl + K)"
                className="hidden sm:flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-editorial-muted dark:text-stone-300 text-xs transition-colors shadow-2xs group cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-brand-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline text-[11px] font-medium">Buscar</span>
                <kbd className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded text-stone-500 dark:text-stone-400 shadow-2xs">
                  Ctrl+K
                </kbd>
              </button>
            )}

            {/* Export All Orders */}
            {hasPermission('export_reports') && (
              <button
                onClick={() => exportOrdersListToExcel(orders)}
                title="Exportar consolidado em Excel (.xlsx)"
                className="p-2 rounded-lg text-editorial-muted dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors hidden lg:flex items-center space-x-1 text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Excel</span>
              </button>
            )}

            {/* Light / Dark / System Quick Toggle */}
            <button
              onClick={cycleTheme}
              title={`Tema: ${themeMode === 'light' ? 'Claro' : themeMode === 'dark' ? 'Escuro' : 'Sistema'}. Clique para alternar.`}
              className="p-2 rounded-lg text-editorial-muted dark:text-stone-400 hover:text-editorial-text dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center justify-center"
            >
              {themeMode === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
              {themeMode === 'dark' && <Moon className="w-4 h-4 text-brand-400" />}
              {themeMode === 'system' && <Monitor className="w-4 h-4 text-stone-500 dark:text-stone-400" />}
            </button>

            {/* Active User Avatar Pill */}
            <div 
              onClick={() => onNavigate('settings')}
              title={`Perfil: ${currentUser.name} (${getUserRoleLabel(currentUser.role)})`}
              className="flex items-center space-x-1.5 pl-2 pr-2.5 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-brand-50 dark:hover:bg-stone-700 rounded-full border border-stone-200 dark:border-stone-700 cursor-pointer transition-colors"
            >
              <div className={`w-6 h-6 rounded-full ${currentUser.avatarBg} text-white font-bold flex items-center justify-center text-[10px]`}>
                {currentUser.name.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-editorial-text dark:text-stone-200 hidden md:inline truncate max-w-[90px]">
                {currentUser.name.split(' ')[0]}
              </span>
              {isAdmin && (
                <span className="px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-[9px] font-bold border border-amber-300 dark:border-amber-800 hidden xl:inline-flex items-center">
                  <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                  Admin
                </span>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Encerrar sessão / Sair do sistema"
              className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Primary Action: Novo Pedido */}
            {hasPermission('orders_create') && (
              <button
                onClick={onNewOrder}
                className="ml-1 sm:ml-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs sm:text-sm transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 flex-shrink-0"
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
