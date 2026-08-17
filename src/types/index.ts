export type ProductCategory = string;

export interface CategoryItem {
  id: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconName?: string;
}

export type SizeOption = 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XG' | '34' | '36' | '38' | '40' | '42' | '44' | '46' | 'Único';

export type SizeGridType = 'letter' | 'numeric' | 'custom';

export type OrderStatus =
  | 'draft'        // Rascunho
  | 'pending'      // Pendente / Enviado ao Fornecedor
  | 'approved'     // Aprovado / Em Produção
  | 'in_transit'   // Em Trânsito / Despachado
  | 'delivered'    // Entregue / Faturado
  | 'cancelled';   // Cancelado

export type DeadlineStatus =
  | 'on_track'     // No prazo (Verde)
  | 'due_soon'     // Próximo do prazo <= 4 dias (Amarelo)
  | 'delayed'      // Atrasado (Vermelho)
  | 'completed'    // Entregue
  | 'cancelled';   // Cancelado

export interface Supplier {
  id: string;
  name: string; // Razão Social
  tradeName: string; // Nome Fantasia
  cnpj: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  defaultPaymentTerms: string;
  categorySpecialty: string;
  averageLeadDays: number;
  rating: number; // 1-5
}

export interface SizeBreakdown {
  [size: string]: number;
}

export interface OrderItem {
  id: string;
  sku: string;               // Ref / Código da Peça
  description: string;       // Nome do modelo (ex: Vestido Linho Botões)
  category: ProductCategory; // Categoria
  sizeGridType: SizeGridType;
  sizeBreakdown?: SizeBreakdown;
  size: string;              // Grade ou tamanho (ex: "P" ou "Grade P/M/G")
  color: string;             // Cor / Variante (ex: "Terracota")
  colorHex?: string;         // Código hex da cor para visualização
  quantity: number;          // Quantidade total da linha
  unitCost: number;          // Custo unitário (R$)
  suggestedPrice?: number;   // Preço de venda sugerido (R$)
  subtotal: number;          // Calculado: quantity * unitCost
  notes?: string;            // Observações técnicas (tecido, aviamento)
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;          // ex: "PED-2026-0042"
  supplierId: string;
  supplierName: string;
  supplierTradeName: string;
  supplierCnpj: string;
  supplierContact: string;
  supplierPhone: string;
  supplierEmail: string;
  issueDate: string;            // YYYY-MM-DD
  expectedDeliveryDate: string; // YYYY-MM-DD
  actualDeliveryDate?: string;
  paymentTerms: string;         // ex: "30/60 dias", "À vista", etc.
  status: OrderStatus;
  collection: string;           // ex: "Alto Verão 2026", "Cápsula Alfaiataria"
  items: OrderItem[];
  shippingCarrier?: string;     // Transportadora
  shippingCost?: number;        // Frete (R$)
  discount?: number;            // Desconto (R$)
  totalPieces: number;          // Volume total de peças
  totalAmount: number;          // Valor total líquido do pedido
  notes: string;                // Observações gerais do pedido
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilterState {
  search: string;
  supplierId: string;
  status: string;
  periodMonth: string; // "YYYY-MM" or "all"
  deadlineToFilter: 'all' | 'delayed' | 'due_soon' | 'on_track';
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'delivery_asc';
}

export interface FinancialSummary {
  totalOrders: number;
  totalPieces: number;
  totalOpenAmount: number;    // Pedidos pendentes + em trânsito + aprovados
  totalDeliveredAmount: number; // Pedidos já faturados / entregues
  totalCancelledAmount: number;
  delayedCount: number;
  dueSoonCount: number;
  onTrackCount: number;
}

// ----------------------------------------------------
// CUSTOMIZATION & ACCESS CONTROL (RBAC) TYPES
// ----------------------------------------------------

export interface StoreSettings {
  storeName: string;           // Nome da Loja (ex: "ZNK Atelier")
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
  logoIcon: string;            // Icon id (e.g. "Store", "Crown", "Sparkles", "Shirt", "Gem")
}

export type ThemePreset =
  | 'terracotta_champagne' // Default Atelier
  | 'rose_nude'            // Boutique Romântica
  | 'emerald_slate'        // Alfaiataria & Luxo
  | 'noir_minimalist'      // Haute Couture Monocromática
  | 'lavender_silk'        // Doce Seda & Delicado
  | 'dark_studio'          // Modo Noturno Luxuoso
  | 'bordeaux_velvet';     // Vinho & Terroso Profundo

export type FontFamilyOption =
  | 'Plus Jakarta Sans'
  | 'Inter'
  | 'Outfit'
  | 'Montserrat'
  | 'Manrope'
  | 'Playfair Display'
  | 'Cormorant Garamond'
  | 'Cinzel';

export type TableDensity = 'compact' | 'standard' | 'comfortable';

export type BorderRadiusStyle = 'sharp' | 'subtle' | 'rounded' | 'pill';

export interface ThemeSettings {
  preset: ThemePreset;
  fontFamily: FontFamilyOption;
  headingFont: FontFamilyOption;
  tableDensity: TableDensity;
  borderRadius: BorderRadiusStyle;
  isDarkMode: boolean;
  accentColor: string; // Hex for custom overrides
}

export type PermissionKey =
  | 'orders_create'        // Criar novos pedidos
  | 'orders_edit'          // Editar pedidos existentes
  | 'orders_delete'        // Excluir pedidos
  | 'orders_approve'       // Mudar status para Aprovado / Produção
  | 'orders_view_costs'    // Ver valores financeiros e custos (R$)
  | 'suppliers_manage'     // Cadastrar/editar fornecedores
  | 'categories_manage'    // Customizar categorias de produtos
  | 'settings_manage'      // Alterar temas, fontes, usuários e loja
  | 'export_reports';      // Exportar PDF e Excel

export type UserRole =
  | 'admin'               // Administrador Geral (Acesso Total)
  | 'buyer_stylist'       // Comprador / Estilista (Criação e Edição de Pedidos)
  | 'production_manager'  // Gerente de Produção / PCP (Status, Prazos e Logística)
  | 'financial_auditor'   // Financeiro (Custos, Faturamento e Relatórios)
  | 'sales_assistant';    // Assistente / Visualizador

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  avatarBg: string;
  role: UserRole;
  roleTitle: string;
  customPermissions?: PermissionKey[];
}

export interface LayoutSettings {
  defaultViewMode: 'table' | 'grouped' | 'kanban';
  showSuggestedPrice: boolean;
  showCategoryPill: boolean;
  showColorHexSwatch: boolean;
  compactSidebar: boolean;
  hideFinancialValues: boolean; // Modo sigilo para reuniões
}
