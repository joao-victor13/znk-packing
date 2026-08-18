-- ==============================================================================
-- ZNK PACKING - HABILITAÇÃO DE ACESSO DIRETO (RLS POLICIES) NO SUPABASE
-- Execute este script no SQL Editor do Supabase (supabase.com/dashboard)
-- para permitir que o site sincronize criações, edições e exclusões em tempo real.
-- ==============================================================================

-- 1. HABILITAR RLS NAS TABELAS
ALTER TABLE IF EXISTS "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "purchase_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "store_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS DE ACESSO TOTAL PARA FORNECEDORES (SUPPLIERS)
DROP POLICY IF EXISTS "Permitir leitura de fornecedores" ON "suppliers";
CREATE POLICY "Permitir leitura de fornecedores" ON "suppliers" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercao de fornecedores" ON "suppliers";
CREATE POLICY "Permitir insercao de fornecedores" ON "suppliers" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de fornecedores" ON "suppliers";
CREATE POLICY "Permitir atualizacao de fornecedores" ON "suppliers" FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusao de fornecedores" ON "suppliers";
CREATE POLICY "Permitir exclusao de fornecedores" ON "suppliers" FOR DELETE USING (true);

-- 3. POLÍTICAS DE ACESSO TOTAL PARA PEDIDOS (PURCHASE ORDERS)
DROP POLICY IF EXISTS "Permitir leitura de pedidos" ON "purchase_orders";
CREATE POLICY "Permitir leitura de pedidos" ON "purchase_orders" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercao de pedidos" ON "purchase_orders";
CREATE POLICY "Permitir insercao de pedidos" ON "purchase_orders" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de pedidos" ON "purchase_orders";
CREATE POLICY "Permitir atualizacao de pedidos" ON "purchase_orders" FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusao de pedidos" ON "purchase_orders";
CREATE POLICY "Permitir exclusao de pedidos" ON "purchase_orders" FOR DELETE USING (true);

-- 4. POLÍTICAS DE ACESSO TOTAL PARA ITENS DO PEDIDO (PURCHASE ORDER ITEMS)
DROP POLICY IF EXISTS "Permitir leitura de itens" ON "purchase_order_items";
CREATE POLICY "Permitir leitura de itens" ON "purchase_order_items" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercao de itens" ON "purchase_order_items";
CREATE POLICY "Permitir insercao de itens" ON "purchase_order_items" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de itens" ON "purchase_order_items";
CREATE POLICY "Permitir atualizacao de itens" ON "purchase_order_items" FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusao de itens" ON "purchase_order_items";
CREATE POLICY "Permitir exclusao de itens" ON "purchase_order_items" FOR DELETE USING (true);

-- 5. POLÍTICAS PARA CATEGORIAS & CONFIGURAÇÕES
DROP POLICY IF EXISTS "Permitir acesso geral de categorias" ON "categories";
CREATE POLICY "Permitir acesso geral de categorias" ON "categories" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso geral de configuracoes" ON "store_settings";
CREATE POLICY "Permitir acesso geral de configuracoes" ON "store_settings" FOR ALL USING (true) WITH CHECK (true);

-- 6. POLÍTICAS PARA USUÁRIOS (USERS)
DROP POLICY IF EXISTS "Permitir acesso geral de usuarios" ON "users";
CREATE POLICY "Permitir acesso geral de usuarios" ON "users" FOR ALL USING (true) WITH CHECK (true);

-- 7. HABILITAR REALTIME (SINCRONIZAÇÃO INSTANTÂNEA MULTI-DISPOSITIVO)
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE purchase_orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE purchase_order_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE suppliers;
    ALTER PUBLICATION supabase_realtime ADD TABLE store_settings;
    ALTER PUBLICATION supabase_realtime ADD TABLE categories;
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

