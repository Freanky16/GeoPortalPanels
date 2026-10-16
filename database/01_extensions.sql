-- ============================================================
-- 01_extensions.sql
-- Habilitar extensiones de PostgreSQL necesarias
-- ============================================================
-- ORDEN DE EJECUCIÓN: 1 de 10
-- INSTRUCCIÓN: Pega este archivo en el SQL Editor de Supabase y haz clic en "Run".
-- Si ves "already exists", no pasa nada — solo significa que ya estaba activo.
-- ============================================================

-- PostGIS: permite guardar coordenadas como geometría real y hacer índices espaciales.
-- Es lo que permite buscar "todos los paneles en un radio de X km" en el futuro.
CREATE EXTENSION IF NOT EXISTS postgis;

-- unaccent: permite búsqueda tolerante a tildes.
-- Ej: buscar "Jesus Maria" encuentra "Jesús María" y viceversa.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- pg_trgm: permite búsqueda por similitud de texto (trigramas).
-- Es lo que hace que buscar "salaverry" encuentre "AV. SALAVERRY CDRA. 1".
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- uuid-ossp: genera UUIDs desde SQL (útil para inserciones manuales).
-- En Supabase ya suele estar activo, pero lo activamos por si acaso.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
