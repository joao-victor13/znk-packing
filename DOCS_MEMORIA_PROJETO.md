# 📜 ZNK PACKING — Memória do Projeto & Histórico de Desenvolvimento

> **Data de Atualização:** 17 de Agosto de 2026  
> **Status da Aplicação:** Produção / Estável  
> **Repositório:** `joao-victor13/znk-packing`  

---

## 1. 💎 Visão Geral do Sistema

O **ZNK Packing** é um ERP e sistema de gestão de compras, confecção e relacionamento com fornecedores (*Purchasing & Supplier Management*), projetado com estética editorial de alta costura e máxima performance operacional.

### 🛠️ Stack Tecnológica:
* **Frontend:** React 18, TypeScript, Vite 6, Tailwind CSS (com suporte nativo a `darkMode: 'class'`), Lucide React.
* **Backend & Banco de Dados:** PostgreSQL hospedado no **Supabase**, Prisma ORM 7 (`@prisma/client` + `prisma.config.ts`) e SDK cliente em tempo real `@supabase/supabase-js`.
* **Exportações:** Geração de Ordens de Compra oficiais em **PDF** (`jspdf`, `jspdf-autotable`) e planilhas **Excel** (`xlsx`).
* **Hospedagem & Deploy Contínuo:** Netlify integrado ao Git via push na branch `main`.

---

## 2. 📑 Histórico Completo de Alterações e Decisões

### 2.1. Configuração do Prisma 7 & Conexão PostgreSQL Supabase
* **Problema Original:** O Prisma 7 removeu o suporte à propriedade `url` dentro do arquivo `schema.prisma` (Erro P1012).
* **Solução Implementada:**
  * Criação do [`prisma.config.ts`](./prisma.config.ts) para gerenciar a URL de conexão para migrações.
  * Estruturação do arquivo [`.env`](./.env) com as credenciais diretas do pooler/PostgreSQL do Supabase.
  * Criação dos scripts SQL [`supabase_init.sql`](./supabase_init.sql) e [`supabase_seed_data.sql`](./supabase_seed_data.sql) para inicialização direta no SQL Editor do Supabase.

### 2.2. Correção de Builds na Netlify & Secret Scanner
* **Problema:** A Netlify falhava o build com `exit code 127` (ferramentas como Vite/TypeScript eram ignoradas com `NODE_ENV=production`) e o escâner de segredos bloqueava chaves de exemplo no `.env.production.example`.
* **Solução Implementada:**
  * Dependências de compilação movidas para `dependencies` no [`package.json`](./package.json).
  * Atualizado o [`netlify.toml`](./netlify.toml) com `NPM_FLAGS = "--include=dev"` e flags de build sanitizadas.
  * Sanitização de valores no [`.env.production.example`](./.env.production.example).

### 2.3. Identidade Visual da Marca "ZNK Packing"
* **Logo & Favicon:** Criação do monograma exclusivo de alta costura com a letra **"Z"** em relevo e detalhes dourados/âmbar em vetor SVG ([`public/favicon.svg`](./public/favicon.svg) e [`public/vite.svg`](./public/vite.svg)).
* **Padronização:** Atualização do título da página, cabeçalhos, rodapés de impressão e documentos PDF/Excel para o nome comercial **ZNK Packing**.

### 2.4. Redesign das Interfaces & Redução da Carga de Texto nos Cards
* **Dashboard de KPIs ([`src/components/DashboardStats.tsx`](./src/components/DashboardStats.tsx)):**
  * Eliminação de parágrafos longos, substituídos por métricas compactas de alto impacto e botões rápidos de filtro de prazos (*Atrasados*, *Próximos 7d*, *No Prazo*, *Entregues*).
* **Kanban de Produção ([`src/components/OrderKanbanView.tsx`](./src/components/OrderKanbanView.tsx)):**
  * Cards compactos com dados essenciais (Nº do Pedido, Fornecedor, Coleção, Peças e Valor) e botões de avanço de etapa.
* **Diretório de Fornecedores ([`src/components/SuppliersView.tsx`](./src/components/SuppliersView.tsx)):**
  * Tags compactas de especialidade, prazo médio em dias e atalho direto para o WhatsApp.
