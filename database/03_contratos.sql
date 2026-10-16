-- ============================================================
-- 03_contratos.sql
-- Tabla de contratos municipales
-- ============================================================
-- ORDEN DE EJECUCIÓN: 3 de 10
-- INSTRUCCIÓN: Ejecutar DESPUÉS de 02_catalogos.sql
-- Un contrato puede cubrir varios paneles (relación 1:N).
-- El vencimiento NO se guarda: se calcula en la vista con
--   fecha_suscripcion + plazo_anios
-- ============================================================

CREATE TABLE IF NOT EXISTS contratos (
  id                   UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Número oficial del contrato (ej: "0001-2025-R")
  -- Nota: el Excel muestra que un mismo número puede cubrir múltiples paneles.
  -- Por ahora no ponemos UNIQUE aquí porque necesitamos verificar con el Excel
  -- completo si el número es único POR empresa o globalmente.
  numero_contrato      TEXT          NOT NULL,

  tipo_contrato_id     UUID          REFERENCES tipos_contrato(id),
  empresa_id           UUID          NOT NULL REFERENCES empresas(id),

  -- Fecha en que se firmó el contrato (viene del Excel como DD/MM/YYYY,
  -- el script de importación la convierte a formato ISO)
  fecha_suscripcion    DATE,

  -- Plazo en años. Por defecto 5, como en el Excel actual.
  -- Si en el futuro hay contratos de 3 o 10 años, se cambia fila por fila.
  plazo_anios          SMALLINT      NOT NULL DEFAULT 5
                       CHECK (plazo_anios > 0 AND plazo_anios <= 99),

  -- Campos de control
  notas                TEXT,
  activo               BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE contratos IS 'Contratos entre la municipalidad y las empresas de publicidad exterior. Un contrato puede cubrir varios paneles.';
COMMENT ON COLUMN contratos.numero_contrato IS 'Número oficial del contrato. Ej: "0001-2025-R". Pendiente verificar con el Excel completo si es único globalmente o por empresa.';
COMMENT ON COLUMN contratos.plazo_anios IS 'Plazo del contrato en años. La fecha de vencimiento se calcula en la vista: fecha_suscripcion + plazo_anios.';
