-- =============================================================================
-- MIGRATION: Adicionar campos de Markup e Desconto em purchase_orders e purchase_order_items
-- =============================================================================

-- 1. Adicionar colunas de markup e desconto na tabela de pedidos (purchase_orders)
ALTER TABLE IF EXISTS "purchase_orders" 
ADD COLUMN IF NOT EXISTS "discount_percentage" DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "default_markup" DECIMAL(5, 2) NOT NULL DEFAULT 2.20;

-- 2. Adicionar colunas de desconto percentual e markup na tabela de itens (purchase_order_items)
ALTER TABLE IF EXISTS "purchase_order_items" 
ADD COLUMN IF NOT EXISTS "discount_percent" DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "markup" DECIMAL(5, 2) NOT NULL DEFAULT 2.20;

-- 3. Comentários para documentação de schema
COMMENT ON COLUMN "purchase_orders"."discount_percentage" IS 'Percentual de desconto global aplicado ao pedido (%)';
COMMENT ON COLUMN "purchase_orders"."default_markup" IS 'Multiplicador padrão de markup de venda para o pedido (ex: 2.20)';
COMMENT ON COLUMN "purchase_order_items"."discount_percent" IS 'Percentual de desconto recebido no produto/item (%)';
COMMENT ON COLUMN "purchase_order_items"."markup" IS 'Multiplicador de markup de venda sugerido para este item (ex: 2.20)';

-- 4. Notificar conclusão
DO $$ 
BEGIN 
    RAISE NOTICE 'Migração de Markup e Descontos concluída com sucesso no ZNK Packing.'; 
END $$;