* **Tabela & Planilha de Pedidos ([`src/components/OrderListView.tsx`](./src/components/OrderListView.tsx)):**
  * Visual de alta densidade e gaveta expansível para conferência de tamanhos e cores sem poluição visual.

### 2.5. Sistema de Temas Simplificado (Claro / Escuro / Sistema)
* **3 Modos Puros:**
  1. ☀️ **Modo Claro (Light):** Estética editorial com marfim/linho e alto contraste.
  2. 🌙 **Modo Escuro (Dark):** Fundo grafite profundo (`#121215`) com cards escuros (`#1A1A22`) e toques dourados.
  3. 🖥️ **Sistema (Automático):** Sincronização em tempo real com as preferências do SO via `window.matchMedia('(prefers-color-scheme: dark)')`.
* **Personalização Individual:** O tema é salvo no perfil de cada usuário logado e alternado com 1 clique no topo da tela ([`Navbar.tsx`](./src/components/Navbar.tsx)).

### 2.6. Sincronização em Tempo Real com Supabase PostgreSQL
* **Cliente Supabase ([`src/services/supabaseClient.ts`](./src/services/supabaseClient.ts)):**
  * Sincronização bidirecional de pedidos (`purchase_orders`, `purchase_order_items`) e fornecedores (`suppliers`).
  * As ações de **Criar**, **Editar**, **Mudar Status** e **Excluir** disparam chamadas diretas ao banco de dados no Supabase.
* **Permissões RLS:** Script [`supabase_rls_enable.sql`](./supabase_rls_enable.sql) com políticas prontas para liberação no SQL Editor do Supabase.

### 2.7. Autenticação, Senhas e Controle de Acesso (RBAC)
* **Tela de Login ([`src/components/LoginView.tsx`](./src/components/LoginView.tsx)):**
  * Bloqueio de rotas não autorizadas, campos de email/senha com alternância de visibilidade (👁️), mensagens de erro e atalhos rápidos de acesso por perfil.
* **Senhas por Usuário:** Cada usuário possui sua senha salva no estado/banco.
* **Proteção Admin:** Apenas usuários com o cargo **`admin`** podem acessar a área de criação/exclusão de usuários e alterar dados fiscais da loja em [`src/components/SettingsView.tsx`](./src/components/SettingsView.tsx).

---

## 3. 👥 Credenciais & Perfis de Usuário

| Nome | Cargo / Perfil | Email de Acesso | Senha Padrão | Permissões |
| :--- | :--- | :--- | :--- | :--- |
| **Helena Zink** | Administradora Geral | `admin@znkpacking.com.br` | `admin` | **Acesso Total** (Usuários, Configurações, Pedidos, Custos) |
| **Camila Duarte** | Estilista & Compradora | `camila.duarte@znkpacking.com.br` | `compras123` | Criação e Edição de Pedidos de Compra |
| **Rodrigo Mendes** | Gerente de PCP | `rodrigo.pcp@znkpacking.com.br` | `pcp123` | Prazos, Status e Logística |
| **Mariana Rocha** | Controladoria & Financeiro | `financeiro@znkpacking.com.br` | `fin123` | Custos, Margens e Relatórios |
| **Beatriz Lima** | Assistente de Estoque | `assistente@znkpacking.com.br` | `assist123` | Visualização e Consulta |

---

## 4. 🔑 Variáveis de Ambiente Necessárias

No arquivo `.env` local e nas **Environment Variables** da Netlify:

```env
DATABASE_URL="postgresql://postgres:zinkstore0901@db.hwtgofjeglrmbykegsru.supabase.co:5432/postgres?sslmode=require"
NODE_ENV="production"
JWT_SECRET="YOUR_JWT_SECRET_KEY"
VITE_SUPABASE_URL="https://hwtgofjeglrmbykegsru.supabase.co"
VITE_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_DO_SUPABASE"
```

---

## 5. 🚀 Comandos Úteis do Projeto

* **Iniciar Servidor Local:**
  ```bash
  npm run dev
  ```
* **Compilar e Validar Build de Produção:**
  ```bash
  npm run build
  ```
* **Enviar Alterações para a Netlify (Deploy Automático):**
  ```bash
  git add .
  git commit -m "feat: sua mensagem de alteração"
  git push
  ```

---
*Documento gerado e mantido automaticamente pelo assistente de engenharia Antigravity.*
