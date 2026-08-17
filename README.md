# ZNK Atelier — Sistema de Gestão de Pedidos de Compra & Confecção Feminina

Sistema web moderno, elegante e de alta performance desenvolvido para lojas e marcas de **Moda Feminina** gerenciarem seus **Pedidos de Compra (Ordens de Compra / P.O.) com Fornecedores e Oficinas de Confecção**.

O sistema conta com um **Data Grid dinâmico estilo planilha (Excel/Google Sheets)** com inputs inline diretos, cálculo em tempo real de subtotais e totais, controle inteligente de prazos de entrega (com alertas visuais Verde, Amarelo e Vermelho), gerenciamento de fornecedores, exportação em **PDF (Ordem de Compra formal para confecção)**, **Excel (.xlsx)** e integração direta com **WhatsApp**.

---

## 📸 Principais Funcionalidades

### 1. Painel de Controle (Dashboard & Listagem com Múltiplas Visões)
- **KPIs Financeiros & Operacionais:**
  - **Volume de Peças:** Contagem total de peças em produção e faturadas.
  - **Valor em Aberto:** Total em R$ em produção / a faturar.
  - **Total Faturado / Entregue:** Total em R$ de pedidos recebidos no estoque.
  - **Controle de Prazos Inteligente:** Filtro com um clique para pedidos **Atrasados**, **Próximos da Entrega** ou **No Prazo**.
- **Múltiplas Formas de Visualização:**
  - **Modo Tabela Detalhada:** Tabela com gaveta expansível para visualização instantânea das referências e grades de cada pedido sem abrir o editor.
  - **Modo Agrupado por Fornecedor:** Agrupa pedidos por oficina têxtil / parceiro com subtotais consolidados.
  - **Modo Kanban:** Acompanhamento visual por etapas (1. Pendente ➔ 2. Em Produção ➔ 3. Em Trânsito ➔ 4. Entregue/Faturado).
- **Filtros Avançados:** Busca textual instantânea por nº pedido, SKU, descrição ou fornecedor; filtro por fornecedor, status e mês/período.

### 2. Criação Dinâmica de Pedidos (Spreadsheet Data Grid)
- **Edição Inline Direta:** Sem modais lentos ou formulários aninhados; preenchimento rápido célula a célula.
- **Navegação Fluida por Teclado:**
  - `Enter` na última célula cria automaticamente uma nova linha na planilha.
  - `Tab` navega para a próxima célula.
- **Campos por Linha de Produto:**
  - Código / Referência (SKU) com autocompletar e sugestões do catálogo de moda.
  - Descrição do Modelo.
  - Categoria (Vestidos, Blusas, Calças, Alfaiataria, Saias, Blazers, Conjuntos, Jeans, Tricot, Bodies, Camisas).
  - Grade de Tamanhos (P, M, G, GG, 36 ao 44, Único).
  - Cor / Variante com seletor pop-up de paleta de cores de moda boutique (Terracota, Off-White, Marsala, Nude Rosé, etc.).
  - Quantidade Unitária (atualização instantânea de subtotal e volume).
  - Custo Unitário (R$).
  - Subtotal Calculado (`Quantidade × Custo Unitário`).
- **Ações Rápidas:**
  - Duplicar linha anterior (`Alt+D` / botão).
  - Inserir **Grade Completa P/M/G/GG** com 1 clique.
  - Sugestão de modelos pré-configurados do catálogo.
  - Excluir linha.
- **Resumo Financeiro em Tempo Real:**
  - Cálculo de subtotal dos produtos, acréscimo de frete, desconto/bonificação e valor total líquido.
  - Custo médio por peça e verificação de lead time do fornecedor.

### 3. Cabeçalho do Pedido & Cadastro de Fornecedores
- Seleção de Fornecedor com preenchimento automático de CNPJ, Contato, WhatsApp e prazo médio de confecção.
- Cadastro rápido de novas oficinas têxteis.
- Condições de Pagamento configuráveis (30/60 dias, 30/60/90, À vista com desconto, 50% Sinal + 50% Despacho, etc.).
- Previsão de Entrega com badge dinâmico do status do prazo.
- Coleção / Cápsula, Transportadora e Observações técnicas de confecção.

### 4. Exportação & Relatórios
### 5. Central de Customização & Configurações (Novidade ✨)
- **Nome da Loja & Identidade Visual:** Customização em tempo real do Nome da Loja, Slogan, Razão Social, CNPJ, Email, WhatsApp e Endereço, com atualização imediata no cabeçalho do ERP e nas Ordens de Compra geradas em PDF e Excel.
- **Temas de Moda Feminina & Dark Mode:**
  - *Terracotta & Champagne* (Atelier Clássico)
  - *Rose Gold & Nude* (Boutique Romântica)
  - *Emerald & Tailoring Slate* (Alfaiataria Nobre)
  - *Noir & Alabaster Minimalist* (Haute Couture Monocromática)
  - *Lavender Silk & Pearl* (Doce Seda & Delicado)
  - *Bordeaux & Velvet Wine* (Vinho Terroso Profundo)
  - *Dark Studio* (Modo Noturno Luxo)
