-- Script de inicialização do banco ErpSys
-- Este arquivo será executado automaticamente quando o container subir

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Comentários sobre o banco
COMMENT ON DATABASE erp_system IS 'ErpSys - Sistema de Comunicação Visual';

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();