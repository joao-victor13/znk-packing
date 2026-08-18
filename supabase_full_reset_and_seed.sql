-- ==============================================================================
-- ZNK PACKING ERP - SCRIPT COMPLETO DE ESTRUTURA, DADOS E PERMISSÕES (SUPABASE)
-- Execute este script no SQL Editor do Supabase (supabase.com/dashboard)
-- para restaurar/atualizar todas as tabelas, usuários oficiais e permissões RLS.
-- ==============================================================================

-- 1. EXTENSÕES POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS DE NEGÓCIO
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BUYER', 'PRODUCTION_MANAGER', 'FINANCE', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AuditAction" AS ENUM (
        'USER_LOGIN_SUCCESS', 'USER_LOGIN_FAILED', 'USER_LOCKED',
        'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_STATUS_CHANGED', 'ORDER_DELETED',
        'SUPPLIER_CREATED', 'SUPPLIER_UPDATED', 'STORE_SETTINGS_UPDATED', 'CATEGORY_MUTATED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(120) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "role_title" VARCHAR(80),
    "avatar_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "last_login_ip" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_is_active_idx" ON "users"("role", "is_active");

-- 4. TABELA DE CONFIGURAÇÕES DA LOJA (BRAND SETTINGS)
CREATE TABLE IF NOT EXISTS "store_settings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "brand_name" VARCHAR(100) NOT NULL,
    "brand_slogan" VARCHAR(200),
    "legal_name" VARCHAR(150) NOT NULL,
    "cnpj" VARCHAR(18) UNIQUE NOT NULL,
    "purchasing_email" VARCHAR(120) NOT NULL,
    "whatsapp_business" VARCHAR(20) NOT NULL,
    "phone_secondary" VARCHAR(20),
    "showroom_address" VARCHAR(255) NOT NULL,
    "city" VARCHAR(80) NOT NULL,
    "state" CHAR(2) NOT NULL,
    "currency_symbol" VARCHAR(5) NOT NULL DEFAULT 'R$',
    "legal_footer_notes" TEXT,
    "logo_url" VARCHAR(500),
    "updated_by_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE FORNECEDORES (SUPPLIERS)
CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "corporate_name" VARCHAR(150) NOT NULL,
    "trade_name" VARCHAR(120) NOT NULL,
    "cnpj_cpf" VARCHAR(18) UNIQUE NOT NULL,
    "contact_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "whatsapp" VARCHAR(20) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "city" VARCHAR(80) NOT NULL,
    "state" CHAR(2) NOT NULL,
    "default_payment_terms" VARCHAR(80) NOT NULL,
    "category_specialty" VARCHAR(120) NOT NULL,
    "average_lead_days" INTEGER NOT NULL DEFAULT 18,
    "rating" DECIMAL(2, 1) NOT NULL DEFAULT 5.0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "suppliers_cnpj_cpf_idx" ON "suppliers"("cnpj_cpf");
CREATE INDEX IF NOT EXISTS "suppliers_trade_name_idx" ON "suppliers"("trade_name");

-- 6. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS "categories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(60) UNIQUE NOT NULL,
    "slug" VARCHAR(60) UNIQUE NOT NULL,
    "badge_bg" VARCHAR(40) NOT NULL DEFAULT 'bg-stone-100 dark:bg-stone-800/40',
    "badge_text" VARCHAR(40) NOT NULL DEFAULT 'text-stone-800 dark:text-stone-300',
    "badge_border" VARCHAR(40) NOT NULL DEFAULT 'border-stone-200 dark:border-stone-700/40',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABELA DE PEDIDOS DE COMPRA (PURCHASE ORDERS)
CREATE TABLE IF NOT EXISTS "purchase_orders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_number" VARCHAR(30) UNIQUE NOT NULL,
    "supplier_id" UUID NOT NULL REFERENCES "suppliers"("id") ON DELETE RESTRICT,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "collection" VARCHAR(80) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expected_delivery_date" DATE NOT NULL,
    "actual_delivery_date" DATE,
    "payment_terms" VARCHAR(80) NOT NULL,
    "shipping_carrier" VARCHAR(80),
    "shipping_cost" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "discount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "total_pieces" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "purchase_orders_order_number_idx" ON "purchase_orders"("order_number");
CREATE INDEX IF NOT EXISTS "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");
CREATE INDEX IF NOT EXISTS "purchase_orders_status_idx" ON "purchase_orders"("status");

