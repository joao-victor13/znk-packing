import React, { useState } from 'react';
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
  Edit3, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Crown, 
  Store, 
  Gem, 
  Layers, 
  CheckCircle2, 
  SlidersHorizontal,
  Moon,
  Sun
} from 'lucide-react';
import { useCustomization } from '../context/CustomizationContext';
import { 
  ThemePreset, 
  FontFamilyOption, 
  TableDensity, 
  CategoryItem, 
  SystemUser, 
  UserRole, 
  PermissionKey 
} from '../types';
import { 
  THEME_PALETTES, 
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
    themeSettings,
    updateThemeSettings,
    categories,
    addCategory,
    updateCategory,
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

  React.useEffect(() => {
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
  }>({
    name: '',
    email: '',
    role: 'buyer_stylist',
    roleTitle: 'Compradora de Moda',
  });

  // Save Store Settings
  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(storeForm);
    onShowToast('Dados da Loja e Marca atualizados com sucesso!', 'success');
  };

  // Add Category Handler
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    let badgeBg = 'bg-rose-50';
    let badgeText = 'text-rose-800';
    let badgeBorder = 'border-rose-200';

    switch (newCatColor) {
      case 'amber':
        badgeBg = 'bg-amber-50';
        badgeText = 'text-amber-800';
        badgeBorder = 'border-amber-200';
        break;
      case 'emerald':
        badgeBg = 'bg-emerald-50';
        badgeText = 'text-emerald-800';
        badgeBorder = 'border-emerald-200';
        break;
      case 'blue':
        badgeBg = 'bg-blue-50';
        badgeText = 'text-blue-800';
        badgeBorder = 'border-blue-200';
        break;
      case 'purple':
        badgeBg = 'bg-purple-50';
        badgeText = 'text-purple-800';
        badgeBorder = 'border-purple-200';
        break;
      case 'stone':
        badgeBg = 'bg-stone-100';
        badgeText = 'text-stone-800';
        badgeBorder = 'border-stone-200';
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
    onShowToast(`Categoria "${newCatName}" criada com sucesso!`, 'success');
  };

  // Add User Handler
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;

    const avatarBgs = ['bg-brand-600', 'bg-rose-500', 'bg-emerald-600', 'bg-blue-600', 'bg-purple-600'];
    const avatarBg = avatarBgs[Math.floor(Math.random() * avatarBgs.length)];

    addUser({
      name: newUserForm.name,
      email: newUserForm.email,
      role: newUserForm.role,
      roleTitle: newUserForm.roleTitle || newUserForm.role,
      avatarBg,
    });

    setNewUserForm({
      name: '',
      email: '',
      role: 'buyer_stylist',
      roleTitle: 'Compradora de Moda',
    });
    setIsAddingUser(false);
    onShowToast(`Usuário "${newUserForm.name}" adicionado à equipe!`, 'success');
  };

  const fontOptions: FontFamilyOption[] = [
    'Plus Jakarta Sans',
    'Inter',
    'Outfit',
    'Montserrat',
    'Manrope',
    'Playfair Display',
    'Cormorant Garamond',
    'Cinzel',
  ];

  const permissionLabels: Record<PermissionKey, string> = {
    orders_create: 'Criar Novos Pedidos',
    orders_edit: 'Editar Pedidos Existentes',
    orders_delete: 'Excluir Pedidos',
    orders_approve: 'Aprovar / Enviar para Produção',
    orders_view_costs: 'Visualizar Custos & Preços (R$)',
    suppliers_manage: 'Gerenciar Fornecedores',
    categories_manage: 'Gerenciar Categorias de Produtos',
    settings_manage: 'Alterar Configurações e Temas',
    export_reports: 'Exportar PDF / Excel',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-brand-200 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-9 h-9 rounded-xl bg-brand-100 border border-brand-300 text-brand-800 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-editorial-text">
              Central de Customização & Configurações
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-editorial-muted mt-1">
            Personalize a identidade da loja, temas visuais, fontes, categorias de confecção, permissões de acesso e layouts da planilha.
          </p>
        </div>

        {/* Global Reset Button */}
        <button
          type="button"
          onClick={() => {
            if (confirm('Deseja restaurar todas as configurações e temas para os padrões originais de fábrica?')) {
              resetAllCustomizations();
              onShowToast('Todas as customizações foram restauradas.', 'info');
            }
          }}
          className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-xs font-medium flex items-center space-x-1.5 transition-colors self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Padrões</span>
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'store'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-editorial-muted hover:text-editorial-text hover:bg-stone-100 border border-brand-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Nome da Loja & Marca</span>
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'theme'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-editorial-muted hover:text-editorial-text hover:bg-stone-100 border border-brand-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Temas & Fontes</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'categories'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-editorial-muted hover:text-editorial-text hover:bg-stone-100 border border-brand-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Categorias ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'users'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-editorial-muted hover:text-editorial-text hover:bg-stone-100 border border-brand-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários & Permissões ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('layout')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'layout'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-editorial-muted hover:text-editorial-text hover:bg-stone-100 border border-brand-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Layout & Planilha</span>
        </button>
      </div>

      {/* TAB 1: IDENTIDADE DA LOJA & MARCA */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStoreSettings} className="bg-white rounded-2xl p-6 border border-brand-200 shadow-soft space-y-6">
          <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-bold text-editorial-text">
                Identidade da Empresa & Documentação
              </h2>
              <p className="text-xs text-editorial-muted">
                Estes dados serão exibidos no cabeçalho do sistema e impressos em todas as Ordens de Compra em PDF e Excel.
              </p>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Store Name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-editorial-text">
                Nome da Marca / Loja *
              </label>
              <input
                type="text"
                required
                value={storeForm.storeName}
                onChange={e => setStoreForm({ ...storeForm, storeName: e.target.value })}
                placeholder="Ex: ZNK Atelier"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-sm font-serif font-bold text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Tagline / Slogan */}
            <div className="space-y-1.5">
              <label className="font-semibold text-editorial-text">
                Slogan / Segmento
              </label>
              <input
                type="text"
                value={storeForm.tagline}
                onChange={e => setStoreForm({ ...storeForm, tagline: e.target.value })}
                placeholder="Ex: Moda Feminina & Confecção Premium"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* CNPJ */}
            <div className="space-y-1.5">
              <label className="font-semibold text-editorial-text">
                CNPJ da Empresa
              </label>
              <input
                type="text"
                value={storeForm.cnpj}
                onChange={e => setStoreForm({ ...storeForm, cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm font-mono text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Legal Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-editorial-text">
                Razão Social Completa
              </label>
              <input
                type="text"
                value={storeForm.legalName}
                onChange={e => setStoreForm({ ...storeForm, legalName: e.target.value })}
                placeholder="Ex: ZNK Comércio & Confecção de Roupas Femininas Ltda"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Email de Compras */}
            <div className="space-y-1.5">
              <label className="font-semibold text-editorial-text">
                Email de Compras / PCP
              </label>
              <input
                type="email"
                value={storeForm.email}
                onChange={e => setStoreForm({ ...storeForm, email: e.target.value })}
                placeholder="compras@sualoja.com.br"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Telefone / WhatsApp */}
            <div className="space-y-1.5">
              <label className="font-semibold text-editorial-text">
                WhatsApp / Telefone Comercial
              </label>
              <input
                type="text"
                value={storeForm.phone}
                onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Endereço */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-editorial-text">
                Endereço da Matriz / Showroom
              </label>
              <input
                type="text"
                value={storeForm.address}
                onChange={e => setStoreForm({ ...storeForm, address: e.target.value })}
                placeholder="Ex: Rua Oscar Freire, 1420 - Jardins"
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Cidade / UF */}
            <div className="space-y-1.5">
              <label className="font-semibold text-editorial-text">
                Cidade / UF
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={storeForm.city}
                  onChange={e => setStoreForm({ ...storeForm, city: e.target.value })}
                  placeholder="São Paulo"
                  className="col-span-2 px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <input
                  type="text"
                  maxLength={2}
                  value={storeForm.state}
                  onChange={e => setStoreForm({ ...storeForm, state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  className="px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 uppercase text-center"
                />
              </div>
            </div>

            {/* Nota de Rodapé em PDF */}
            <div className="space-y-1.5 sm:col-span-3">
              <label className="font-semibold text-editorial-text">
                Nota de Rodapé Padrão (Impressa nas Ordens de Compra)
              </label>
              <input
                type="text"
                value={storeForm.footerNote}
                onChange={e => setStoreForm({ ...storeForm, footerNote: e.target.value })}
                placeholder="Ex: Ordem de Compra oficial sujeita aos termos de tolerância de confecção..."
                className="w-full px-3 py-2 bg-editorial-light border border-brand-200 rounded-lg text-xs sm:text-sm text-editorial-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: TEMAS, FONTES & APARÊNCIA */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          {/* Theme Presets */}
          <div className="bg-white rounded-2xl p-6 border border-brand-200 shadow-soft space-y-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-editorial-text">
                Paletas & Temas de Moda Feminina
              </h2>
              <p className="text-xs text-editorial-muted">
                Selecione uma paleta estilizada para transformar imediatamente toda a interface do ERP.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {Object.values(THEME_PALETTES).map(palette => {
                const isSelected = themeSettings.preset === palette.id;
                return (
                  <div
                    key={palette.id}
                    onClick={() => {
                      updateThemeSettings({
                        preset: palette.id as ThemePreset,
                        accentColor: palette.primary,
                        isDarkMode: palette.id === 'dark_studio',
                      });
                      onShowToast(`Tema "${palette.name}" aplicado!`, 'success');
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 shadow-md ring-2 ring-brand-500/20'
                        : 'border-stone-200 hover:border-brand-300 bg-white hover:bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-serif font-bold text-xs sm:text-sm text-editorial-text">
                        {palette.name}
                      </h3>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-editorial-muted mb-3 min-h-[30px]">
                      {palette.description}
                    </p>

                    {/* Color Swatch Previews */}
                    <div className="flex items-center space-x-1.5 pt-2 border-t border-stone-100">
                      {palette.previewColors.map((hex, i) => (
                        <span
                          key={i}
                          className="w-6 h-6 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Typography & Fonts */}
          <div className="bg-white rounded-2xl p-6 border border-brand-200 shadow-soft space-y-5">
            <div>
              <h2 className="text-lg font-serif font-bold text-editorial-text">
                Tipografia & Fontes do Sistema
              </h2>
              <p className="text-xs text-editorial-muted">
                Escolha a família tipográfica para o corpo do texto e os títulos editoriais.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Body Font */}
              <div className="space-y-2">
                <label className="font-semibold text-editorial-text block">
                  Fonte Principal do Sistema (Textos & Planilhas)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {fontOptions.slice(0, 5).map(font => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => {
                        updateThemeSettings({ fontFamily: font });
                        onShowToast(`Fonte do sistema alterada para ${font}`, 'info');
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        themeSettings.fontFamily === font
                          ? 'border-brand-600 bg-brand-50 font-bold text-brand-900 ring-1 ring-brand-500'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                      style={{ fontFamily: `"${font}", sans-serif` }}
                    >
                      <div className="text-xs">{font}</div>
                      <div className="text-[10px] text-editorial-muted mt-0.5 font-normal">
                        Aa Bb Cc 123
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Heading Serif Font */}
              <div className="space-y-2">
                <label className="font-semibold text-editorial-text block">
                  Fonte Editorial de Títulos (Moda & Cabeçalhos)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {fontOptions.slice(4).map(font => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => {
                        updateThemeSettings({ headingFont: font });
                        onShowToast(`Fonte de títulos alterada para ${font}`, 'info');
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        themeSettings.headingFont === font
                          ? 'border-brand-600 bg-brand-50 font-bold text-brand-900 ring-1 ring-brand-500'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                      style={{ fontFamily: `"${font}", serif` }}
                    >
                      <div className="text-xs">{font}</div>
                      <div className="text-[10px] text-editorial-muted mt-0.5 font-normal">
                        Coleção Alto Verão
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIAS PERSONALIZADAS */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl p-6 border border-brand-200 shadow-soft space-y-6">
          <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-editorial-text">
                Categorias de Roupas & Confecção Feminina
              </h2>
              <p className="text-xs text-editorial-muted">
                Adicione novas linhas de produto da sua marca para seleção rápida na planilha de pedidos.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja restaurar a lista padrão de categorias de moda feminina?')) {
                    resetCategories();
                    onShowToast('Categorias padrão restauradas!', 'info');
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-medium"
              >
                Restaurar Padrão
              </button>

              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Categoria</span>
              </button>
            </div>
          </div>

          {/* Add Category Form Modal / Drawer */}
          {isAddingCategory && (
            <form onSubmit={handleAddCategory} className="p-4 bg-brand-50/70 rounded-xl border border-brand-300 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-900">
                Criar Nova Categoria de Confecção
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="Nome da categoria (ex: Lingerie & Sleepwear, Beachwear, Resort...)"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-brand-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <select
                    value={newCatColor}
                    onChange={e => setNewCatColor(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-brand-300 rounded-lg text-xs sm:text-sm cursor-pointer"
                  >
                    <option value="rose">Rosa / Terracota</option>
                    <option value="amber">Âmbar / Mostarda</option>
                    <option value="emerald">Verde Esmeralda</option>
                    <option value="blue">Azul Petróleo</option>
                    <option value="purple">Lavanda / Violeta</option>
                    <option value="stone">Neutro / Areia</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="p-3 bg-white rounded-xl border border-stone-200 hover:border-brand-300 shadow-2xs flex items-center justify-between group transition-all"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className={`w-2.5 h-2.5 rounded-full ${cat.badgeBg.replace('bg-', 'bg-')}-500 border`} />
                  <span className="font-semibold text-xs text-editorial-text truncate">
                    {cat.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (categories.length <= 1) {
                      onShowToast('O sistema precisa ter pelo menos 1 categoria ativa.', 'error');
                      return;
                    }
                    deleteCategory(cat.id);
                    onShowToast(`Categoria "${cat.name}" removida.`, 'info');
                  }}
                  className="p-1 text-stone-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                  title="Excluir categoria"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USUÁRIOS & PERMISSÕES (RBAC) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 border border-brand-200 shadow-soft space-y-6">
          <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-editorial-text">
                Gestão de Usuários & Controle de Permissões (RBAC)
              </h2>
              <p className="text-xs text-editorial-muted">
                Controle quais membros da equipe podem criar pedidos, alterar custos financeiros ou aprovar ordens de corte.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingUser(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Membro da Equipe</span>
            </button>
          </div>

          {/* Add User Modal / Form */}
          {isAddingUser && (
            <form onSubmit={handleAddUser} className="p-4 bg-brand-50/70 rounded-xl border border-brand-300 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-900">
                Cadastrar Novo Membro
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-editorial-text block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Beatriz Vasconcelos"
                    value={newUserForm.name}
                    onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-brand-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-editorial-text block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="beatriz@sualoja.com.br"
                    value={newUserForm.email}
                    onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-brand-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-editorial-text block mb-1">Cargo / Nível de Acesso</label>
                  <select
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-white border border-brand-300 rounded-lg text-xs"
                  >
                    <option value="admin">Administrador (Acesso Total)</option>
                    <option value="buyer_stylist">Estilista / Compradora</option>
                    <option value="production_manager">Gerente de Produção / PCP</option>
                    <option value="financial_auditor">Financeiro / Controladoria</option>
                    <option value="sales_assistant">Assistente / Consulta</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-editorial-text block mb-1">Título do Cargo</label>
                  <input
                    type="text"
                    placeholder="Ex: Estilista Sênior"
                    value={newUserForm.roleTitle}
                    onChange={e => setNewUserForm({ ...newUserForm, roleTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-brand-300 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          )}

          {/* Current Active User Banner */}
          <div className="p-4 bg-brand-50 rounded-xl border border-brand-300 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full ${currentUser.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow-xs`}>
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-editorial-text">{currentUser.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-200 text-brand-900 uppercase">
                    Usuário Ativo no Momento
                  </span>
                </div>
                <p className="text-xs text-editorial-muted">
                  {currentUser.email} • <strong className="text-brand-800">{currentUser.roleTitle}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-editorial-muted">Simular Sessão Como:</span>
              <select
                value={currentUser.id}
                onChange={e => {
                  const targetUser = users.find(u => u.id === e.target.value);
                  if (targetUser) {
                    setCurrentUser(targetUser);
                    onShowToast(`Sessão alternada para ${targetUser.name} (${targetUser.roleTitle})`, 'info');
                  }
                }}
                className="px-3 py-1.5 bg-white border border-brand-300 rounded-lg text-xs font-semibold text-brand-900 cursor-pointer shadow-2xs"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roleTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-semibold text-editorial-muted">
                  <th className="py-2.5 px-3">Membro</th>
                  <th className="py-2.5 px-3">Cargo / Função</th>
                  <th className="py-2.5 px-3">Perfil de Acesso</th>
                  <th className="py-2.5 px-3">Permissões Habilitadas</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map(u => {
                  const rolePerms = ROLE_DEFAULT_PERMISSIONS[u.role] || [];
                  const isCurrent = u.id === currentUser.id;

                  return (
                    <tr key={u.id} className="hover:bg-brand-50/20">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-7 h-7 rounded-full ${u.avatarBg} text-white font-bold flex items-center justify-center text-xs flex-shrink-0`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-editorial-text block">{u.name}</span>
                            <span className="text-[11px] text-editorial-muted">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-medium text-editorial-text">
                        {u.roleTitle}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-rose-100 text-rose-800'
                            : u.role === 'buyer_stylist'
                            ? 'bg-brand-100 text-brand-800'
                            : u.role === 'production_manager'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {rolePerms.slice(0, 3).map(p => (
                            <span key={p} className="text-[9px] px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded border border-stone-200">
                              {permissionLabels[p]}
                            </span>
                          ))}
                          {rolePerms.length > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
                              +{rolePerms.length - 3} mais
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (users.length <= 1) {
                              onShowToast('O sistema precisa ter pelo menos um usuário cadastrado.', 'error');
                              return;
                            }
                            deleteUser(u.id);
                            onShowToast(`Usuário ${u.name} removido.`, 'info');
                          }}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                          title="Remover usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: LAYOUT & PLANILHA */}
      {activeTab === 'layout' && (
        <div className="bg-white rounded-2xl p-6 border border-brand-200 shadow-soft space-y-6">
          <div>
            <h2 className="text-lg font-serif font-bold text-editorial-text">
              Customização da Planilha & Grid de Pedidos
            </h2>
            <p className="text-xs text-editorial-muted">
              Ajuste quais colunas são exibidas na grade dinâmica e o modo de visualização padrão do painel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* View Mode Default */}
            <div className="p-4 rounded-xl border border-stone-200 space-y-2">
              <span className="font-bold text-editorial-text block">
                Visualização Padrão Inicial
              </span>
              <p className="text-editorial-muted text-[11px]">
                Defina como os pedidos serão organizados ao abrir o painel principal.
              </p>
              <div className="flex gap-2 pt-2">
                {(['table', 'grouped', 'kanban'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      updateLayoutSettings({ defaultViewMode: mode });
                      onShowToast(`Visualização padrão alterada para ${mode}`, 'info');
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-all ${
                      layoutSettings.defaultViewMode === mode
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {mode === 'table' ? 'Tabela' : mode === 'grouped' ? 'Agrupado' : 'Kanban'}
                  </button>
                ))}
              </div>
            </div>

            {/* Hide Financial Values Mode (Showroom / Confidential mode) */}
            <div className="p-4 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-editorial-text block flex items-center space-x-1.5">
                  {layoutSettings.hideFinancialValues ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4 text-brand-600" />}
                  <span>Modo Showroom / Sigilo de Valores</span>
                </span>
                <p className="text-editorial-muted text-[11px] mt-0.5">
                  Oculta valores de custo e totais financeiros em R$ para reuniões públicas.
                </p>
              </div>
              <input
                type="checkbox"
                checked={layoutSettings.hideFinancialValues}
                onChange={e => {
                  updateLayoutSettings({ hideFinancialValues: e.target.checked });
                  onShowToast(
                    e.target.checked ? 'Modo Sigilo Ativado (Valores em R$ ocultos)' : 'Modo Sigilo Desativado',
                    'info'
                  );
                }}
                className="w-5 h-5 accent-brand-600 cursor-pointer"
              />
            </div>

            {/* Show Category Badges */}
            <div className="p-4 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-editorial-text block">
                  Exibir Badges Coloridos de Categoria
                </span>
                <p className="text-editorial-muted text-[11px] mt-0.5">
                  Destaca visualmente vestidos, alfaiataria, tricot, jeans, etc.
                </p>
              </div>
              <input
                type="checkbox"
                checked={layoutSettings.showCategoryPill}
                onChange={e => updateLayoutSettings({ showCategoryPill: e.target.checked })}
                className="w-5 h-5 accent-brand-600 cursor-pointer"
              />
            </div>

            {/* Show Color Swatch Selector */}
            <div className="p-4 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-editorial-text block">
                  Seletor de Amostra de Cor na Linha
                </span>
                <p className="text-editorial-muted text-[11px] mt-0.5">
                  Apresenta o círculo de cor visual ao lado do nome da variante.
                </p>
              </div>
              <input
                type="checkbox"
                checked={layoutSettings.showColorHexSwatch}
                onChange={e => updateLayoutSettings({ showColorHexSwatch: e.target.checked })}
                className="w-5 h-5 accent-brand-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
