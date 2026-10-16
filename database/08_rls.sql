-- ============================================================
-- 08_rls.sql
-- Row Level Security (RLS) — Seguridad a nivel de fila
-- ============================================================
-- ORDEN DE EJECUCIÓN: 8 de 10
-- INSTRUCCIÓN: Ejecutar DESPUÉS de 07_indices.sql
--
-- RLS es la seguridad más importante. Aunque alguien tenga la clave
-- pública (anon key), SOLO puede leer lo que las políticas permiten.
--
-- Niveles de acceso:
--   Nivel 0 — Público (sin login):
--     Solo puede leer v_paneles_publicos y v_catalogos_activos
--
--   Nivel 1 — Gestor (con login, rol = 'gestor', activo = true):
--     Lee TODO en v_paneles_detalle
--     Puede insertar y editar paneles, contratos e importaciones
--     NO puede tocar perfiles de otros usuarios ni eliminar registros
--
--   Nivel 2 — Superadmin (con login, rol = 'superadmin', activo = true):
--     Acceso completo a todo
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN AUXILIAR: verificar rol activo del usuario actual
-- Evita repetir la misma lógica en cada política.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION es_gestor_activo()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
      AND activo = TRUE
      AND rol IN ('gestor', 'superadmin')
  )
$$;

CREATE OR REPLACE FUNCTION es_superadmin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
      AND activo = TRUE
      AND rol = 'superadmin'
  )
$$;

-- ─────────────────────────────────────────────────────────────
-- ACTIVAR RLS EN TODAS LAS TABLAS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE paneles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE distritos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_via                ENABLE ROW LEVEL SECURITY;
ALTER TABLE espacios_publicitarios   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_epe                ENABLE ROW LEVEL SECURITY;
ALTER TABLE caracteristicas_tecnicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiales               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_contrato           ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria                ENABLE ROW LEVEL SECURITY;
ALTER TABLE importaciones            ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_paneles_import       ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- POLÍTICAS: PANELES
-- ─────────────────────────────────────────────────────────────

-- Público NO puede leer la tabla paneles directamente.
-- Solo puede leer la VISTA v_paneles_publicos (que tiene menos columnas).
-- Las vistas en Supabase se ejecutan con los permisos del rol de la vista,
-- no del usuario, así que la vista pública sí devuelve datos.

-- Los gestores pueden leer todo
CREATE POLICY "gestores_leen_paneles"
  ON paneles FOR SELECT
  USING (es_gestor_activo());

-- Los gestores pueden insertar paneles
CREATE POLICY "gestores_insertan_paneles"
  ON paneles FOR INSERT
  WITH CHECK (es_gestor_activo());

-- Los gestores pueden actualizar paneles (pero no borrarlos)
CREATE POLICY "gestores_actualizan_paneles"
  ON paneles FOR UPDATE
  USING (es_gestor_activo())
  WITH CHECK (es_gestor_activo());

-- Solo superadmin puede eliminar (y se recomienda usar activo=false en lugar de DELETE)
CREATE POLICY "superadmin_elimina_paneles"
  ON paneles FOR DELETE
  USING (es_superadmin());

-- ─────────────────────────────────────────────────────────────
-- POLÍTICAS: CONTRATOS
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "gestores_leen_contratos"
  ON contratos FOR SELECT
  USING (es_gestor_activo());

CREATE POLICY "gestores_insertan_contratos"
  ON contratos FOR INSERT
  WITH CHECK (es_gestor_activo());

CREATE POLICY "gestores_actualizan_contratos"
  ON contratos FOR UPDATE
  USING (es_gestor_activo())
  WITH CHECK (es_gestor_activo());

CREATE POLICY "superadmin_elimina_contratos"
  ON contratos FOR DELETE
  USING (es_superadmin());

-- ─────────────────────────────────────────────────────────────
-- POLÍTICAS: CATÁLOGOS (todos siguen el mismo patrón)
-- Lectura: cualquier persona autenticada (anon también en prod, pero
-- a través de la vista, no directamente)
-- Escritura: solo gestores activos
-- ─────────────────────────────────────────────────────────────

-- Para cada catálogo: gestores leen y superadmin escribe
-- (Los catálogos no se modifican frecuentemente; si necesitas agregar un distrito,
--  lo hace el superadmin directamente en Supabase o mediante un formulario futuro)

CREATE POLICY "gestores_leen_distritos"
  ON distritos FOR SELECT
  USING (es_gestor_activo());

CREATE POLICY "superadmin_escribe_distritos"
  ON distritos FOR ALL
  USING (es_superadmin())
  WITH CHECK (es_superadmin());

CREATE POLICY "gestores_leen_empresas"
  ON empresas FOR SELECT
  USING (es_gestor_activo());

CREATE POLICY "superadmin_escribe_empresas"
  ON empresas FOR ALL
  USING (es_superadmin())
  WITH CHECK (es_superadmin());

-- (Repetir patrón para el resto de catálogos)
CREATE POLICY "gestores_leen_tipos_via"
  ON tipos_via FOR SELECT USING (es_gestor_activo());
CREATE POLICY "superadmin_escribe_tipos_via"
  ON tipos_via FOR ALL USING (es_superadmin()) WITH CHECK (es_superadmin());

CREATE POLICY "gestores_leen_espacios_pub"
  ON espacios_publicitarios FOR SELECT USING (es_gestor_activo());
