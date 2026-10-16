-- ============================================================
-- 06_vistas.sql
-- Vistas para que el frontend lea los datos fácilmente
-- ============================================================
-- ORDEN DE EJECUCIÓN: 6 de 10
-- INSTRUCCIÓN: Ejecutar DESPUÉS de 05_apoyo.sql
--
-- Las vistas hacen el trabajo pesado:
--   - Resuelven los IDs de catálogos en nombres legibles
--   - Calculan la fecha de vencimiento y el estado del contrato
--   - Devuelven los campos con los mismos nombres que espera el front
--   - Separan los datos públicos de los privados
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- VISTA PRINCIPAL: v_paneles_detalle
-- Esta es la que lee el frontend autenticado (gestores y superadmin).
-- Devuelve UN registro por panel con TODO resuelto:
--   IDs + nombres de catálogos, campos calculados.
--
-- Los alias de columna usan camelCase para coincidir EXACTAMENTE
-- con los tipos del front en src/types/index.ts (interfaz Panel).
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_paneles_detalle AS
SELECT
  -- IDENTIFICACIÓN
  p.id,
  p.codigo,
  p.n_excel                                           AS "numeroFila",

  -- UBICACIÓN
  p.latitud,
  p.longitud,
  p.utm_este                                          AS "utmEste",
  p.utm_norte                                         AS "utmNorte",
  p.direccion,
  p.distrito_id                                       AS "distritoId",
  d.nombre                                            AS "distrito",

  -- TIPO DE VÍA
  p.tipo_via_id                                       AS "tipoViaId",
  tv.nombre                                           AS "tipoVia",

  -- ESPACIO PUBLICITARIO
  p.espacio_pub_id                                    AS "espacioPublicitarioId",
  ep.nombre                                           AS "espacioPublicitario",

  -- TIPO EPE
  p.tipo_epe_id                                       AS "tipoEPEId",
  te.nombre                                           AS "tipoEPE",

  -- CARACTERÍSTICA TÉCNICA
  p.caracteristica_id                                 AS "caracteristicaTecnicaId",
  ct.nombre                                           AS "caracteristicaTecnica",

  -- MATERIAL PREDOMINANTE
  p.material_id                                       AS "materialPredominanteId",
  m.nombre                                            AS "materialPredominante",

  -- MEDIDAS
  p.area_ocupacion                                    AS "areaOcupacion",
  p.area_exhibicion                                   AS "areaExhibicion",
  p.altura_poste                                      AS "alturaPoste",
  p.alto,
  p.largo,
  p.espesor,

  -- EMPRESA
  p.empresa_id                                        AS "empresaId",
  e.nombre                                            AS "empresa",

  -- CONTRATO
  p.contrato_id                                       AS "contratoId",
  tc.nombre                                           AS "tipoContrato",
  c.numero_contrato                                   AS "numeroContrato",
  p.nro_registro_frap                                 AS "registroFRAP",
  c.fecha_suscripcion                                 AS "fechaSuscripcion",

  -- FECHA DE VENCIMIENTO (calculada: suscripción + plazo en años)
  -- Usamos make_date + EXTRACT para sumar años exactos.
  CASE
    WHEN c.fecha_suscripcion IS NOT NULL
    THEN (c.fecha_suscripcion + (c.plazo_anios || ' years')::INTERVAL)::DATE
    ELSE NULL
  END                                                 AS "fechaVencimiento",

  -- ESTADO DEL CONTRATO
  -- Lógica: sin fecha → 'sin_dato', vencido → 'vencido',
  --         ≤ 12 meses → 'por_vencer', resto → 'vigente'
  -- El umbral de 12 meses es el mismo que usa el front (MESES_POR_VENCER = 12)
  CASE
    WHEN c.fecha_suscripcion IS NULL THEN 'sin_dato'
    WHEN (c.fecha_suscripcion + (c.plazo_anios || ' years')::INTERVAL)::DATE < CURRENT_DATE
      THEN 'vencido'
    WHEN (c.fecha_suscripcion + (c.plazo_anios || ' years')::INTERVAL)::DATE
         <= (CURRENT_DATE + INTERVAL '12 months')
      THEN 'por_vencer'
    ELSE 'vigente'
  END                                                 AS "estadoContrato",

  -- CAMPOS EXTRA ÚTILES (no están en el tipo Panel del front, pero los dashboards los usan)
  -- Días restantes hasta vencimiento (negativo si ya venció)
  CASE
    WHEN c.fecha_suscripcion IS NOT NULL
    THEN (c.fecha_suscripcion + (c.plazo_anios || ' years')::INTERVAL)::DATE - CURRENT_DATE
    ELSE NULL
  END                                                 AS "diasRestantes",

  -- Control
  p.activo,
  p.notas,
  p.created_at                                        AS "createdAt",
  p.updated_at                                        AS "updatedAt"

