-- ==============================================================================
-- ZNK ATELIER ERP - SCRIPT DE POVOAMENTO DE DADOS (SEED DATA)
-- Execute este script no SQL Editor do Supabase para popular todas as tabelas!
-- ==============================================================================

-- 1. USUÁRIOS DO SISTEMA (SENHA PADRÃO: ZnkAtelier2026! HASH PBKDF2/ARGON2)
INSERT INTO "users" ("id", "name", "email", "password_hash", "role", "role_title", "is_active") VALUES
('a0000000-0000-0000-0000-000000000001', 'Helena Zink', 'helena@znkatelier.com.br', 'd2f8e1a9c3b5476a:4f3c7e9b2a1d8f6e5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f', 'ADMIN', 'Diretora Criativa & Admin', true),
('a0000000-0000-0000-0000-000000000002', 'Camila Duarte', 'camila.duarte@znkatelier.com.br', 'd2f8e1a9c3b5476a:4f3c7e9b2a1d8f6e5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f', 'BUYER', 'Estilista & Compradora Sênior', true),
('a0000000-0000-0000-0000-000000000003', 'Rodrigo Mendes', 'rodrigo.pcp@znkatelier.com.br', 'd2f8e1a9c3b5476a:4f3c7e9b2a1d8f6e5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f', 'PRODUCTION_MANAGER', 'Gerente de Produção & PCP', true),
('a0000000-0000-0000-0000-000000000004', 'Mariana Rocha', 'financeiro@znkatelier.com.br', 'd2f8e1a9c3b5476a:4f3c7e9b2a1d8f6e5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f', 'FINANCE', 'Controladoria & Custos', true),
('a0000000-0000-0000-0000-000000000005', 'Beatriz Lima', 'assistente@znkatelier.com.br', 'd2f8e1a9c3b5476a:4f3c7e9b2a1d8f6e5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f', 'VIEWER', 'Assistente de Estoque', true)
ON CONFLICT ("email") DO NOTHING;

-- 2. FORNECEDORES E OFICINAS DE CONFECÇÃO
INSERT INTO "suppliers" (
    "id", "corporate_name", "trade_name", "cnpj_cpf", "contact_name", 
    "phone", "whatsapp", "email", "city", "state", 
    "default_payment_terms", "category_specialty", "average_lead_days", "rating", "is_active"
) VALUES
('b0000000-0000-0000-0000-000000000001', 'Tear Nobre Tecelagem e Acabamentos LTDA', 'Tear Nobre Têxtil', '12.345.678/0001-90', 'Marcio Souza', '(11) 3221-4500', '11998877665', 'comercial@tearnobre.com.br', 'Brás, São Paulo', 'SP', '30/60 DDL', 'Linho Puro, Viscose e Sarja Nobre', 15, 4.9, true),
('b0000000-0000-0000-0000-000000000002', 'Oficina de Alta Costura Bella Donna ME', 'Bella Donna Confecções', '98.765.432/0001-10', 'Dona Luciana', '(11) 2694-8800', '11977665544', 'luciana.corte@belladonna.ind.br', 'Bom Retiro, São Paulo', 'SP', '50% Entrada / 50% Entrega', 'Vestidos de Festa, Alfaiataria e Seda', 20, 4.8, true),
('b0000000-0000-0000-0000-000000000003', 'Fios & Tramas Malharia e Tricot EIRELI', 'Fios & Tramas Tricot', '45.678.901/0001-23', 'Renato Prado', '(35) 3465-1200', '35988112233', 'vendas@fiosetramas.com.br', 'Monte Sião', 'MG', '28/56 DDL', 'Tricot Modal, Linho Verão e Cardigans', 25, 4.7, true),
('b0000000-0000-0000-0000-000000000004', 'Stylo Jeans Lavanderia e Denim LTDA', 'Stylo Denim Fabril', '23.456.789/0001-34', 'Carla Bittencourt', '(47) 3355-8900', '47999443322', 'carla@stylodenim.com.br', 'Brusque', 'SC', '30/60/90 DDL', 'Jeans Premium 100% Algodão, Wide Leg e Jaquetas', 30, 4.6, true),
('b0000000-0000-0000-0000-000000000005', 'Renda & Seda Importadora e Bordados LTDA', 'Renda & Seda Atelier', '67.890.123/0001-45', 'Sophie Laurent', '(21) 2233-7788', '21981234567', 'sophie@rendaeseda.com.br', 'Petrópolis', 'RJ', 'À Vista (5% Desc) ou 30 DDL', 'Rendas Guipure, Tule Ilusion e Lingerie Fina', 18, 5.0, true),
('b0000000-0000-0000-0000-000000000006', 'Aviamentos Botões & Zíperes Premier LTDA', 'Premier Aviamentos', '34.567.890/0001-56', 'Eduardo Lima', '(11) 3311-6677', '11973219876', 'eduardo@premieraviamentos.com.br', 'São Paulo', 'SP', '30 DDL', 'Botões de Madrepérola, Zíperes Invisíveis e Fivelas', 7, 4.9, true)
ON CONFLICT ("cnpj_cpf") DO NOTHING;

