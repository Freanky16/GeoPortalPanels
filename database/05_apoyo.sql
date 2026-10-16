-- ============================================================
-- 05_apoyo.sql
-- Tablas de apoyo: perfiles, auditoría, importaciones, staging
-- ============================================================
-- ORDEN DE EJECUCIÓN: 5 de 10
-- INSTRUCCIÓN: Ejecutar DESPUÉS de 04_paneles.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLA: perfiles
-- Un perfil por cada usuario que tiene login.
-- Su ID es EL MISMO que el ID del usuario en auth.users de Supabase.
-- Permite desactivar a alguien al instante sin tocar su cuenta de auth.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfiles (
  -- El id aquí ES el mismo id que Supabase Auth asigna al usuario.
  -- Cuando alguien se registra, un trigger lo inserta aquí automáticamente.
  id          UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      TEXT          NOT NULL,
  email       TEXT          NOT NULL,

  -- Roles del sistema:
  --   superadmin → puede gestionar usuarios, ver todo, cambiar cualquier cosa
  --   gestor     → puede crear, editar e importar paneles
  --   (sin perfil → acceso público de solo lectura)
  rol         TEXT          NOT NULL DEFAULT 'gestor'
              CHECK (rol IN ('superadmin', 'gestor')),

  activo      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE perfiles IS 'Un registro por usuario con login. El id coincide con auth.users. Desactivar activo=false niega el acceso sin borrar la cuenta.';

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: crear perfil automáticamente cuando alguien se registra
-- (Solo para usuarios invitados por el superadmin)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION crear_perfil_automatico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER   -- Corre con permisos del sistema, no del usuario que se registra
SET search_path = public
AS $$
BEGIN
  INSERT INTO perfiles (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'gestor')
  )
  ON CONFLICT (id) DO NOTHING;  -- Si ya existe, no hace nada (seguridad)
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION crear_perfil_automatico();

-- ─────────────────────────────────────────────────────────────
-- TABLA: auditoria
-- Registro automático de cada cambio en paneles, contratos y catálogos.
-- Se llena por triggers, NUNCA desde el front.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria (
  id            BIGSERIAL     PRIMARY KEY,
  tabla         TEXT          NOT NULL,          -- Ej: 'paneles', 'contratos'
  registro_id   UUID          NOT NULL,          -- El id del registro que cambió
  accion        TEXT          NOT NULL           -- 'INSERT', 'UPDATE', 'DELETE'
                CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  datos_antes   JSONB,                           -- Fila ANTES del cambio (null en INSERT)
  datos_despues JSONB,                           -- Fila DESPUÉS del cambio (null en DELETE)
  usuario_id    UUID          REFERENCES auth.users(id),
  fecha         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE auditoria IS 'Historial de cambios. Se llena automáticamente por triggers. Permite saber quién cambió qué y cuándo, y restaurar datos si hay un error.';

-- Función genérica de auditoría (reutilizable en cualquier tabla)
CREATE OR REPLACE FUNCTION trigger_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_antes, datos_despues, usuario_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', NULL, to_jsonb(NEW), auth.uid());

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_antes, datos_despues, usuario_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_antes, datos_despues, usuario_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), NULL, auth.uid());
  END IF;

  RETURN NULL; -- En triggers AFTER, el valor de retorno no importa
END;
$$;

-- Activar auditoría en paneles
CREATE OR REPLACE TRIGGER auditoria_paneles
  AFTER INSERT OR UPDATE OR DELETE ON paneles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auditoria();

-- Activar auditoría en contratos
CREATE OR REPLACE TRIGGER auditoria_contratos
  AFTER INSERT OR UPDATE OR DELETE ON contratos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auditoria();

-- ─────────────────────────────────────────────────────────────
-- TABLA: importaciones
-- Registro de cada carga de datos desde el Excel.
-- Permite saber qué se cargó, cuándo y si hubo errores.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS importaciones (
  id              BIGSERIAL     PRIMARY KEY,
  nombre_archivo  TEXT          NOT NULL,          -- Ej: "paneles_lote_001.xlsx"
  fecha           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  usuario_id      UUID          REFERENCES auth.users(id),
  total_filas     INTEGER       NOT NULL DEFAULT 0,
  insertadas      INTEGER       NOT NULL DEFAULT 0,
  actualizadas    INTEGER       NOT NULL DEFAULT 0,
  rechazadas      INTEGER       NOT NULL DEFAULT 0,

  -- JSON con la lista de errores. Ej:
  -- [{"fila": 5, "codigo": "1_NAP", "error": "Distrito 'JESUS MRIA' no encontrado"}]
  errores         JSONB         DEFAULT '[]'::jsonb,

  -- 'simulacion' = dry-run (no se guardó nada)
  -- 'completada' = se guardó exitosamente
  -- 'fallida'    = se abortó por error crítico
  estado          TEXT          NOT NULL DEFAULT 'simulacion'
                  CHECK (estado IN ('simulacion', 'completada', 'fallida'))
);

COMMENT ON TABLE importaciones IS 'Historial de importaciones desde Excel. Cada carga (incluyendo simulaciones) queda registrada aquí.';

-- ─────────────────────────────────────────────────────────────
-- TABLA: stg_paneles_import
-- Tabla de staging (área de preparación) para la importación.
-- Todas las columnas son TEXT para aceptar cualquier valor del Excel sin error.
-- El script de importación valida aquí antes de pasar a la tabla paneles.
-- Se limpia antes de cada importación nueva.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stg_paneles_import (
  id                  BIGSERIAL   PRIMARY KEY,
  importacion_id      BIGINT      REFERENCES importaciones(id),
  fila_excel          INTEGER,    -- Número de fila en el Excel (para reportar errores)

  -- Todos los campos como TEXT (exactamente como llegan del Excel)
  n_excel             TEXT,
  codigo              TEXT,
  empresa             TEXT,
  tipo_via            TEXT,
  espacio_pub         TEXT,
  distrito            TEXT,
  tipo_epe            TEXT,
  caracteristica      TEXT,
  material            TEXT,
  area_ocupacion      TEXT,
  area_exhibicion     TEXT,
  altura_poste        TEXT,
  alto                TEXT,
  largo               TEXT,
  espesor             TEXT,
  tipo_contrato       TEXT,
  numero_contrato     TEXT,
  nro_registro_frap   TEXT,
  fecha_suscripcion   TEXT,       -- Viene como DD/MM/YYYY desde el Excel
  latitud             TEXT,
  longitud            TEXT,
  utm_este            TEXT,
  utm_norte           TEXT,
  utm_zona            TEXT,
  direccion           TEXT,

  -- Estado de validación de esta fila (lo llena el script)
  valido              BOOLEAN     DEFAULT NULL,   -- NULL = no validado aún
  errores_validacion  JSONB       DEFAULT '[]'::jsonb
);

COMMENT ON TABLE stg_paneles_import IS 'Área de staging para importación. Todas las columnas son TEXT para aceptar cualquier valor del Excel sin error de tipo. Se limpia antes de cada importación nueva.';
