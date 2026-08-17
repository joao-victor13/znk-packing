-- ==============================================================================
-- ZNK PACKING - CRIAÇÃO DO USUÁRIO ADMINISTRADOR PADRÃO
-- Execute este script no SQL Editor do Supabase (supabase.com/dashboard)
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Garantir que o tipo UserRole existe
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BUYER', 'PRODUCTION_MANAGER', 'FINANCE', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Garantir que a tabela users existe
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(120) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "role_title" VARCHAR(80),
    "avatar_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Inserir ou Atualizar o Administrador Padrão
INSERT INTO "users" (
    "name", 
    "email", 
    "password_hash", 
    "role", 
    "role_title", 
    "is_active"
)
VALUES (
    'Administrador ZNK',
    'admin@znkpacking.com.br',
    crypt('admin', gen_salt('bf', 10)),
    'ADMIN',
    'Diretora & Administradora Geral',
    true
)
ON CONFLICT ("email") 
DO UPDATE SET
    "name" = EXCLUDED."name",
    "password_hash" = crypt('admin', gen_salt('bf', 10)),
    "role" = 'ADMIN',
    "role_title" = EXCLUDED."role_title",
    "is_active" = true,
    "updated_at" = CURRENT_TIMESTAMP;

-- 5. Verificar o usuário criado
SELECT "id", "name", "email", "role", "role_title", "is_active", "created_at" 
FROM "users" 
WHERE "email" = 'admin@znkpacking.com.br';