-- 8. TABELA DE ITENS DO PEDIDO (PURCHASE ORDER ITEMS)
CREATE TABLE IF NOT EXISTS "purchase_order_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "purchase_order_id" UUID NOT NULL REFERENCES "purchase_orders"("id") ON DELETE CASCADE,
    "category_id" UUID REFERENCES "categories"("id") ON DELETE SET NULL,
    "sku" VARCHAR(50) NOT NULL,
    "description" VARCHAR(150) NOT NULL,
    "size_grid_type" VARCHAR(20) NOT NULL DEFAULT 'letter',
    "size" VARCHAR(50) NOT NULL,
    "color" VARCHAR(50) NOT NULL,
    "color_hex" VARCHAR(7),
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(10, 2) NOT NULL,
    "suggested_price" DECIMAL(10, 2),
    "subtotal" DECIMAL(10, 2) NOT NULL,
    "notes" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. DADOS ATUALIZADOS DOS USUÁRIOS DO SISTEMA
INSERT INTO "users" ("id", "name", "email", "password_hash", "role", "role_title", "is_active") VALUES
('a0000000-0000-0000-0000-000000000001', 'Helena Zink', 'admin@znkpacking.com.br', crypt('admin', gen_salt('bf')), 'ADMIN', 'Diretora & Administradora Geral', true),
('a0000000-0000-0000-0000-000000000002', 'Camila Duarte', 'camila.duarte@znkpacking.com.br', crypt('compras123', gen_salt('bf')), 'BUYER', 'Estilista & Compradora Sênior', true),
('a0000000-0000-0000-0000-000000000003', 'Rodrigo Mendes', 'rodrigo.pcp@znkpacking.com.br', crypt('pcp123', gen_salt('bf')), 'PRODUCTION_MANAGER', 'Gerente de Produção & PCP', true),
('a0000000-0000-0000-0000-000000000004', 'Mariana Rocha', 'financeiro@znkpacking.com.br', crypt('fin123', gen_salt('bf')), 'FINANCE', 'Controladoria & Custos', true),
('a0000000-0000-0000-0000-000000000005', 'Beatriz Lima', 'assistente@znkpacking.com.br', crypt('assist123', gen_salt('bf')), 'VIEWER', 'Assistente de Estoque', true)
ON CONFLICT ("email") DO UPDATE SET
    "name" = EXCLUDED."name",
    "password_hash" = EXCLUDED."password_hash",
    "role" = EXCLUDED."role",
    "role_title" = EXCLUDED."role_title",
    "is_active" = EXCLUDED."is_active",
    "updated_at" = CURRENT_TIMESTAMP;

-- 10. DADOS ATUALIZADOS DA LOJA (BRAND SETTINGS)
INSERT INTO "store_settings" (
    "brand_name", "brand_slogan", "legal_name", "cnpj", 
    "purchasing_email", "whatsapp_business", "showroom_address", 
    "city", "state", "currency_symbol", "legal_footer_notes"
) VALUES (
    'ZNK Packing', 'Gestão de Pedidos de Compra & Confecção Feminina', 
    'ZNK Packing Comércio & Confecção de Roupas Femininas Ltda', '42.190.876/0001-33',
    'compras@znkpacking.com.br', '(11) 97654-3210', 'Rua Oscar Freire, 1420 - Jardins',
    'São Paulo', 'SP', 'R$', 'Ordem de Compra oficial ZNK Packing - Sujeita aos termos e controle de qualidade.'
) ON CONFLICT ("cnpj") DO UPDATE SET
    "brand_name" = EXCLUDED."brand_name",
    "brand_slogan" = EXCLUDED."brand_slogan",
    "legal_name" = EXCLUDED."legal_name",
    "purchasing_email" = EXCLUDED."purchasing_email",
    "whatsapp_business" = EXCLUDED."whatsapp_business",
    "showroom_address" = EXCLUDED."showroom_address",
    "updated_at" = CURRENT_TIMESTAMP;