FROM paneles p
  LEFT JOIN distritos             d   ON p.distrito_id     = d.id
  LEFT JOIN tipos_via             tv  ON p.tipo_via_id     = tv.id
  LEFT JOIN espacios_publicitarios ep ON p.espacio_pub_id  = ep.id
  LEFT JOIN tipos_epe             te  ON p.tipo_epe_id     = te.id
  LEFT JOIN caracteristicas_tecnicas ct ON p.caracteristica_id = ct.id
  LEFT JOIN materiales            m   ON p.material_id     = m.id
  LEFT JOIN empresas              e   ON p.empresa_id      = e.id
  LEFT JOIN contratos             c   ON p.contrato_id     = c.id
  LEFT JOIN tipos_contrato        tc  ON c.tipo_contrato_id = tc.id

WHERE p.activo = TRUE
ORDER BY p.codigo;

COMMENT ON VIEW v_paneles_detalle IS 'Vista principal para gestores. Devuelve todos los datos del panel con catálogos resueltos y campos calculados. Los alias coinciden con los tipos del frontend (camelCase).';

-- ─────────────────────────────────────────────────────────────
-- VISTA PÚBLICA: v_paneles_publicos
-- Solo los campos que se pueden mostrar sin login.
-- RLS protege las filas; esta vista protege las columnas.
-- Configuración conservadora (pendiente aprobación de la municipalidad):
--   PÚBLICO:   código, ubicación, distrito, tipo vía, espacio, tipo EPE,
--              característica técnica, material, empresa
--   PRIVADO:   contrato, número contrato, FRAP, fechas, medidas exactas, UTM
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_paneles_publicos AS
SELECT
  p.id,
  p.codigo,
  p.latitud,
  p.longitud,
  d.nombre                                            AS "distrito",
  tv.nombre                                           AS "tipoVia",
  ep.nombre                                           AS "espacioPublicitario",
  te.nombre                                           AS "tipoEPE",
  ct.nombre                                           AS "caracteristicaTecnica",
  m.nombre                                            AS "materialPredominante",
  e.nombre                                            AS "empresa"
  -- NOTA: contrato, FRAP, fechas, medidas y UTM deliberadamente excluidos.
  -- Para cambiar qué es público, editar solo esta vista (sin tocar el resto del esquema).

FROM paneles p
  LEFT JOIN distritos             d   ON p.distrito_id     = d.id
  LEFT JOIN tipos_via             tv  ON p.tipo_via_id     = tv.id
  LEFT JOIN espacios_publicitarios ep ON p.espacio_pub_id  = ep.id
  LEFT JOIN tipos_epe             te  ON p.tipo_epe_id     = te.id
  LEFT JOIN caracteristicas_tecnicas ct ON p.caracteristica_id = ct.id
  LEFT JOIN materiales            m   ON p.material_id     = m.id
  LEFT JOIN empresas              e   ON p.empresa_id      = e.id

WHERE p.activo = TRUE
ORDER BY p.codigo;

COMMENT ON VIEW v_paneles_publicos IS 'Vista pública. Solo los campos aprobados para acceso sin login. Para cambiar qué es público, editar SOLO esta vista.';