-- 3. PEDIDOS DE COMPRA (PURCHASE ORDERS)
INSERT INTO "purchase_orders" (
    "id", "order_number", "supplier_id", "user_id", "status", 
    "collection", "issue_date", "expected_delivery_date", "actual_delivery_date", 
    "payment_terms", "shipping_carrier", "shipping_cost", "discount", 
    "total_pieces", "total_amount", "notes"
) VALUES
(
    'c0000000-0000-0000-0000-000000000001', 'PED-2026-0041', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'PENDING',
    'Alto Verão 2026 - Riviera', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '2 days', NULL,
    '30/60 DDL', 'Braspress Expresso', 150.00, 0.00,
    180, 15450.00, 'Enviar amostra de lote antes do corte principal.'
),
(
    'c0000000-0000-0000-0000-000000000002', 'PED-2026-0042', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'APPROVED',
    'Alfaiataria Nobre - Cápsula 01', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '2 days', NULL,
    '50% Entrada / 50% Entrega', 'Jadlog Premium', 120.00, 500.00,
    140, 21920.00, 'Atenção redobrada ao acabamento das costuras internas em viés de cetim.'
),
(
    'c0000000-0000-0000-0000-000000000003', 'PED-2026-0043', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'IN_TRANSIT',
    'Resort & Tricot 2026', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '5 days', NULL,
    '28/56 DDL', 'Transportadora Minas Express', 200.00, 0.00,
    95, 11410.00, 'Rastreio BR-98234190MG. Despachado com nota fiscal eletrônica.'
),
(
    'c0000000-0000-0000-0000-000000000004', 'PED-2026-0038', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'DELIVERED',
    'Essential Denim 2026', CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '4 days',
    '30/60/90 DDL', 'Direta Log', 300.00, 1000.00,
    300, 26900.00, 'Pedido conferido na expedição e estocado com 100% de conformidade.'
)
ON CONFLICT ("order_number") DO NOTHING;

-- 4. ITENS DETALHADOS DOS PEDIDOS DE COMPRA
INSERT INTO "purchase_order_items" (
    "purchase_order_id", "sku", "description", "size_grid_type", 
    "size", "color", "color_hex", "quantity", "unit_cost", "suggested_price", "subtotal"
) VALUES
-- Itens do PED-2026-0041 (Linho Riviera)
('c0000000-0000-0000-0000-000000000001', 'VEST-2601', 'Vestido Midi Linho Cru com Botões Madrepérola', 'letter', 'Grade P/M/G (20/30/20)', 'Linho Natural', '#E6D7C3', 70, 95.00, 289.90, 6650.00),
('c0000000-0000-0000-0000-000000000001', 'VEST-2602', 'Vestido Midi Linho Cru Terracota', 'letter', 'Grade P/M/G (15/25/15)', 'Terracota', '#B07D4F', 55, 95.00, 289.90, 5225.00),
('c0000000-0000-0000-0000-000000000001', 'CAM-2604', 'Camisa Manga Longa 100% Linho com Bolso', 'letter', 'Grade P/M/G/GG', 'Off-White', '#FAF8F5', 55, 65.00, 199.90, 3575.00),

-- Itens do PED-2026-0042 (Alfaiataria Nobre)
('c0000000-0000-0000-0000-000000000002', 'BLZ-2610', 'Blazer Estruturado com Forro de Cetim', 'numeric', '38 ao 44 (10 cada)', 'Verde Esmeralda', '#2D5A43', 40, 160.00, 489.90, 6400.00),
('c0000000-0000-0000-0000-000000000002', 'CAL-2611', 'Calça Alfaiataria Reta com Pregas', 'numeric', '36 ao 44', 'Verde Esmeralda', '#2D5A43', 50, 110.00, 329.90, 5500.00),
('c0000000-0000-0000-0000-000000000002', 'BLZ-2612', 'Blazer Estruturado Preto Noir', 'numeric', '38 ao 44', 'Preto Noir', '#1A1817', 50, 160.00, 489.90, 8000.00),

-- Itens do PED-2026-0043 (Tricot & Modal)
('c0000000-0000-0000-0000-000000000003', 'TRIC-2620', 'Cardigan Canelado Modal Toque Macio', 'letter', 'Grade P/M/G', 'Champagne Nude', '#D4AF37', 50, 120.00, 349.90, 6000.00),
('c0000000-0000-0000-0000-000000000003', 'TOP-2621', 'Regata Tricot Decote Quadrado', 'letter', 'Grade P/M/G', 'Lavanda Seda', '#B5A0C8', 45, 68.00, 189.90, 3060.00),

-- Itens do PED-2026-0038 (Denim)
('c0000000-0000-0000-0000-000000000004', 'JNS-2630', 'Calça Wide Leg Denim 100% Algodão Cintura Alta', 'numeric', '36 ao 44 (30 por tam)', 'Azul Médio Vintage', '#3B5998', 150, 92.00, 279.90, 13800.00),
('c0000000-0000-0000-0000-000000000004', 'JAQ-2631', 'Jaqueta Jeans Oversized com Bolsos Frontais', 'letter', 'Grade P/M/G/GG', 'Azul Médio Vintage', '#3B5998', 150, 90.00, 299.90, 13500.00);