-- 11. DADOS ATUALIZADOS DAS CATEGORIAS
INSERT INTO "categories" ("name", "slug", "badge_bg", "badge_text", "badge_border") VALUES
('Vestidos', 'vestidos', 'bg-rose-50 dark:bg-rose-950/40', 'text-rose-800 dark:text-rose-300', 'border-rose-200 dark:border-rose-800/40'),
('Blusas', 'blusas', 'bg-amber-50 dark:bg-amber-950/40', 'text-amber-800 dark:text-amber-300', 'border-amber-200 dark:border-amber-800/40'),
('Calças', 'calcas', 'bg-stone-100 dark:bg-stone-800/40', 'text-stone-800 dark:text-stone-300', 'border-stone-200 dark:border-stone-700/40'),
('Alfaiataria', 'alfaiataria', 'bg-emerald-50 dark:bg-emerald-950/40', 'text-emerald-800 dark:text-emerald-300', 'border-emerald-200 dark:border-emerald-800/40'),
('Saias', 'saias', 'bg-purple-50 dark:bg-purple-950/40', 'text-purple-800 dark:text-purple-300', 'border-purple-200 dark:border-purple-800/40'),
('Casacos & Blazers', 'casacos-blazers', 'bg-blue-50 dark:bg-blue-950/40', 'text-blue-800 dark:text-blue-300', 'border-blue-200 dark:border-blue-800/40'),
('Conjuntos', 'conjuntos', 'bg-orange-50 dark:bg-orange-950/40', 'text-orange-800 dark:text-orange-300', 'border-orange-200 dark:border-orange-800/40'),
('Lingerie & Noite', 'lingerie-noite', 'bg-pink-50 dark:bg-pink-950/40', 'text-pink-800 dark:text-pink-300', 'border-pink-200 dark:border-pink-800/40'),
('Beachwear', 'beachwear', 'bg-teal-50 dark:bg-teal-950/40', 'text-teal-800 dark:text-teal-300', 'border-teal-200 dark:border-teal-800/40'),
('Tricot', 'tricot', 'bg-yellow-50 dark:bg-yellow-950/40', 'text-yellow-800 dark:text-yellow-300', 'border-yellow-200 dark:border-yellow-800/40')
ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "badge_bg" = EXCLUDED."badge_bg",
    "badge_text" = EXCLUDED."badge_text",
    "badge_border" = EXCLUDED."badge_border";

-- 12. DADOS ATUALIZADOS DOS FORNECEDORES
INSERT INTO "suppliers" (
    "id", "corporate_name", "trade_name", "cnpj_cpf", "contact_name", 
    "phone", "whatsapp", "email", "city", "state", 
    "default_payment_terms", "category_specialty", "average_lead_days", "rating", "is_active"
) VALUES
('b0000000-0000-0000-0000-000000000001', 'Tear Nobre Tecelagem e Acabamentos LTDA', 'Tear Nobre Têxtil', '12.345.678/0001-90', 'Marcio Souza', '(11) 3221-4500', '(11) 99887-7665', 'comercial@tearnobre.com.br', 'Brás, São Paulo', 'SP', '30 / 60 dias (Boleto)', 'Linho Puro, Viscose e Sarja Nobre', 15, 4.9, true),
('b0000000-0000-0000-0000-000000000002', 'Oficina de Alta Costura Bella Donna ME', 'Bella Donna Confecções', '98.765.432/0001-10', 'Dona Luciana', '(11) 2694-8800', '(11) 97766-5544', 'luciana.corte@belladonna.ind.br', 'Bom Retiro, São Paulo', 'SP', '50% Entrada / 50% Entrega', 'Vestidos de Festa, Alfaiataria e Seda', 20, 4.8, true),
('b0000000-0000-0000-0000-000000000003', 'Fios & Tramas Malharia e Tricot EIRELI', 'Fios & Tramas Tricot', '45.678.901/0001-23', 'Renato Prado', '(35) 3465-1200', '(35) 98811-2233', 'vendas@fiosetramas.com.br', 'Monte Sião', 'MG', '30 / 60 / 90 dias (Boleto)', 'Tricot Modal, Linho Verão e Cardigans', 25, 4.7, true),
('b0000000-0000-0000-0000-000000000004', 'Stylo Jeans Lavanderia e Denim LTDA', 'Stylo Denim Fabril', '23.456.789/0001-34', 'Carla Bittencourt', '(47) 3355-8900', '(47) 99944-3322', 'carla@stylodenim.com.br', 'Brusque', 'SC', '30 / 60 / 90 dias (Boleto)', 'Jeans Premium 100% Algodão, Wide Leg e Jaquetas', 30, 4.6, true),
('b0000000-0000-0000-0000-000000000005', 'Renda & Seda Importadora e Bordados LTDA', 'Renda & Seda Atelier', '67.890.123/0001-45', 'Sophie Laurent', '(21) 2233-7788', '(21) 98123-4567', 'sophie@rendaeseda.com.br', 'Petrópolis', 'RJ', 'À Vista (5% Desc) ou 30 DDL', 'Rendas Guipure, Tule Ilusion e Lingerie Fina', 18, 5.0, true),
('b0000000-0000-0000-0000-000000000006', 'Aviamentos Botões & Zíperes Premier LTDA', 'Premier Aviamentos', '34.567.890/0001-56', 'Eduardo Lima', '(11) 3311-6677', '(11) 97321-9876', 'eduardo@premieraviamentos.com.br', 'São Paulo', 'SP', 'Faturado 28 dias', 'Botões de Madrepérola, Zíperes Invisíveis e Fivelas', 10, 4.9, true)
ON CONFLICT ("cnpj_cpf") DO UPDATE SET
    "corporate_name" = EXCLUDED."corporate_name",
    "trade_name" = EXCLUDED."trade_name",
    "contact_name" = EXCLUDED."contact_name",
    "phone" = EXCLUDED."phone",
    "whatsapp" = EXCLUDED."whatsapp",
    "email" = EXCLUDED."email",
    "city" = EXCLUDED."city",
    "state" = EXCLUDED."state",
    "default_payment_terms" = EXCLUDED."default_payment_terms",
    "category_specialty" = EXCLUDED."category_specialty",
    "average_lead_days" = EXCLUDED."average_lead_days",
    "rating" = EXCLUDED."rating",
    "updated_at" = CURRENT_TIMESTAMP;