- **Tipografia & Fontes Customizáveis:** Seleção dinâmica de fontes para textos e títulos editoriais (*Plus Jakarta Sans*, *Inter*, *Outfit*, *Montserrat*, *Manrope*, *Playfair Display*, *Cormorant Garamond*, *Cinzel*).
- **Gestão de Categorias Personalizadas:** CRUD completo de categorias de moda feminina (ex: Vestidos, Lingerie, Beachwear, Alfaiataria, Tricot, Jeans) com badges coloridos personalizados.
- **Gestão de Usuários & Permissões (RBAC):** Controle granular de acesso por cargos (Administrador, Estilista/Comprador, Gerente de PCP/Produção, Financeiro, Assistente), com simulador de sessão ativo com 1 clique.
- **Customização de Layout da Planilha:** Alternância de densidade de tabela, exibição de amostras de cor em hex, modo showroom/sigilo de valores monetários.

---

## 🛠️ Stack Tecnológica

- **Framework:** React 18 + Vite 6 + TypeScript 5
- **Estilização:** Tailwind CSS 3 (Paleta editorial neutra e elegante: Champagne, Linho, Terracota, Ardósia)
- **Ícones:** Lucide React
- **Exportação PDF:** jsPDF + jspdf-autotable
- **Exportação Excel:** SheetJS (xlsx)
- **Persistência:** LocalStorage com dataset de demonstração pré-carregado

---

## 📋 Estrutura do Modelo de Dados (TypeScript Schema)

```typescript
export type ProductCategory =
  | 'Vestidos'
  | 'Blusas'
  | 'Calças'
  | 'Alfaiataria'
  | 'Saias'
  | 'Casacos & Blazers'
  | 'Conjuntos'
  | 'Jeans'
  | 'Macacões'
  | 'Tricot'
  | 'Bodies'
  | 'Camisas';

export type OrderStatus =
  | 'draft'        // Rascunho
  | 'pending'      // Pendente / Enviado
  | 'approved'     // Aprovado / Em Produção
  | 'in_transit'   // Em Trânsito / Despachado
  | 'delivered'    // Entregue / Faturado
  | 'cancelled';   // Cancelado

export interface Supplier {
  id: string;
  name: string;              // Razão Social
  tradeName: string;         // Nome Fantasia
  cnpj: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  defaultPaymentTerms: string;
  categorySpecialty: string;
  averageLeadDays: number;
  rating: number;
}

export interface OrderItem {
  id: string;
  sku: string;               // Código/Ref da peça
  description: string;       // Nome do modelo
  category: ProductCategory; // Categoria
  sizeGridType: 'letter' | 'numeric' | 'custom';
  size: string;              // Grade ou tamanho (ex: "Grade P/M/G")
  color: string;             // Cor/Variante (ex: "Terracota")
  colorHex?: string;         // Cor visual em hexadecimal
  quantity: number;          // Quantidade
  unitCost: number;          // Custo unitário em R$
  suggestedPrice?: number;   // Preço de venda sugerido
  subtotal: number;          // quantity * unitCost
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;          // Ex: "PED-2026-0042"
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
  paymentTerms: string;
  status: OrderStatus;
  collection: string;           // Ex: "Alto Verão 2026"
  items: OrderItem[];
  shippingCarrier?: string;     // Transportadora
  shippingCost?: number;        // Frete R$
  discount?: number;            // Desconto R$
  totalPieces: number;          // Volume total de peças
  totalAmount: number;          // Valor líquido do pedido
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## ⚡ Regras de Cálculo & Validação de Prazos

### 1. Cálculo de Subtotal e Totais
$$\text{Subtotal da Linha} = \text{Quantidade} \times \text{Custo Unitário}$$
$$\text{Volume Total de Peças} = \sum \text{Quantidade}_i$$
$$\text{Subtotal dos Produtos} = \sum \text{Subtotal}_i$$
$$\text{Valor Total Líquido} = \text{Subtotal dos Produtos} + \text{Frete} - \text{Desconto}$$

### 2. Validação de Prazos de Entrega (Alerta Visual)
- **Dias Restantes:** $\Delta = \text{Data de Previsão} - \text{Data Atual}$
- **Se $\text{Status} = \text{Entregue}$:** Badge Verde "Entregue / Faturado".
- **Se $\Delta < 0$ e não entregue:** 🔴 **Atrasado** (Badge Vermelho piscante com contagem de dias em atraso).
- **Se $0 \le \Delta \le 4$ dias:** 🟡 **Entrega Próxima** (Badge Amarelo alertando prazo iminente).
- **Se $\Delta > 4$ dias:** 🟢 **No Prazo** (Badge Verde com dias restantes).

---

## 🚀 Como Executar o Projeto

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Gerar build de produção
npm run build
```
O servidor iniciará em `http://localhost:3000`.
