import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Palette, 
  Tag, 
  Users, 
  LayoutGrid, 
  Save, 
  RotateCcw, 
  Check, 
  Plus, 
  Trash2, 
  SlidersHorizontal,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useCustomization } from '../context/CustomizationContext';
import { 
  ThemeMode,
  CategoryItem, 
  SystemUser, 
  UserRole, 
  PermissionKey 
} from '../types';
import { 
  ROLE_DEFAULT_PERMISSIONS 
} from '../data/initialCustomization';
import { formatCNPJ, formatPhone } from '../utils/calculations';

interface SettingsViewProps {
  onShowToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
  const {
    storeSettings,
    updateStoreSettings,
    themeMode,
    setThemeMode,
    categories,
    addCategory,
    deleteCategory,
    resetCategories,
    users,
    currentUser,
    setCurrentUser,
    addUser,
    updateUser,
    deleteUser,
    layoutSettings,
    updateLayoutSettings,
    hasPermission,
    resetAllCustomizations,
  } = useCustomization();

  // Active Settings Tab
  const [activeTab, setActiveTab] = useState<'store' | 'theme' | 'categories' | 'users' | 'layout'>('store');

  // Store settings local form state
  const [storeForm, setStoreForm] = useState(storeSettings);

  useEffect(() => {
    setStoreForm(storeSettings);
  }, [storeSettings]);

  // Category modal/form state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('rose');