CREATE POLICY "superadmin_escribe_espacios_pub"
  ON espacios_publicitarios FOR ALL USING (es_superadmin()) WITH CHECK (es_superadmin());

CREATE POLICY "gestores_leen_tipos_epe"
  ON tipos_epe FOR SELECT USING (es_gestor_activo());
CREATE POLICY "superadmin_escribe_tipos_epe"
  ON tipos_epe FOR ALL USING (es_superadmin()) WITH CHECK (es_superadmin());

CREATE POLICY "gestores_leen_caracteristicas"
  ON caracteristicas_tecnicas FOR SELECT USING (es_gestor_activo());
CREATE POLICY "superadmin_escribe_caracteristicas"
  ON caracteristicas_tecnicas FOR ALL USING (es_superadmin()) WITH CHECK (es_superadmin());

CREATE POLICY "gestores_leen_materiales"
  ON materiales FOR SELECT USING (es_gestor_activo());
CREATE POLICY "superadmin_escribe_materiales"
  ON materiales FOR ALL USING (es_superadmin()) WITH CHECK (es_superadmin());

CREATE POLICY "gestores_leen_tipos_contrato"
  ON tipos_contrato FOR SELECT USING (es_gestor_activo());
CREATE POLICY "superadmin_escribe_tipos_contrato"
  ON tipos_contrato FOR ALL USING (es_superadmin()) WITH CHECK (es_superadmin());

-- ─────────────────────────────────────────────────────────────
-- POLÍTICAS: PERFILES
-- ─────────────────────────────────────────────────────────────

-- Cada gestor puede ver su propio perfil
CREATE POLICY "perfil_propio"
  ON perfiles FOR SELECT
  USING (id = auth.uid());

-- El superadmin ve y modifica todos los perfiles
CREATE POLICY "superadmin_gestiona_perfiles"
  ON perfiles FOR ALL
  USING (es_superadmin())
  WITH CHECK (es_superadmin());

-- ─────────────────────────────────────────────────────────────
-- POLÍTICAS: AUDITORÍA
-- ─────────────────────────────────────────────────────────────

-- Solo gestores pueden leer el historial
CREATE POLICY "gestores_leen_auditoria"
  ON auditoria FOR SELECT
  USING (es_gestor_activo());

-- NADIE puede insertar/modificar/borrar manualmente la auditoría
-- (los triggers usan SECURITY DEFINER, que bypasea el RLS)

-- ─────────────────────────────────────────────────────────────
-- POLÍTICAS: IMPORTACIONES
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "gestores_leen_importaciones"
  ON importaciones FOR SELECT
  USING (es_gestor_activo());

CREATE POLICY "gestores_insertan_importaciones"
  ON importaciones FOR INSERT
  WITH CHECK (es_gestor_activo());

-- Solo el mismo gestor puede actualizar su importación
CREATE POLICY "gestor_actualiza_su_importacion"
  ON importaciones FOR UPDATE
  USING (es_gestor_activo() AND (usuario_id = auth.uid() OR es_superadmin()))
  WITH CHECK (es_gestor_activo());

-- ─────────────────────────────────────────────────────────────
-- POLÍTICAS: STAGING
-- Solo gestores pueden usarla
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "gestores_usan_staging"
  ON stg_paneles_import FOR ALL
  USING (es_gestor_activo())
  WITH CHECK (es_gestor_activo());

-- ─────────────────────────────────────────────────────────────
-- ACCESO PÚBLICO A LAS VISTAS
-- Las vistas necesitan permisos explícitos para el rol anon.
-- ─────────────────────────────────────────────────────────────

-- Permitir que usuarios no autenticados lean la vista pública
GRANT SELECT ON v_paneles_publicos    TO anon;
GRANT SELECT ON v_catalogos_activos   TO anon;

-- Los gestores (authenticated) pueden leer la vista completa
GRANT SELECT ON v_paneles_detalle     TO authenticated;
GRANT SELECT ON v_catalogos_activos   TO authenticated;

-- Permisos en tablas base para usuarios autenticados (el RLS limita qué ven)
GRANT SELECT, INSERT, UPDATE ON paneles               TO authenticated;
GRANT SELECT, INSERT, UPDATE ON contratos             TO authenticated;
GRANT SELECT ON distritos                             TO authenticated;
GRANT SELECT ON empresas                              TO authenticated;
GRANT SELECT ON tipos_via                             TO authenticated;
GRANT SELECT ON espacios_publicitarios                TO authenticated;
GRANT SELECT ON tipos_epe                             TO authenticated;
GRANT SELECT ON caracteristicas_tecnicas              TO authenticated;
GRANT SELECT ON materiales                            TO authenticated;
GRANT SELECT ON tipos_contrato                        TO authenticated;
GRANT SELECT ON auditoria                             TO authenticated;
GRANT SELECT, INSERT, UPDATE ON importaciones         TO authenticated;
GRANT ALL ON stg_paneles_import                       TO authenticated;
GRANT SELECT ON perfiles                              TO authenticated;

-- Secuencias (para BIGSERIAL en tablas de apoyo)
GRANT USAGE ON SEQUENCE auditoria_id_seq              TO authenticated;
GRANT USAGE ON SEQUENCE importaciones_id_seq          TO authenticated;
GRANT USAGE ON SEQUENCE stg_paneles_import_id_seq     TO authenticated;
