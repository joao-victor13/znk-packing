-- Script de Inicialização e Extensões do PostgreSQL
-- Executado automaticamente na primeira subida do container

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ajuste de fuso horário padrão do banco para horário oficial de Brasília
SET timezone = 'America/Sao_Paulo';