  // User modal/form state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState<{
    name: string;
    email: string;
    role: UserRole;
    roleTitle: string;
    themePreference: ThemeMode;
  }>({
    name: '',
    email: '',
    role: 'buyer_stylist',
    roleTitle: 'Compradora de Moda',
    themePreference: 'system',
  });

  const canManageSettings = hasPermission('settings_manage');
  const canManageCategories = hasPermission('categories_manage');

  // Save Store Settings
  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(storeForm);
    onShowToast('Dados da Loja atualizados com sucesso!', 'success');
  };

  // Add Category Handler
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    let badgeBg = 'bg-rose-50 dark:bg-rose-950/40';
    let badgeText = 'text-rose-800 dark:text-rose-300';
    let badgeBorder = 'border-rose-200 dark:border-rose-800/40';

    switch (newCatColor) {
      case 'amber':
        badgeBg = 'bg-amber-50 dark:bg-amber-950/40';
        badgeText = 'text-amber-800 dark:text-amber-300';
        badgeBorder = 'border-amber-200 dark:border-amber-800/40';
        break;
      case 'emerald':
        badgeBg = 'bg-emerald-50 dark:bg-emerald-950/40';
        badgeText = 'text-emerald-800 dark:text-emerald-300';
        badgeBorder = 'border-emerald-200 dark:border-emerald-800/40';
        break;
      case 'blue':
        badgeBg = 'bg-blue-50 dark:bg-blue-950/40';
        badgeText = 'text-blue-800 dark:text-blue-300';
        badgeBorder = 'border-blue-200 dark:border-blue-800/40';
        break;
      case 'purple':
        badgeBg = 'bg-purple-50 dark:bg-purple-950/40';
        badgeText = 'text-purple-800 dark:text-purple-300';
        badgeBorder = 'border-purple-200 dark:border-purple-800/40';
        break;
      case 'stone':
        badgeBg = 'bg-stone-100 dark:bg-stone-800/40';
        badgeText = 'text-stone-800 dark:text-stone-300';
        badgeBorder = 'border-stone-200 dark:border-stone-700/40';
        break;
    }

    addCategory({
      name: newCatName.trim(),
      badgeBg,
      badgeText,
      badgeBorder,
    });

    setNewCatName('');
    setIsAddingCategory(false);
    onShowToast(`Categoria "${newCatName}" criada!`, 'success');
  };

  // Add User Handler
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) return;

    const avatars = ['bg-brand-600', 'bg-rose-500', 'bg-emerald-600', 'bg-blue-600', 'bg-purple-600'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    addUser({
      name: newUserForm.name.trim(),
      email: newUserForm.email.trim(),
      role: newUserForm.role,
      roleTitle: newUserForm.roleTitle.trim() || 'Colaborador',
      avatarBg: randomAvatar,
      themePreference: newUserForm.themePreference,
      customPermissions: ROLE_DEFAULT_PERMISSIONS[newUserForm.role],
    });

    setNewUserForm({
      name: '',
      email: '',
      role: 'buyer_stylist',
      roleTitle: 'Compradora de Moda',
      themePreference: 'system',
    });
    setIsAddingUser(false);
    onShowToast('Novo usuário cadastrado!', 'success');
  };

  const permissionLabels: Record<PermissionKey, string> = {
    orders_create: 'Criar Pedidos',
    orders_edit: 'Editar Pedidos',
    orders_delete: 'Excluir Pedidos',
    orders_approve: 'Aprovar / Produção',
    orders_view_costs: 'Visualizar Custos & Preços (R$)',
    suppliers_manage: 'Gerenciar Fornecedores',
    categories_manage: 'Gerenciar Categorias',
    settings_manage: 'Configurações do Sistema',
    export_reports: 'Exportar PDF / Excel',
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-brand-200 dark:border-stone-800 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-stone-800 border border-brand-300 dark:border-stone-700 text-brand-800 dark:text-brand-300 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-serif font-bold text-editorial-text dark:text-stone-100">
              Configurações do Sistema
            </h1>
          </div>
          <p className="text-xs text-editorial-muted dark:text-stone-400 mt-1">
            Personalize a identidade da marca, tema visual, categorias e permissões de acesso.
          </p>
        </div>

        {/* Global Reset */}
        <button
          type="button"
          onClick={() => {
            if (confirm('Deseja restaurar todas as configurações para os padrões originais?')) {
              resetAllCustomizations();
              onShowToast('Configurações restauradas.', 'info');
            }
          }}
          className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium flex items-center space-x-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Padrões</span>
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('store')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            activeTab === 'store'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-editorial-muted dark:text-stone-400 hover:text-editorial-text dark:hover:text-stone-200 border border-brand-200 dark:border-stone-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Identidade da Loja</span>
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            activeTab === 'theme'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-editorial-muted dark:text-stone-400 hover:text-editorial-text dark:hover:text-stone-200 border border-brand-200 dark:border-stone-800'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Aparência & Tema</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            activeTab === 'categories'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-editorial-muted dark:text-stone-400 hover:text-editorial-text dark:hover:text-stone-200 border border-brand-200 dark:border-stone-800'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Categorias ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            activeTab === 'users'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-editorial-muted dark:text-stone-400 hover:text-editorial-text dark:hover:text-stone-200 border border-brand-200 dark:border-stone-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Usuários ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('layout')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            activeTab === 'layout'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-editorial-muted dark:text-stone-400 hover:text-editorial-text dark:hover:text-stone-200 border border-brand-200 dark:border-stone-800'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Layout da Tabela</span>
        </button>
      </div>

      {/* TAB 1: IDENTIDADE DA LOJA */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStoreSettings} className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-brand-200 dark:border-stone-800 shadow-soft space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-editorial-text dark:text-stone-100">
                Dados da Loja & Documentação
              </h2>
              <p className="text-xs text-editorial-muted dark:text-stone-400">
                Informações impressas nos cabeçalhos de ordens de compra em PDF e Excel.
              </p>
            </div>
            {canManageSettings && (
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-editorial-text dark:text-stone-200">
                Nome da Marca *
              </label>
              <input
                type="text"
                required
                value={storeForm.storeName}
                onChange={e => setStoreForm({ ...storeForm, storeName: e.target.value })}
                placeholder="ZNK Packing"
                className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs font-serif font-bold text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-editorial-text dark:text-stone-200">
                Slogan / Segmento
              </label>
              <input
                type="text"
                value={storeForm.tagline}
                onChange={e => setStoreForm({ ...storeForm, tagline: e.target.value })}
                placeholder="Gestão de Pedidos & Confecção"
                className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-editorial-text dark:text-stone-200">
                CNPJ
              </label>
              <input
                type="text"
                value={storeForm.cnpj}
                onChange={e => setStoreForm({ ...storeForm, cnpj: e.target.value })}
                placeholder="42.190.876/0001-33"
                className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs font-mono text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-editorial-text dark:text-stone-200">
                Razão Social
              </label>
              <input
                type="text"
                value={storeForm.legalName}
                onChange={e => setStoreForm({ ...storeForm, legalName: e.target.value })}
                placeholder="ZNK Packing Comércio & Confecção Ltda"
                className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-editorial-text dark:text-stone-200">
                Email Comercial
              </label>
              <input
                type="email"
                value={storeForm.email}
                onChange={e => setStoreForm({ ...storeForm, email: e.target.value })}
                placeholder="compras@znkpacking.com.br"
                className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-editorial-text dark:text-stone-200">
                WhatsApp / Telefone
              </label>
              <input
                type="text"
                value={storeForm.phone}
                onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })}
                placeholder="(11) 97654-3210"
                className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-editorial-text dark:text-stone-200">
                Endereço
              </label>
              <input
                type="text"
                value={storeForm.address}
                onChange={e => setStoreForm({ ...storeForm, address: e.target.value })}
                placeholder="Rua Oscar Freire, 1420 - Jardins"
                className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <label className="font-semibold text-editorial-text dark:text-stone-200">
                Nota de Rodapé (PDFs)
              </label>
              <input
                type="text"
                value={storeForm.footerNote}
                onChange={e => setStoreForm({ ...storeForm, footerNote: e.target.value })}
                placeholder="Ordem de Compra oficial ZNK Packing - Sujeita ao controle de qualidade."
                className="w-full px-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs text-editorial-text dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: APARÊNCIA & TEMA (CLARO / ESCURO / SISTEMA) */}
      {activeTab === 'theme' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-brand-200 dark:border-stone-800 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <div>
              <h2 className="text-base font-serif font-bold text-editorial-text dark:text-stone-100">
                Aparência Visual
              </h2>
              <p className="text-xs text-editorial-muted dark:text-stone-400">
                Escolha o tema de exibição. A preferência é salva individualmente para o usuário logado (<span className="font-semibold text-brand-700 dark:text-brand-400">{currentUser.name}</span>).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Opção 1: Claro */}
            <div
              onClick={() => {
                setThemeMode('light');
                onShowToast('Tema Claro ativado para seu usuário!', 'success');
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                themeMode === 'light'
                  ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/20 shadow-xs ring-1 ring-brand-500'
                  : 'border-stone-200 dark:border-stone-800 hover:border-brand-300 bg-white dark:bg-stone-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Sun className="w-5 h-5" />
                </div>
                {themeMode === 'light' && (
                  <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-sm text-editorial-text dark:text-stone-100">
                Modo Claro
              </h3>
              <p className="text-[11px] text-editorial-muted dark:text-stone-400 mt-1">
                Visual editorial com fundo linho/marfim e alto contraste.
              </p>
            </div>

            {/* Opção 2: Escuro */}
            <div
              onClick={() => {
                setThemeMode('dark');
                onShowToast('Modo Escuro ativado para seu usuário!', 'success');
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                themeMode === 'dark'
                  ? 'border-brand-600 bg-stone-800 shadow-xs ring-1 ring-brand-500'
                  : 'border-stone-200 dark:border-stone-800 hover:border-brand-300 bg-white dark:bg-stone-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400">
                  <Moon className="w-5 h-5" />
                </div>
                {themeMode === 'dark' && (
                  <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-sm text-editorial-text dark:text-stone-100">
                Modo Escuro
              </h3>
              <p className="text-[11px] text-editorial-muted dark:text-stone-400 mt-1">
                Interface noturna em grafite profundo com detalhes dourados.
              </p>
            </div>

            {/* Opção 3: Sistema */}
            <div
              onClick={() => {
                setThemeMode('system');
                onShowToast('Tema sincronizado com o Sistema Operacional!', 'info');
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                themeMode === 'system'
                  ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/20 shadow-xs ring-1 ring-brand-500'
                  : 'border-stone-200 dark:border-stone-800 hover:border-brand-300 bg-white dark:bg-stone-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300">
                  <Monitor className="w-5 h-5" />
                </div>
                {themeMode === 'system' && (
                  <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-sm text-editorial-text dark:text-stone-100">
                Automático / Sistema
              </h3>
              <p className="text-[11px] text-editorial-muted dark:text-stone-400 mt-1">
                Acompanha automaticamente as preferências do seu dispositivo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIAS */}
      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-brand-200 dark:border-stone-800 shadow-soft space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-serif font-bold text-editorial-text dark:text-stone-100">
                Linhas & Categorias de Confecção
              </h2>
              <p className="text-xs text-editorial-muted dark:text-stone-400">
                Tags para classificação rápida nas planilhas e relatórios.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {canManageCategories && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Restaurar lista de categorias padrão?')) {
                        resetCategories();
                        onShowToast('Categorias padrão restauradas!', 'info');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium"
                  >
                    Padrão
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center space-x-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Form Add Category */}
          {isAddingCategory && (
            <form onSubmit={handleAddCategory} className="p-3 bg-brand-50/60 dark:bg-stone-800 rounded-lg border border-brand-200 dark:border-stone-700 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nome da categoria (ex: Cropped, Tricot...)"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 bg-white dark:bg-stone-900 border border-brand-200 dark:border-stone-700 rounded-md text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                />
                <select
                  value={newCatColor}
                  onChange={e => setNewCatColor(e.target.value)}
                  className="px-2 py-1.5 bg-white dark:bg-stone-900 border border-brand-200 dark:border-stone-700 rounded-md text-xs text-stone-900 dark:text-stone-100 cursor-pointer"
                >
                  <option value="rose">Rosa / Terracota</option>
                  <option value="amber">Âmbar</option>
                  <option value="emerald">Esmeralda</option>
                  <option value="blue">Azul</option>
                  <option value="purple">Lavanda</option>
                  <option value="stone">Neutro</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-2.5 py-1 rounded border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-brand-600 text-white text-xs font-semibold"
                >
                  Salvar
                </button>
              </div>
            </form>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="p-2.5 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 flex items-center justify-between group"
              >
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder} truncate`}>
                  {cat.name}
                </span>

                {canManageCategories && categories.length > 1 && (
                  <button
                    onClick={() => {
                      deleteCategory(cat.id);
                      onShowToast(`Categoria "${cat.name}" removida.`, 'info');
                    }}
                    className="p-1 text-stone-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Excluir Categoria"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USUÁRIOS & PERMISSÕES */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-brand-200 dark:border-stone-800 shadow-soft space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-serif font-bold text-editorial-text dark:text-stone-100">
                Usuários & Perfis de Acesso
              </h2>
              <p className="text-xs text-editorial-muted dark:text-stone-400">
                Alterne de usuário ativo ou gerencie os níveis de permissão da equipe.
              </p>
            </div>

            {canManageSettings && (
              <button
                type="button"
                onClick={() => setIsAddingUser(true)}
                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center space-x-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Usuário</span>
              </button>
            )}
          </div>

          {/* Add User Modal */}
          {isAddingUser && (
            <form onSubmit={handleAddUser} className="p-3 bg-brand-50/60 dark:bg-stone-800 rounded-lg border border-brand-200 dark:border-stone-700 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nome do Usuário"
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="px-3 py-1.5 bg-white dark:bg-stone-900 border border-brand-200 dark:border-stone-700 rounded-md text-xs text-stone-900 dark:text-stone-100"
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={newUserForm.email}
                  onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="px-3 py-1.5 bg-white dark:bg-stone-900 border border-brand-200 dark:border-stone-700 rounded-md text-xs text-stone-900 dark:text-stone-100"
                />
                <select
                  value={newUserForm.role}
                  onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                  className="px-2 py-1.5 bg-white dark:bg-stone-900 border border-brand-200 dark:border-stone-700 rounded-md text-xs text-stone-900 dark:text-stone-100 cursor-pointer"
                >
                  <option value="admin">Administrador (Total)</option>
                  <option value="buyer_stylist">Comprador / Estilista</option>
                  <option value="production_manager">Gerente de PCP</option>
                  <option value="financial_auditor">Financeiro</option>
                  <option value="sales_assistant">Assistente</option>
                </select>
                <select
                  value={newUserForm.themePreference}
                  onChange={e => setNewUserForm({ ...newUserForm, themePreference: e.target.value as ThemeMode })}
                  className="px-2 py-1.5 bg-white dark:bg-stone-900 border border-brand-200 dark:border-stone-700 rounded-md text-xs text-stone-900 dark:text-stone-100 cursor-pointer"
                >
                  <option value="system">Tema: Sistema</option>
                  <option value="light">Tema: Claro</option>
                  <option value="dark">Tema: Escuro</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-2.5 py-1 rounded border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-brand-600 text-white text-xs font-semibold"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          )}

          {/* Users List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {users.map(u => {
              const isCurrent = currentUser.id === u.id;
              return (
                <div
                  key={u.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/20 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className={`w-9 h-9 rounded-full ${u.avatarBg} text-white font-bold flex items-center justify-center text-xs flex-shrink-0`}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-editorial-text dark:text-stone-100 truncate">
                          {u.name}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded bg-brand-600 text-white text-[9px] font-bold">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-editorial-muted dark:text-stone-400 truncate">
                        {u.roleTitle} • {u.themePreference === 'dark' ? 'Tema Escuro' : u.themePreference === 'light' ? 'Tema Claro' : 'Tema Sistema'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentUser(u);
                          onShowToast(`Perfil alterado para ${u.name}!`, 'info');
                        }}
                        className="px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-brand-100 text-stone-700 dark:text-stone-300 text-xs font-medium"
                      >
                        Alternar
                      </button>
                    )}
                    {canManageSettings && users.length > 1 && (
                      <button
                        onClick={() => {
                          deleteUser(u.id);
                          onShowToast(`Usuário removido.`, 'info');
                        }}
                        className="p-1 text-stone-400 hover:text-rose-600"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: LAYOUT & PLANILHA */}
      {activeTab === 'layout' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-brand-200 dark:border-stone-800 shadow-soft space-y-4">
          <div>
            <h2 className="text-base font-serif font-bold text-editorial-text dark:text-stone-100">
              Preferências de Visualização
            </h2>
            <p className="text-xs text-editorial-muted dark:text-stone-400">
              Ajuste as colunas e dados exibidos na planilha de pedidos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-lg border border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/40">
              <span className="font-semibold text-editorial-text dark:text-stone-200">
                Exibir Preço Sugerido de Varejo
              </span>
              <input
                type="checkbox"
                checked={layoutSettings.showSuggestedPrice}
                onChange={e => updateLayoutSettings({ showSuggestedPrice: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/40">
              <span className="font-semibold text-editorial-text dark:text-stone-200">
                Ocultar Valores Financeiros (Modo Discreto)
              </span>
              <input
                type="checkbox"
                checked={layoutSettings.hideFinancialValues}
                onChange={e => updateLayoutSettings({ hideFinancialValues: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
