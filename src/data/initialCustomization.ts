import { 
  StoreSettings, 
  ThemeSettings, 
  CategoryItem, 
  SystemUser, 
  UserRole, 
  PermissionKey, 
  LayoutSettings 
} from '../types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'ZNK Packing',
  tagline: 'Gestão de Pedidos de Compra & Confecção Feminina',
  legalName: 'ZNK Packing Comércio & Confecção de Roupas Femininas Ltda',
  cnpj: '42.190.876/0001-33',
  email: 'compras@znkpacking.com.br',
  phone: '11976543210',
  address: 'Rua Oscar Freire, 1420 - Jardins',
  city: 'São Paulo',
  state: 'SP',
  currencySymbol: 'R$',
  footerNote: 'Ordem de Compra oficial ZNK Packing - Sujeita aos termos e controle de qualidade.',
  logoIcon: 'Package',
};

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  themeMode: 'system',
};

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Vestidos', badgeBg: 'bg-rose-50 dark:bg-rose-950/40', badgeText: 'text-rose-800 dark:text-rose-300', badgeBorder: 'border-rose-200 dark:border-rose-800/40' },
  { id: 'cat-2', name: 'Blusas', badgeBg: 'bg-amber-50 dark:bg-amber-950/40', badgeText: 'text-amber-800 dark:text-amber-300', badgeBorder: 'border-amber-200 dark:border-amber-800/40' },
  { id: 'cat-3', name: 'Calças', badgeBg: 'bg-stone-100 dark:bg-stone-800/40', badgeText: 'text-stone-800 dark:text-stone-300', badgeBorder: 'border-stone-200 dark:border-stone-700/40' },
  { id: 'cat-4', name: 'Alfaiataria', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40', badgeText: 'text-emerald-800 dark:text-emerald-300', badgeBorder: 'border-emerald-200 dark:border-emerald-800/40' },
  { id: 'cat-5', name: 'Saias', badgeBg: 'bg-purple-50 dark:bg-purple-950/40', badgeText: 'text-purple-800 dark:text-purple-300', badgeBorder: 'border-purple-200 dark:border-purple-800/40' },
  { id: 'cat-6', name: 'Casacos & Blazers', badgeBg: 'bg-blue-50 dark:bg-blue-950/40', badgeText: 'text-blue-800 dark:text-blue-300', badgeBorder: 'border-blue-200 dark:border-blue-800/40' },
  { id: 'cat-7', name: 'Conjuntos', badgeBg: 'bg-orange-50 dark:bg-orange-950/40', badgeText: 'text-orange-800 dark:text-orange-300', badgeBorder: 'border-orange-200 dark:border-orange-800/40' },
  { id: 'cat-8', name: 'Lingerie & Noite', badgeBg: 'bg-pink-50 dark:bg-pink-950/40', badgeText: 'text-pink-800 dark:text-pink-300', badgeBorder: 'border-pink-200 dark:border-pink-800/40' },
  { id: 'cat-9', name: 'Beachwear', badgeBg: 'bg-teal-50 dark:bg-teal-950/40', badgeText: 'text-teal-800 dark:text-teal-300', badgeBorder: 'border-teal-200 dark:border-teal-800/40' },
  { id: 'cat-10', name: 'Tricot', badgeBg: 'bg-yellow-50 dark:bg-yellow-950/40', badgeText: 'text-yellow-800 dark:text-yellow-300', badgeBorder: 'border-yellow-200 dark:border-yellow-800/40' },
];

export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  defaultViewMode: 'table',
  showSuggestedPrice: true,
  showCategoryPill: true,
  showColorHexSwatch: true,
  compactSidebar: false,
  hideFinancialValues: false,
};

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  admin: [
    'orders_create', 'orders_edit', 'orders_delete', 'orders_approve', 'orders_view_costs',
    'suppliers_manage', 'categories_manage', 'settings_manage', 'export_reports'
  ],
  buyer_stylist: [
    'orders_create', 'orders_edit', 'orders_view_costs',
    'suppliers_manage', 'categories_manage', 'export_reports'
  ],
  production_manager: [
    'orders_edit', 'orders_approve',
    'suppliers_manage', 'export_reports'
  ],
  financial_auditor: [
    'orders_view_costs', 'export_reports'
  ],
  sales_assistant: [
    'export_reports'
  ],
};

export const DEFAULT_USERS: SystemUser[] = [
  {
    id: 'usr-1',
    name: 'Helena Zink',
    email: 'admin@znkpacking.com.br',
    password: 'admin',
    role: 'admin',
    roleTitle: 'Diretora & Administradora Geral',
    avatarBg: 'bg-brand-600',
    themePreference: 'system',
    customPermissions: ROLE_DEFAULT_PERMISSIONS.admin,
  },
  {
    id: 'usr-2',
    name: 'Camila Duarte',
    email: 'camila.duarte@znkpacking.com.br',
    password: 'compras123',
    role: 'buyer_stylist',
    roleTitle: 'Estilista & Compradora Sênior',
    avatarBg: 'bg-rose-500',
    themePreference: 'light',
    customPermissions: ROLE_DEFAULT_PERMISSIONS.buyer_stylist,
  },
  {
    id: 'usr-3',
    name: 'Rodrigo Mendes',
    email: 'rodrigo.pcp@znkpacking.com.br',
    password: 'pcp123',
    role: 'production_manager',
    roleTitle: 'Gerente de Produção & PCP',
    avatarBg: 'bg-blue-600',
    themePreference: 'dark',
    customPermissions: ROLE_DEFAULT_PERMISSIONS.production_manager,
  },
  {
    id: 'usr-4',
    name: 'Mariana Rocha',
    email: 'financeiro@znkpacking.com.br',
    password: 'fin123',
    role: 'financial_auditor',
    roleTitle: 'Controladoria & Custos',
    avatarBg: 'bg-emerald-600',
    themePreference: 'light',
    customPermissions: ROLE_DEFAULT_PERMISSIONS.financial_auditor,
  },
  {
    id: 'usr-5',
    name: 'Beatriz Lima',
    email: 'assistente@znkpacking.com.br',
    password: 'assist123',
    role: 'sales_assistant',
    roleTitle: 'Assistente de Estoque',
    avatarBg: 'bg-purple-600',
    themePreference: 'system',
    customPermissions: ROLE_DEFAULT_PERMISSIONS.sales_assistant,
  },
];
