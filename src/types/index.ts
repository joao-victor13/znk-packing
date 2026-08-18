// Type definitions for ZNK Packing Fashion Purchasing & Supplier Management

export type OrderStatus = 'draft' | 'pending' | 'approved' | 'in_transit' | 'delivered' | 'cancelled';

export type SizeCategory = 'numeric' | 'letter' | 'unique';

export type ProductCategory =
  | 'Vestidos'
  | 'Blusas'
  | 'Calças'
  | 'Alfaiataria'
  | 'Saias'
  | 'Casacos & Blazers'
  | 'Conjuntos'
  | 'Lingerie & Noite'
  | 'Beachwear'
  | 'Tricot'
  | string;

export interface OrderItem {
  id: string;
  sku: string; // Ex: "VEST-2401"
  description: string;
  category: ProductCategory;
  sizeGridType: SizeCategory;
  size: string; // Ex: "P", "M", "G", "38", "40", "Único"
  color: string; // Ex: "Off-White", "Terracota"
  colorHex?: string; // Ex: "#FAF8F5", "#B07D4F"
  quantity: number;
  unitCost: number; // In BRL (R$)
  suggestedPrice?: number; // Retail price (Margem/Markup)
  subtotal: number; // quantity * unitCost
  notes?: string;
}

export interface Supplier {
  id: string;
  name?: string;
  tradeName: string; // Nome Fantasia
  corporateName?: string; // Razão Social
  cnpj: string;
  contactName: string;
  phone: string;
  email: string;
  category?: string; // Ex: "Alfaiataria", "Tricot", "Malharia"
  categorySpecialty?: string;
  averageLeadDays?: number; // Prazo médio de entrega
  paymentTerms?: string; // Ex: "30/60 DDL", "50% Entrada + 50% Entrega"
  defaultPaymentTerms?: string;
  rating?: number; // 1 to 5 stars
  city?: string;
  state?: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string; // Ex: "PED-2026-0042"
  supplierId: string;
  supplierName: string;
  supplierTradeName?: string;
  supplierCnpj?: string;
  supplierContact?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  
  status: OrderStatus;
  collection: string; // Ex: "Alto Verão 2026", "Cápsula Linho"
  issueDate: string; // YYYY-MM-DD
  expectedDeliveryDate: string; // YYYY-MM-DD
  actualDeliveryDate?: string;
  
  paymentTerms: string;
  shippingCarrier?: string;
  shippingCost?: number;
  discount?: number;

  items: OrderItem[];
  
  // Computed values
  totalPieces: number;
  totalAmount: number; // Subtotal + shipping - discount
  
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeadlineStatus = 'on_track' | 'due_soon' | 'delayed' | 'delivered' | 'completed' | 'cancelled';

export interface FinancialSummary {
  totalOrders: number;
  totalPieces: number;
  totalOpenAmount: number;
  totalDeliveredAmount: number;
  totalCancelledAmount: number;
  delayedCount: number;
  dueSoonCount: number;
  onTrackCount: number;
  approachingCount?: number;
  onTimeCount?: number;
  deliveredCount?: number;
}

export interface OrderFilterState {
  search: string;
  supplierId: string;
  status: OrderStatus | 'all';
  periodMonth: string; // "all" or "YYYY-MM"
  deadlineToFilter: 'all' | 'delayed' | 'due_soon' | 'on_track' | 'completed';
  sortBy: 'date_asc' | 'date_desc' | 'amount_asc' | 'amount_desc' | 'pieces_desc';
}

export interface DashboardSummary {
  totalOrders: number;
  totalPieces: number;
  openAmount: number;
  billedAmount: number;
  totalAmountAll: number;
  delayedCount: number;
  approachingCount: number;
  onTimeCount: number;
  deliveredCount: number;
}

// -----------------------------------------------------------------------------
// USER CUSTOMIZATION & THEME MODES
// -----------------------------------------------------------------------------

export interface StoreSettings {
  storeName: string;           // Nome da Loja (ex: "ZNK Packing")
  tagline: string;             // Slogan (ex: "Moda Feminina & Alta Confecção")
  legalName: string;           // Razão Social
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  currencySymbol: string;      // "R$"
  footerNote: string;          // Mensagem de rodapé nas Ordens de Compra
  logoIcon: string;            // Icon id
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeSettings {
  themeMode: ThemeMode;
}

export type PermissionKey =
  | 'orders_create'        // Criar novos pedidos
  | 'orders_edit'          // Editar pedidos existentes
  | 'orders_delete'        // Excluir pedidos
  | 'orders_approve'       // Mudar status para Aprovado / Produção
  | 'orders_view_costs'    // Ver valores financeiros e custos (R$)
  | 'suppliers_manage'     // Cadastrar/editar fornecedores
  | 'categories_manage'    // Customizar categorias de produtos
  | 'settings_manage'      // Alterar configurações e loja
  | 'export_reports';      // Exportar PDF e Excel

export type UserRole =
  | 'admin'               // Administrador Geral (Acesso Total)
  | 'seller'              // Vendedor (a)
  | 'stockist';           // Estoquista

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarBg: string;
  role: UserRole;
  roleTitle?: string;
  themePreference?: ThemeMode;
  customPermissions?: PermissionKey[];
}

export interface CategoryItem {
  id: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export interface LayoutSettings {
  defaultViewMode: 'table' | 'grouped' | 'kanban';
  showSuggestedPrice: boolean;
  showCategoryPill: boolean;
  showColorHexSwatch: boolean;
  compactSidebar: boolean;
  hideFinancialValues: boolean;
}