-- ─────────────────────────────────────────────────────────────
-- VISTA: v_catalogos_activos
-- Devuelve todos los catálogos en una sola consulta para el front.
-- El front la usa para llenar los filtros del panel lateral.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_catalogos_activos AS
SELECT 'distrito'            AS tipo, id, nombre FROM distritos             WHERE activo = TRUE
UNION ALL
SELECT 'empresa'             AS tipo, id, nombre FROM empresas               WHERE activo = TRUE
UNION ALL
SELECT 'tipo_via'            AS tipo, id, nombre FROM tipos_via              WHERE activo = TRUE
UNION ALL
SELECT 'espacio_pub'         AS tipo, id, nombre FROM espacios_publicitarios WHERE activo = TRUE
UNION ALL
SELECT 'tipo_epe'            AS tipo, id, nombre FROM tipos_epe              WHERE activo = TRUE
UNION ALL
SELECT 'caracteristica'      AS tipo, id, nombre FROM caracteristicas_tecnicas WHERE activo = TRUE
UNION ALL
SELECT 'material'            AS tipo, id, nombre FROM materiales             WHERE activo = TRUE
UNION ALL
SELECT 'tipo_contrato'       AS tipo, id, nombre FROM tipos_contrato         WHERE activo = TRUE
ORDER BY tipo, nombre;

COMMENT ON VIEW v_catalogos_activos IS 'Todos los catálogos activos en un solo SELECT. El frontend lo usa para poblar los filtros del panel lateral.';

-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN: conteo_por_distrito
-- Para los gráficos del dashboard cuando el volumen sea grande.
-- El front actualmente hace este cálculo en el cliente (está bien para 1,249 paneles).
-- Esta función queda lista para cuando el dataset crezca.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION conteo_por_distrito()
RETURNS TABLE(distrito TEXT, total BIGINT)
LANGUAGE SQL
STABLE
AS $$
  SELECT d.nombre, COUNT(p.id) AS total
  FROM paneles p
  JOIN distritos d ON p.distrito_id = d.id
  WHERE p.activo = TRUE
  GROUP BY d.nombre
  ORDER BY total DESC;
$$;

CREATE OR REPLACE FUNCTION conteo_por_tipo_epe()
RETURNS TABLE(tipo_epe TEXT, total BIGINT)
LANGUAGE SQL
STABLE
AS $$
  SELECT te.nombre, COUNT(p.id) AS total
  FROM paneles p
  JOIN tipos_epe te ON p.tipo_epe_id = te.id
  WHERE p.activo = TRUE
  GROUP BY te.nombre
  ORDER BY total DESC;
$$;

CREATE OR REPLACE FUNCTION conteo_por_empresa()
RETURNS TABLE(empresa TEXT, total BIGINT)
LANGUAGE SQL
STABLE
AS $$
  SELECT e.nombre, COUNT(p.id) AS total
  FROM paneles p
  JOIN empresas e ON p.empresa_id = e.id
  WHERE p.activo = TRUE
  GROUP BY e.nombre
  ORDER BY total DESC;
$$;

CREATE OR REPLACE FUNCTION conteo_por_estado_contrato()
RETURNS TABLE(estado TEXT, total BIGINT)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    CASE
      WHEN c.fecha_suscripcion IS NULL THEN 'sin_dato'
      WHEN (c.fecha_suscripcion + (c.plazo_anios || ' years')::INTERVAL)::DATE < CURRENT_DATE THEN 'vencido'
      WHEN (c.fecha_suscripcion + (c.plazo_anios || ' years')::INTERVAL)::DATE <= (CURRENT_DATE + INTERVAL '12 months') THEN 'por_vencer'
      ELSE 'vigente'
    END AS estado,
    COUNT(p.id) AS total
  FROM paneles p
  LEFT JOIN contratos c ON p.contrato_id = c.id
  WHERE p.activo = TRUE
  GROUP BY 1
  ORDER BY total DESC;
$$;
