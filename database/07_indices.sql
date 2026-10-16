-- ============================================================
-- 07_indices.sql
-- Índices para rendimiento y búsqueda
-- ============================================================
-- ORDEN DE EJECUCIÓN: 7 de 10
-- INSTRUCCIÓN: Ejecutar DESPUÉS de 06_vistas.sql
--
-- Los índices no cambian los datos, solo hacen las consultas más rápidas.
-- Con 1,249 paneles no los necesitarías, pero cuando crezca a 10,000+
-- serán esenciales. Crearlos ahora no tiene costo.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- ÍNDICE ESPACIAL (el más importante)
-- Permite buscar paneles dentro de un área geográfica muy rápido.
-- GIST = Generalized Search Tree, el estándar para geometría.
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_paneles_geom
  ON paneles USING GIST (geom);

-- ─────────────────────────────────────────────────────────────
-- ÍNDICES EN CLAVES FORÁNEAS
-- Sin estos, cada filtro por distrito/empresa/tipo haría un "full table scan"
-- (leer toda la tabla). Con los índices, va directo al dato.
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_paneles_distrito_id
  ON paneles (distrito_id);

CREATE INDEX IF NOT EXISTS idx_paneles_empresa_id
  ON paneles (empresa_id);

CREATE INDEX IF NOT EXISTS idx_paneles_contrato_id
  ON paneles (contrato_id);

CREATE INDEX IF NOT EXISTS idx_paneles_tipo_via_id
  ON paneles (tipo_via_id);

CREATE INDEX IF NOT EXISTS idx_paneles_espacio_pub_id
  ON paneles (espacio_pub_id);

CREATE INDEX IF NOT EXISTS idx_paneles_tipo_epe_id
  ON paneles (tipo_epe_id);

CREATE INDEX IF NOT EXISTS idx_paneles_caracteristica_id
  ON paneles (caracteristica_id);

CREATE INDEX IF NOT EXISTS idx_paneles_material_id
  ON paneles (material_id);

-- ─────────────────────────────────────────────────────────────
-- ÍNDICES DE BÚSQUEDA DE TEXTO
-- Permite buscar "salaverry" y encontrar "AV. SALAVERRY CDRA. 1 / AV. 28 DE JULIO"
-- incluso sin tildes y con coincidencias parciales.
-- pg_trgm divide el texto en "trigramas" (grupos de 3 letras) para buscar rápido.
-- ─────────────────────────────────────────────────────────────

-- Búsqueda en código de panel (ej: buscar "NAP" encuentra todos los códigos con NAP)
CREATE INDEX IF NOT EXISTS idx_paneles_codigo_trgm
  ON paneles USING GIN (codigo gin_trgm_ops);

-- Búsqueda en dirección (ej: buscar "salaverry" en todas las direcciones)
CREATE INDEX IF NOT EXISTS idx_paneles_direccion_trgm
  ON paneles USING GIN (direccion gin_trgm_ops);

-- Búsqueda en FRAP (ej: buscar "NAP2025" encuentra registros FRAP)
CREATE INDEX IF NOT EXISTS idx_paneles_frap_trgm
  ON paneles USING GIN (nro_registro_frap gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────
-- ÍNDICES EN CATÁLOGOS
-- Para búsqueda y normalización de texto durante la importación
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_distritos_nombre_norm
  ON distritos (nombre_norm);

CREATE INDEX IF NOT EXISTS idx_empresas_nombre_norm
  ON empresas (nombre_norm);

CREATE INDEX IF NOT EXISTS idx_tipos_epe_nombre_norm
  ON tipos_epe (nombre_norm);

CREATE INDEX IF NOT EXISTS idx_espacios_pub_nombre_norm
  ON espacios_publicitarios (nombre_norm);

-- ─────────────────────────────────────────────────────────────
-- ÍNDICES EN AUDITORÍA
-- Para buscar el historial de cambios de un panel específico rápidamente
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_auditoria_registro_id
  ON auditoria (registro_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id
  ON auditoria (usuario_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha
  ON auditoria (fecha DESC);  -- DESC porque siempre queremos los cambios más recientes primero

-- ─────────────────────────────────────────────────────────────
-- ÍNDICE EN CONTRATOS
-- Para buscar contratos por número rápidamente
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contratos_numero
  ON contratos (numero_contrato);

CREATE INDEX IF NOT EXISTS idx_contratos_empresa_id
  ON contratos (empresa_id);