-- 13. DADOS ATUALIZADOS DOS PEDIDOS DE COMPRA
INSERT INTO "purchase_orders" (
    "id", "order_number", "supplier_id", "user_id", "status", 
    "collection", "issue_date", "expected_delivery_date", "actual_delivery_date", 
    "payment_terms", "shipping_carrier", "shipping_cost", "discount", 
    "total_pieces", "total_amount", "notes"
) VALUES
(
    'c0000000-0000-0000-0000-000000000001', 'PED-2026-0041', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'IN_TRANSIT',
    'Alto Verão 2026 - Riviera', '2026-08-01', '2026-08-15', NULL,
    '30 / 60 dias (Boleto)', 'Braspress Cargas Rápidas', 150.00, 0.00,
    180, 15450.00, 'Priorizar o envio das peças na cor Off-White e Terracota. Embalagem individual com cabide padrão boutique.'
),
(
    'c0000000-0000-0000-0000-000000000002', 'PED-2026-0042', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'APPROVED',
    'Alfaiataria Nobre - Cápsula 01', '2026-08-05', '2026-08-19', NULL,
    '50% Entrada / 50% Entrega', 'Jadlog Premium', 120.00, 500.00,
    140, 21920.00, 'Atenção redobrada ao acabamento das costuras internas em viés de cetim.'
),
(
    'c0000000-0000-0000-0000-000000000003', 'PED-2026-0043', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'APPROVED',
    'Resort & Tricot 2026', '2026-08-10', '2026-08-28', NULL,
    '30 / 60 / 90 dias (Boleto)', 'Transportadora Minas Express', 200.00, 0.00,
    95, 11410.00, 'Rastreio BR-98234190MG. Despachado com nota fiscal eletrônica.'
),
(
    'c0000000-0000-0000-0000-000000000004', 'PED-2026-0038', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'DELIVERED',
    'Essential Denim 2026', '2026-07-20', '2026-08-04', '2026-08-03',
    '30 / 60 / 90 dias (Boleto)', 'Direta Log', 300.00, 1000.00,
    300, 26900.00, 'Pedido conferido na expedição e estocado com 100% de conformidade.'
)
ON CONFLICT ("order_number") DO UPDATE SET
    "supplier_id" = EXCLUDED."supplier_id",
    "user_id" = EXCLUDED."user_id",
    "status" = EXCLUDED."status",
    "collection" = EXCLUDED."collection",
    "issue_date" = EXCLUDED."issue_date",
    "expected_delivery_date" = EXCLUDED."expected_delivery_date",
    "actual_delivery_date" = EXCLUDED."actual_delivery_date",
    "payment_terms" = EXCLUDED."payment_terms",
    "shipping_carrier" = EXCLUDED."shipping_carrier",
    "shipping_cost" = EXCLUDED."shipping_cost",
    "discount" = EXCLUDED."discount",
    "total_pieces" = EXCLUDED."total_pieces",
    "total_amount" = EXCLUDED."total_amount",
    "notes" = EXCLUDED."notes",
    "updated_at" = CURRENT_TIMESTAMP;

