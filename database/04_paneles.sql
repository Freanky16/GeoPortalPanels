-- ============================================================
-- 04_paneles.sql
-- Tabla central de paneles publicitarios (EPE)
-- ============================================================
-- ORDEN DE EJECUCIÓN: 4 de 10
-- INSTRUCCIÓN: Ejecutar DESPUÉS de 03_contratos.sql
-- Esta es la tabla más importante del sistema.
-- Solo 4 campos son obligatorios: codigo, latitud, longitud, distrito_id
-- ============================================================

CREATE TABLE IF NOT EXISTS paneles (
  -- ─────────────────────────────────────────────────────────
  -- IDENTIFICACIÓN
  -- ─────────────────────────────────────────────────────────
  id                       UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Código oficial asignado por la municipalidad. Ej: "1_NAP", "42_CCH"
  -- Es ÚNICO e INMUTABLE: no cambia aunque se reordene el Excel.
  codigo                   TEXT          NOT NULL UNIQUE,

  -- Número de fila del Excel original (solo referencial, puede cambiar)
  n_excel                  INTEGER,

  -- ─────────────────────────────────────────────────────────
  -- UBICACIÓN GEOGRÁFICA
  -- ─────────────────────────────────────────────────────────

  -- Coordenadas WGS84 (las que usa el mapa y GPS)
  latitud                  NUMERIC(10, 7) NOT NULL
                           CHECK (latitud  BETWEEN -90  AND 90),
  longitud                 NUMERIC(10, 7) NOT NULL
                           CHECK (longitud BETWEEN -180 AND 180),

  -- Punto geográfico PostGIS, generado automáticamente desde lat/lon.
  -- El SRID 4326 es el estándar WGS84 (el mismo que Google Maps y GPS).
  -- Se actualiza por trigger cuando cambian latitud o longitud.
  geom                     GEOMETRY(Point, 4326)
                           GENERATED ALWAYS AS (
                             ST_SetSRID(ST_MakePoint(longitud, latitud), 4326)
                           ) STORED,

  -- Coordenadas UTM (zona 18 Sur) — dato oficial de origen, se guarda tal cual
  utm_este                 NUMERIC(10, 2),
  utm_norte                NUMERIC(10, 2),
  utm_zona                 TEXT          DEFAULT '18S',

  -- Dirección de texto libre. Se importa tal cual, incluyendo notas entre paréntesis.
  -- Ej: "AV. SALAVERRY CDRA. 1 / AV. 28 DE JULIO CDRA. 6"
  direccion                TEXT,

  -- Distrito (obligatorio)
  distrito_id              UUID          NOT NULL REFERENCES distritos(id),

  -- ─────────────────────────────────────────────────────────
  -- CLASIFICACIÓN (catálogos, todos opcionales)
  -- ─────────────────────────────────────────────────────────
  tipo_via_id              UUID          REFERENCES tipos_via(id),
  espacio_pub_id           UUID          REFERENCES espacios_publicitarios(id),
  tipo_epe_id              UUID          REFERENCES tipos_epe(id),
  caracteristica_id        UUID          REFERENCES caracteristicas_tecnicas(id),
  material_id              UUID          REFERENCES materiales(id),

  -- ─────────────────────────────────────────────────────────
  -- MEDIDAS (todas opcionales, en metros o metros cuadrados)
  -- ─────────────────────────────────────────────────────────
  area_ocupacion           NUMERIC(8, 2) CHECK (area_ocupacion   > 0),  -- m²
  area_exhibicion          NUMERIC(8, 2) CHECK (area_exhibicion  > 0),  -- m²
  altura_poste             NUMERIC(6, 2) CHECK (altura_poste     > 0),  -- m
  alto                     NUMERIC(6, 2) CHECK (alto             > 0),  -- m
  largo                    NUMERIC(6, 2) CHECK (largo            > 0),  -- m
  espesor                  NUMERIC(6, 2) CHECK (espesor          > 0),  -- m

  -- ─────────────────────────────────────────────────────────
  -- EMPRESA Y CONTRATO
  -- ─────────────────────────────────────────────────────────

  -- La empresa va en el panel DIRECTAMENTE (el Excel la incluye incluso
  -- cuando no hay contrato asociado todavía).
  empresa_id               UUID          REFERENCES empresas(id),

  -- El contrato es opcional (hay paneles sin contrato asignado aún).
  contrato_id              UUID          REFERENCES contratos(id),

  -- Número de registro FRAP (propio del panel, no del contrato).
  -- Ej: "NAP202512-0001"
  nro_registro_frap        TEXT,

  -- ─────────────────────────────────────────────────────────
  -- CONTROL Y AUDITORÍA
  -- ─────────────────────────────────────────────────────────
  activo                   BOOLEAN       NOT NULL DEFAULT TRUE,
  notas                    TEXT,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Quién creó/editó el registro (referencia a auth.users de Supabase)
  created_by               UUID          REFERENCES auth.users(id),
  updated_by               UUID          REFERENCES auth.users(id),

  -- ─────────────────────────────────────────────────────────
  -- RESTRICCIÓN DE CONSISTENCIA EMPRESA-CONTRATO
  -- Si hay contrato, la empresa del panel debe coincidir con la del contrato.
  -- Esta validación se hace en el trigger de abajo (no puede hacerse en CHECK
  -- porque requiere consultar otra tabla).
  -- ─────────────────────────────────────────────────────────
  CONSTRAINT empresa_contrato_consistente
    CHECK (contrato_id IS NULL OR empresa_id IS NOT NULL)
    -- La validación completa (que empresa_id = contrato.empresa_id) está en el trigger.
);

COMMENT ON TABLE paneles IS 'Tabla central. Cada fila es un panel de publicidad exterior (EPE) en Lima. Solo codigo, latitud, longitud y distrito_id son obligatorios.';
COMMENT ON COLUMN paneles.codigo IS 'Código oficial asignado por la municipalidad. Único e inmutable. Ej: "1_NAP".';
COMMENT ON COLUMN paneles.geom IS 'Punto geográfico PostGIS generado automáticamente desde latitud y longitud. No se edita directamente.';
COMMENT ON COLUMN paneles.n_excel IS 'Número de fila en el Excel original. Solo referencial: puede cambiar si se reordena el Excel.';
COMMENT ON COLUMN paneles.nro_registro_frap IS 'Número de registro FRAP propio del panel (no del contrato). Ej: "NAP202512-0001".';

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: actualizar updated_at automáticamente
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER paneles_updated_at
  BEFORE UPDATE ON paneles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Lo mismo para contratos
CREATE OR REPLACE TRIGGER contratos_updated_at
  BEFORE UPDATE ON contratos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: verificar que empresa_id del panel coincida con la del contrato
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION verificar_empresa_contrato()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_empresa_contrato UUID;
BEGIN
  -- Solo verificamos si hay contrato asignado
  IF NEW.contrato_id IS NOT NULL THEN
    SELECT empresa_id INTO v_empresa_contrato
    FROM contratos
    WHERE id = NEW.contrato_id;

    IF v_empresa_contrato IS DISTINCT FROM NEW.empresa_id THEN
      RAISE EXCEPTION
        'La empresa del panel (%) no coincide con la empresa del contrato (%). Panel: %, Contrato: %',
        NEW.empresa_id, v_empresa_contrato, NEW.codigo, NEW.contrato_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER paneles_verificar_empresa
  BEFORE INSERT OR UPDATE ON paneles
  FOR EACH ROW
  EXECUTE FUNCTION verificar_empresa_contrato();
