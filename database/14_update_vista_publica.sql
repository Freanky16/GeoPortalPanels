-- ============================================================
-- 14_update_vista_publica.sql
-- Actualiza v_paneles_publicos para incluir dirección, área,
-- FRAP, contrato y estado de vencimiento calculado.
-- ============================================================

-- Eliminar vista previa para permitir reordenar y agregar nuevas columnas
DROP VIEW IF EXISTS v_paneles_publicos CASCADE;

CREATE VIEW v_paneles_publicos AS
SELECT
  p.id,
  p.codigo,
  p.n_excel                                           AS "numeroFila",
  p.latitud,
  p.longitud,
  p.utm_este                                          AS "utmEste",
  p.utm_norte                                         AS "utmNorte",
  p.direccion                                         AS "direccion",
  p.distrito_id                                       AS "distritoId",
  d.nombre                                            AS "distrito",
  p.tipo_via_id                                       AS "tipoViaId",
  tv.nombre                                           AS "tipoVia",
  p.espacio_pub_id                                    AS "espacioPublicitarioId",
  ep.nombre                                           AS "espacioPublicitario",
  p.tipo_epe_id                                       AS "tipoEPEId",
  te.nombre                                           AS "tipoEPE",
  p.caracteristica_id                                 AS "caracteristicaTecnicaId",
  ct.nombre                                           AS "caracteristicaTecnica",
  p.material_id                                       AS "materialPredominanteId",
  m.nombre                                            AS "materialPredominante",
  p.area_ocupacion                                    AS "areaOcupacion",
  p.area_exhibicion                                   AS "areaExhibicion",
  p.altura_poste                                      AS "alturaPoste",
  p.alto,
  p.largo,
  p.espesor,
  p.empresa_id                                        AS "empresaId",
  e.nombre                                            AS "empresa",
  p.contrato_id                                       AS "contratoId",
  tc.nombre                                           AS "tipoContrato",
  c.numero_contrato                                   AS "numeroContrato",
  p.nro_registro_frap                                 AS "registroFRAP",
  c.fecha_suscripcion                                 AS "fechaSuscripcion",
  CASE
    WHEN c.fecha_suscripcion IS NOT NULL
    THEN (c.fecha_suscripcion + (c.plazo_anios || ' years')::INTERVAL)::DATE
    ELSE NULL
  END                                                 AS "fechaVencimiento",
  CASE
    WHEN c.fecha_suscripcion IS NULL THEN 'sin_dato'
    WHEN (c.fecha_suscripcion + (c.plazo_anios || ' years')::INTERVAL)::DATE < CURRENT_DATE
      THEN 'vencido'
    WHEN (c.fecha_suscripcion + (c.plazo_anios || ' years')::INTERVAL)::DATE
         <= (CURRENT_DATE + INTERVAL '60 days')
      THEN 'por_vencer'
    ELSE 'vigente'
  END                                                 AS "estadoContrato"
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

-- Dar permisos de lectura inmediatos
GRANT SELECT ON v_paneles_publicos TO anon, authenticated, service_role;
GRANT SELECT ON v_paneles_detalle TO anon, authenticated, service_role;