-- 14. DADOS DOS ITENS
DELETE FROM "purchase_order_items" WHERE "purchase_order_id" IN (
    'c0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000004'
);

INSERT INTO "purchase_order_items" (
    "purchase_order_id", "sku", "description", "size_grid_type", 
    "size", "color", "color_hex", "quantity", "unit_cost", "suggested_price", "subtotal", "notes"
) VALUES
-- Itens PED-2026-0041
('c0000000-0000-0000-0000-000000000001', 'VEST-2601', 'Vestido Midi Linho Cru com Botões Madrepérola', 'letter', 'Grade P/M/G (20/30/20)', 'Linho Natural', '#E6D7C3', 70, 95.00, 289.90, 6650.00, 'Forro 100% algodão'),
('c0000000-0000-0000-0000-000000000001', 'VEST-2602', 'Vestido Midi Linho Cru Terracota', 'letter', 'Grade P/M/G (15/25/15)', 'Terracota', '#B07D4F', 55, 95.00, 289.90, 5225.00, NULL),
('c0000000-0000-0000-0000-000000000001', 'CAM-2604', 'Camisa Manga Longa 100% Linho com Bolso', 'letter', 'Grade P/M/G/GG', 'Off-White', '#FAF8F5', 55, 65.00, 199.90, 3575.00, NULL),

-- Itens PED-2026-0042
('c0000000-0000-0000-0000-000000000002', 'BLZ-2610', 'Blazer Estruturado com Forro de Cetim', 'numeric', '38 ao 44 (10 cada)', 'Verde Esmeralda', '#2D5A43', 40, 160.00, 489.90, 6400.00, NULL),
('c0000000-0000-0000-0000-000000000002', 'CAL-2611', 'Calça Alfaiataria Reta com Pregas', 'numeric', '36 ao 44', 'Verde Esmeralda', '#2D5A43', 50, 110.00, 329.90, 5500.00, NULL),
('c0000000-0000-0000-0000-000000000002', 'BLZ-2612', 'Blazer Estruturado Preto Noir', 'numeric', '38 ao 44', 'Preto Noir', '#1A1817', 50, 160.00, 489.90, 8000.00, NULL),

-- Itens PED-2026-0043
('c0000000-0000-0000-0000-000000000003', 'TRIC-2620', 'Cardigan Canelado Modal Toque Macio', 'letter', 'Grade P/M/G', 'Champagne Nude', '#D4AF37', 50, 120.00, 349.90, 6000.00, NULL),
('c0000000-0000-0000-0000-000000000003', 'TOP-2621', 'Regata Tricot Decote Quadrado', 'letter', 'Grade P/M/G', 'Lavanda Seda', '#B5A0C8', 45, 68.00, 189.90, 3060.00, NULL),

-- Itens PED-2026-0038
('c0000000-0000-0000-0000-000000000004', 'JNS-2630', 'Calça Wide Leg Denim 100% Algodão Cintura Alta', 'numeric', '36 ao 44 (30 por tam)', 'Azul Médio Vintage', '#3B5998', 150, 92.00, 279.90, 13800.00, NULL),
('c0000000-0000-0000-0000-000000000004', 'JAQ-2631', 'Jaqueta Jeans Oversized com Bolsos Frontais', 'letter', 'Grade P/M/G/GG', 'Azul Médio Vintage', '#3B5998', 150, 90.00, 299.90, 13500.00, NULL);

-- 15. HABILITAÇÃO E POLÍTICAS RLS (ACESSO COMPLETO DO APP)
ALTER TABLE IF EXISTS "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "purchase_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "store_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso geral de fornecedores" ON "suppliers";
CREATE POLICY "Permitir acesso geral de fornecedores" ON "suppliers" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso geral de pedidos" ON "purchase_orders";
CREATE POLICY "Permitir acesso geral de pedidos" ON "purchase_orders" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso geral de itens" ON "purchase_order_items";
CREATE POLICY "Permitir acesso geral de itens" ON "purchase_order_items" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso geral de categorias" ON "categories";
CREATE POLICY "Permitir acesso geral de categorias" ON "categories" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso geral de configuracoes" ON "store_settings";
CREATE POLICY "Permitir acesso geral de configuracoes" ON "store_settings" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso geral de usuarios" ON "users";
CREATE POLICY "Permitir acesso geral de usuarios" ON "users" FOR ALL USING (true) WITH CHECK (true);
