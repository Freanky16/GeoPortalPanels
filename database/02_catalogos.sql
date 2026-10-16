-- ============================================================
-- 02_catalogos.sql
-- Tablas de catálogos (tablas maestras pequeñas)
-- ============================================================
-- ORDEN DE EJECUCIÓN: 2 de 10
-- INSTRUCCIÓN: Ejecutar DESPUÉS de 01_extensions.sql
-- Estas tablas guardan los valores fijos (distritos, empresas, etc.)
-- que alimentan los filtros del mapa.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN AUXILIAR: normalizar texto
-- Convierte "  Jesús María  " → "JESUS MARIA"
-- Se usa al insertar y al comparar durante la importación.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION normalizar_texto(texto TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
STRICT
AS $$
  SELECT UPPER(TRIM(REGEXP_REPLACE(unaccent(texto), '\s+', ' ', 'g')))
$$;

-- ─────────────────────────────────────────────────────────────
-- TABLA: distritos
-- Los 43 distritos de Lima Metropolitana
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS distritos (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           TEXT          NOT NULL,             -- Con tildes: "Jesús María"
  nombre_norm      TEXT          NOT NULL UNIQUE,      -- Sin tildes: "JESUS MARIA"
  ubigeo           CHAR(6),                            -- Código INEI (opcional, futuro)
  activo           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE distritos IS 'Los 43 distritos de Lima Metropolitana. No se insertan manualmente desde el front: se cargan desde el seed SQL.';
COMMENT ON COLUMN distritos.nombre IS 'Nombre oficial con tildes, tal como aparece en documentos municipales.';
COMMENT ON COLUMN distritos.nombre_norm IS 'Nombre normalizado (mayúsculas, sin tildes) para comparar sin que los errores tipográficos rompan la búsqueda.';

-- ─────────────────────────────────────────────────────────────
-- TABLA: empresas
-- Las empresas de publicidad exterior
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresas (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           TEXT          NOT NULL,
  nombre_norm      TEXT          NOT NULL,             -- Para comparar; NO unique porque hay duplicados a resolver
  ruc              CHAR(11),                           -- Futuro (cuando la municipalidad lo provea)
  activo           BOOLEAN       NOT NULL DEFAULT TRUE,
  notas            TEXT,                               -- Para anotar los casos dudosos (ej: "posible duplicado de empresa_id=...")
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE empresas IS 'Empresas de publicidad exterior. Hay duplicados por resolver (ej: INPUT vs INPUT S.A.C.). Ver columna notas.';

-- ─────────────────────────────────────────────────────────────
-- TABLA: tipos_via
-- Colectora, Arterial, Expresa, Intercambio
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipos_via (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           TEXT          NOT NULL UNIQUE,
  nombre_norm      TEXT          NOT NULL UNIQUE,
  activo           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: espacios_publicitarios
-- Franja de vereda, Separador lateral, Túnel, etc.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS espacios_publicitarios (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           TEXT          NOT NULL UNIQUE,
  nombre_norm      TEXT          NOT NULL UNIQUE,
  activo           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: tipos_epe
-- Panel monumental, Tótem, Paleta publicitaria, etc.
-- EPE = Elemento de Publicidad Exterior
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipos_epe (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           TEXT          NOT NULL UNIQUE,
  nombre_norm      TEXT          NOT NULL UNIQUE,
  activo           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: caracteristicas_tecnicas
-- Luminoso, Iluminado, Especial, Sencillo
-- Un panel tiene UNA sola característica (FK simple).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caracteristicas_tecnicas (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           TEXT          NOT NULL UNIQUE,
  nombre_norm      TEXT          NOT NULL UNIQUE,
  activo           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: materiales
-- Vidrio, Madera, Lona, Acrílico, Backlight Film, Otro...
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materiales (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           TEXT          NOT NULL UNIQUE,
  nombre_norm      TEXT          NOT NULL UNIQUE,
  activo           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: tipos_contrato
-- Reordenamiento, Puntos Nuevos, (otros que aparezcan)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipos_contrato (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           TEXT          NOT NULL UNIQUE,
  nombre_norm      TEXT          NOT NULL UNIQUE,
  activo           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
