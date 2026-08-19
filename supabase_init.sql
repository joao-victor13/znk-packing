-- ==============================================================================
-- ZNK ATELIER ERP - SCRIPT DE INICIALIZAÇÃO DE BANCO DE DADOS (POSTGRESQL / SUPABASE)
-- Execute este script no SQL Editor do Supabase (supabase.com/dashboard)
-- ==============================================================================

-- 1. EXTENSÕES
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

-- 5. TABELA DE REFRESH TOKENS (SESSÕES SEGURAS)
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" VARCHAR(255) UNIQUE NOT NULL,
    "user_agent" VARCHAR(255),
    "ip_address" VARCHAR(45),
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- 6. TABELA DE FORNECEDORES (SUPPLIERS)
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
CREATE INDEX IF NOT EXISTS "suppliers_is_active_idx" ON "suppliers"("is_active");

-- 7. TABELA DE CATEGORIAS DE MODA FEMININA
CREATE TABLE IF NOT EXISTS "categories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(60) UNIQUE NOT NULL,
    "slug" VARCHAR(60) UNIQUE NOT NULL,
    "badge_bg" VARCHAR(30) NOT NULL DEFAULT 'bg-stone-100',
    "badge_text" VARCHAR(30) NOT NULL DEFAULT 'text-stone-800',
    "badge_border" VARCHAR(30) NOT NULL DEFAULT 'border-stone-200',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories"("slug");

-- 8. TABELA DE PEDIDOS DE COMPRA (PURCHASE ORDERS)
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
    "discount_percentage" DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    "default_markup" DECIMAL(5, 2) NOT NULL DEFAULT 2.20,
    "total_pieces" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "purchase_orders_order_number_idx" ON "purchase_orders"("order_number");
CREATE INDEX IF NOT EXISTS "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");
CREATE INDEX IF NOT EXISTS "purchase_orders_status_idx" ON "purchase_orders"("status");
CREATE INDEX IF NOT EXISTS "purchase_orders_expected_delivery_date_idx" ON "purchase_orders"("expected_delivery_date");
CREATE INDEX IF NOT EXISTS "purchase_orders_issue_date_idx" ON "purchase_orders"("issue_date");
CREATE INDEX IF NOT EXISTS "purchase_orders_status_expected_delivery_date_idx" ON "purchase_orders"("status", "expected_delivery_date");

-- 9. TABELA DE ITENS DO PEDIDO (PURCHASE ORDER ITEMS)
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
    "discount_percent" DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    "markup" DECIMAL(5, 2) NOT NULL DEFAULT 2.20,
    "suggested_price" DECIMAL(10, 2),
    "subtotal" DECIMAL(10, 2) NOT NULL,
    "notes" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "purchase_order_items_purchase_order_id_idx" ON "purchase_order_items"("purchase_order_id");
CREATE INDEX IF NOT EXISTS "purchase_order_items_sku_idx" ON "purchase_order_items"("sku");
CREATE INDEX IF NOT EXISTS "purchase_order_items_category_id_idx" ON "purchase_order_items"("category_id");

-- 10. TABELA DE LOGS DE AUDITORIA (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "action" "AuditAction" NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(50),
    "previous_state" JSONB,
    "new_state" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- 11. DADOS INICIAIS PADRÃO DE DEMONSTRAÇÃO (CONFIGURAÇÕES E CATEGORIAS)
INSERT INTO "store_settings" (
    "brand_name", "brand_slogan", "legal_name", "cnpj", 
    "purchasing_email", "whatsapp_business", "showroom_address", 
    "city", "state", "currency_symbol", "legal_footer_notes"
) VALUES (
    'ZNK Atelier', 'Moda Feminina & Alta Confecção', 'ZNK Comercio de Vestuario LTDA', '48.912.345/0001-89',
    'compras@znkatelier.com.br', '(11) 98765-4321', 'Rua Oscar Freire, 1420 - Jardins',
    'São Paulo', 'SP', 'R$', 'Ordem de compra sujeita aos termos de controle de qualidade e prazos acordados.'
) ON CONFLICT ("cnpj") DO NOTHING;

INSERT INTO "categories" ("name", "slug", "badge_bg", "badge_text", "badge_border") VALUES
('Vestidos', 'vestidos', 'bg-rose-50', 'text-rose-800', 'border-rose-200'),
('Alfaiataria', 'alfaiataria', 'bg-stone-100', 'text-stone-800', 'border-stone-200'),
('Lingerie & Sleepwear', 'lingerie-sleepwear', 'bg-pink-50', 'text-pink-800', 'border-pink-200'),
('Beachwear / Praia', 'beachwear-praia', 'bg-teal-50', 'text-teal-800', 'border-teal-200'),
('Jeans / Denim', 'jeans-denim', 'bg-indigo-50', 'text-indigo-800', 'border-indigo-200'),
('Tricot & Malharia', 'tricot-malharia', 'bg-amber-50', 'text-amber-800', 'border-amber-200'),
('Bodies & Croppeds', 'bodies-croppeds', 'bg-purple-50', 'text-purple-800', 'border-purple-200'),
('Casacos & Blazers', 'casacos-blazers', 'bg-emerald-50', 'text-emerald-800', 'border-emerald-200')
ON CONFLICT ("slug") DO NOTHING;

-- 12. DADOS INICIAIS DE USUÁRIOS (COM SENHAS CRIPTOGRAFADAS)
INSERT INTO "users" ("name", "email", "password_hash", "role", "role_title") VALUES
('Helena Zink', 'admin@znkpacking.com.br', crypt('admin', gen_salt('bf')), 'ADMIN', 'Diretora & Administradora Geral'),
('Camila Duarte', 'camila.duarte@znkpacking.com.br', crypt('compras123', gen_salt('bf')), 'BUYER', 'Estilista & Compradora Sênior'),
('Rodrigo Mendes', 'rodrigo.pcp@znkpacking.com.br', crypt('pcp123', gen_salt('bf')), 'PRODUCTION_MANAGER', 'Gerente de Produção & PCP'),
('Mariana Rocha', 'financeiro@znkpacking.com.br', crypt('fin123', gen_salt('bf')), 'FINANCE', 'Controladoria & Custos'),
('Beatriz Lima', 'assistente@znkpacking.com.br', crypt('assist123', gen_salt('bf')), 'VIEWER', 'Assistente de Estoque')
ON CONFLICT ("email") DO NOTHING;

