import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  PlusCircle, 
  FileSpreadsheet, 
  Users, 
  SlidersHorizontal, 
  Download, 
  Sun, 
  Moon, 
  Building2, 
  ArrowRight, 
  Clock, 
  Sparkles,
  Command,
  X,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { PurchaseOrder, Supplier, ThemeMode } from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';
import { useCustomization } from '../context/CustomizationContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  onNavigate: (view: 'list' | 'editor' | 'suppliers' | 'settings') => void;
  onNewOrder: () => void;
  onEditOrder: (order: PurchaseOrder) => void;
  onExportExcel: () => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Ações Rápidas' | 'Pedidos' | 'Fornecedores' | 'Navegação' | 'Recentes';
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  orders,
  suppliers,
  onNavigate,
  onNewOrder,
  onEditOrder,
  onExportExcel,
  onShowToast,
}) => {
  const { themeMode, setThemeMode, layoutSettings, hasPermission } = useCustomization();
  const canViewCosts = hasPermission('orders_view_costs') && !layoutSettings.hideFinancialValues;
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Build searchable items catalogue
  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];

    // 1. QUICK ACTIONS
    items.push({
      id: 'action-new-order',
      title: 'Criar Novo Pedido de Compra',
      subtitle: 'Abrir formulário de ordem de corte e confecção',
      category: 'Ações Rápidas',
      icon: <PlusCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />,
      badge: 'Ctrl+N',
      action: () => {
        onNewOrder();
        onClose();
      },
    });

    items.push({
      id: 'action-export-excel',
      title: 'Exportar Planilha Completa (Excel)',
      subtitle: 'Baixar relatório de pedidos com grade de tamanhos e custos',
      category: 'Ações Rápidas',
      icon: <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      badge: 'XLSX',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      action: () => {
        onExportExcel();
        onClose();
      },
    });

    items.push({
      id: 'action-toggle-theme',
      title: themeMode === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro',
      subtitle: 'Ajustar contraste da interface visual',
      category: 'Ações Rápidas',
      icon: themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-brand-400" />,
      action: () => {
        const next = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(next);
        onShowToast(`Tema alterado para modo ${next === 'dark' ? 'escuro' : 'claro'}`, 'info');
        onClose();
      },
    });

    // 2. NAVIGATION
    items.push({
      id: 'nav-orders',
      title: 'Ir para Painel de Pedidos',
      subtitle: `Visualizar lista com ${orders.length} pedidos`,
      category: 'Navegação',
      icon: <FileSpreadsheet className="w-4 h-4 text-brand-600 dark:text-brand-400" />,
      action: () => {
        onNavigate('list');
        onClose();
      },
    });

    items.push({
      id: 'nav-suppliers',
      title: 'Ir para Gestão de Fornecedores & Facções',
      subtitle: `Visualizar ${suppliers.length} fornecedores cadastrados`,
      category: 'Navegação',
      icon: <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />,
      action: () => {
        onNavigate('suppliers');
        onClose();
      },
    });

    items.push({
      id: 'nav-settings',
      title: 'Ir para Configurações, Loja & Usuários',
      subtitle: 'Gerenciar dados da marca, categorias e equipe',
      category: 'Navegação',
      icon: <SlidersHorizontal className="w-4 h-4 text-brand-600 dark:text-brand-400" />,
      action: () => {
        onNavigate('settings');
        onClose();
      },
    });

    // 3. PURCHASE ORDERS
    orders.forEach(order => {
      const statusLabels: Record<string, string> = {
        pending: 'Pendente',
        approved: 'Aprovado',
        production: 'Em Produção',
        delivered: 'Entregue',
        cancelled: 'Cancelado',
      };

      const statusColors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
        approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
        production: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
        delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
      };

      items.push({
        id: `order-${order.id}`,
        title: `Pedido ${order.orderNumber} - ${order.supplierTradeName || order.supplierName}`,
        subtitle: `${order.collection} • ${order.totalPieces} peças • ${canViewCosts ? formatCurrency(order.totalAmount) : 'R$ ••••••'}`,
        category: 'Pedidos',
        icon: <FileSpreadsheet className="w-4 h-4 text-stone-500 dark:text-stone-400" />,
        badge: statusLabels[order.status] || order.status,
        badgeColor: statusColors[order.status] || 'bg-stone-100 text-stone-800',
        action: () => {
          onEditOrder(order);
          onClose();
        },
      });
    });

    // 4. SUPPLIERS
    suppliers.forEach(sup => {
      items.push({
        id: `supplier-${sup.id}`,
        title: `Fornecedor: ${sup.tradeName}`,
        subtitle: `${sup.contactName} • ${sup.phone} • ${sup.categorySpecialty || sup.category || 'Confecção'}`,
        category: 'Fornecedores',
        icon: <Building2 className="w-4 h-4 text-stone-500 dark:text-stone-400" />,
        badge: sup.state ? `${sup.city}/${sup.state}` : sup.city,
        badgeColor: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
        action: () => {
          onNavigate('suppliers');
          onClose();
        },
      });
    });

    return items;
  }, [orders, suppliers, themeMode, onNewOrder, onNavigate, onEditOrder, onExportExcel, setThemeMode, onShowToast, onClose]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return allItems.slice(0, 10);
    }

    const q = query.toLowerCase().trim();
    return allItems.filter(item => 
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      (item.badge && item.badge.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [allItems, query]);

  // Keyboard navigation inside Palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside backdrop to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-brand-200/80 dark:border-stone-800 overflow-hidden z-10 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-stone-200 dark:border-stone-800 flex items-center space-x-3 bg-stone-50/50 dark:bg-stone-900/80">
          <Search className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Digite para buscar pedidos, fornecedores ou ações..."
            className="w-full bg-transparent text-sm sm:text-base text-editorial-text dark:text-stone-100 placeholder:text-editorial-muted dark:placeholder:text-stone-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center space-x-1 pl-2 border-l border-stone-200 dark:border-stone-700 text-[10px] text-editorial-muted dark:text-stone-400 font-mono">
            <span className="px-1.5 py-0.5 rounded bg-stone-200/60 dark:bg-stone-800 font-bold border border-stone-300 dark:border-stone-700">ESC</span>
            <span>para fechar</span>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 divide-y divide-transparent">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-editorial-muted dark:text-stone-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 stroke-[1.5]" />
              <p className="text-sm font-medium">Nenhum resultado encontrado para "{query}"</p>
              <p className="text-xs">Tente buscar pelo número do pedido, nome do fornecedor ou ação rápida.</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-brand-50/80 dark:bg-brand-950/40 border border-brand-300/80 dark:border-brand-800/60 shadow-2xs'
                      : 'hover:bg-stone-100/60 dark:hover:bg-stone-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}>
                      {item.icon}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs sm:text-sm font-semibold truncate ${
                          isSelected ? 'text-brand-950 dark:text-brand-200 font-bold' : 'text-editorial-text dark:text-stone-200'
                        }`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                            item.badgeColor || 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-editorial-muted dark:text-stone-400 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pl-2 flex-shrink-0">
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium hidden sm:inline">
                      {item.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${
                      isSelected ? 'text-brand-600 dark:text-brand-400 translate-x-0.5' : 'text-transparent'
                    }`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="p-3 bg-stone-50 dark:bg-stone-900/90 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-editorial-muted dark:text-stone-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-[10px]">↑↓</span>
              <span>Navegar</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-[10px]">↵</span>
              <span>Selecionar</span>
            </span>
          </div>

          <div className="flex items-center space-x-1 text-brand-700 dark:text-brand-400 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>ZNK Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
};
