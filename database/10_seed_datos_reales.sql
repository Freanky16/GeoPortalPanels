-- ============================================================
-- 10_seed_datos_reales.sql
-- Datos reales de prueba: 10 paneles de la imagen del Excel
-- ============================================================
-- ORDEN DE EJECUCIÓN: 10 de 10 (ÚLTIMO)
-- INSTRUCCIÓN: Ejecutar DESPUÉS de 09_seed_catalogos.sql
--
-- Este archivo inserta los 10 paneles reales de la primera muestra.
-- Es para probar que la BD funciona bien antes de importar el lote completo.
-- Cuando tengas el script de importación (Node.js), NO necesitarás
-- insertar datos manualmente — el script lo hace por ti.
--
-- IMPORTANTE: Las coordenadas de estas 10 filas NO están en el Excel
-- de la imagen. He puesto coordenadas de referencia para Jesús María
-- (donde están todos estos paneles). El script de importación real
-- tomará las coordenadas exactas del Excel completo.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PASO 1: Insertar el contrato que cubría los 10 paneles
-- Contrato: 0001-2025-R | Empresa: PANELES NAPSA S.R.L. | Reordenamiento
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_empresa_id     UUID;
  v_tipo_cont_id   UUID;
  v_contrato_id    UUID;
  v_distrito_id    UUID;
  v_tipo_epe_id    UUID;
  v_caract_id      UUID;
  v_material_id    UUID;
BEGIN

  -- Obtener IDs de catálogos (buscamos por nombre_norm para ser robustos)
  SELECT id INTO v_empresa_id       FROM empresas WHERE nombre_norm = 'PANELES NAPSA SRL' LIMIT 1;
  SELECT id INTO v_tipo_cont_id     FROM tipos_contrato WHERE nombre_norm = 'REORDENAMIENTO';
  SELECT id INTO v_distrito_id      FROM distritos WHERE nombre_norm = 'JESUS MARIA';
  SELECT id INTO v_tipo_epe_id      FROM tipos_epe WHERE nombre_norm = 'PALETA PUBLICITARIA';
  SELECT id INTO v_caract_id        FROM caracteristicas_tecnicas WHERE nombre_norm = 'LUMINOSO';
  SELECT id INTO v_material_id      FROM materiales WHERE nombre_norm = 'VIDRIO';

  -- Verificar que encontramos todos los catálogos
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Empresa PANELES NAPSA SRL no encontrada. ¿Ejecutaste 09_seed_catalogos.sql?';
  END IF;

  -- Insertar contrato (si ya existe, no duplicar)
  INSERT INTO contratos (numero_contrato, tipo_contrato_id, empresa_id, fecha_suscripcion, plazo_anios)
  VALUES ('0001-2025-R', v_tipo_cont_id, v_empresa_id, '2025-12-22', 5)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_contrato_id;

  -- Si ya existía, buscarlo
  IF v_contrato_id IS NULL THEN
    SELECT id INTO v_contrato_id FROM contratos WHERE numero_contrato = '0001-2025-R' AND empresa_id = v_empresa_id;
  END IF;

  -- ─────────────────────────────────────────────────────────
  -- PASO 2: Insertar los 10 paneles reales
  -- Códigos: NAP202512-0001 al NAP202512-0010 (nro_registro_frap)
  -- Los códigos municipales (columna "codigo") necesitan confirmación
  -- del Excel completo. Por ahora uso los FRAP como código provisional.
  -- Las coordenadas son aproximadas para Jesús María (el Excel completo
  -- tiene las coordenadas exactas UTM que el script de importación convertirá).
  -- ─────────────────────────────────────────────────────────

  -- Panel 1: AV. SALAVERRY CDRA. 1 / AV. 28 DE JULIO CDRA. 6
  INSERT INTO paneles (codigo, n_excel, nro_registro_frap, latitud, longitud,
                       direccion, distrito_id, tipo_epe_id, caracteristica_id,
                       material_id, empresa_id, contrato_id)
  VALUES ('NAP202512-0001', 1, 'NAP202512-0001',
          -12.0866, -77.0500,
          'AV. SALAVERRY CDRA. 1 / AV. 28 DE JULIO CDRA. 6',
          v_distrito_id, v_tipo_epe_id, v_caract_id, v_material_id,
          v_empresa_id, v_contrato_id)
  ON CONFLICT (codigo) DO NOTHING;

  -- Panel 2: AV. SALAVERRY CDRA. 2 (CAMPO DE MARTE - CANCHA TENIS)
  INSERT INTO paneles (codigo, n_excel, nro_registro_frap, latitud, longitud,
                       direccion, distrito_id, tipo_epe_id, caracteristica_id,
                       material_id, empresa_id, contrato_id)
  VALUES ('NAP202512-0002', 2, 'NAP202512-0002',
          -12.0869, -77.0498,
          'AV. SALAVERRY CDRA. 2 (CAMPO DE MARTE - CANCHA TENIS)',
          v_distrito_id, v_tipo_epe_id, v_caract_id, v_material_id,
          v_empresa_id, v_contrato_id)
  ON CONFLICT (codigo) DO NOTHING;

  -- Panel 3: AV. SALAVERRY CDR. NRO. NAZA (NTES AV. SALAVERRY CDRA. SNAZZA...)
  INSERT INTO paneles (codigo, n_excel, nro_registro_frap, latitud, longitud,
                       direccion, distrito_id, tipo_epe_id, caracteristica_id,
                       material_id, empresa_id, contrato_id)
  VALUES ('NAP202512-0003', 3, 'NAP202512-0003',
          -12.0871, -77.0496,
          'AV. SALAVERRY CDR. NRO. NAZA (NTES AV. SALAVERRY CDRA. SNAZZA / ATE. 21/01/018)',
          v_distrito_id, v_tipo_epe_id, v_caract_id, v_material_id,
          v_empresa_id, v_contrato_id)
  ON CONFLICT (codigo) DO NOTHING;

  -- Panel 4: AV. SALAVERRY / PABLO PATRÓN (EZ TALARA)
  INSERT INTO paneles (codigo, n_excel, nro_registro_frap, latitud, longitud,
                       direccion, distrito_id, tipo_epe_id, caracteristica_id,
                       material_id, empresa_id, contrato_id)
  VALUES ('NAP202512-0004', 4, 'NAP202512-0004',
          -12.0873, -77.0494,
          'AV. SALAVERRY / PABLO PATRÓN (EZ TALARA)',
          v_distrito_id, v_tipo_epe_id, v_caract_id, v_material_id,
          v_empresa_id, v_contrato_id)
  ON CONFLICT (codigo) DO NOTHING;

  -- Panel 5: AV. SALABURY / F. DE AUGUSTO
  INSERT INTO paneles (codigo, n_excel, nro_registro_frap, latitud, longitud,
                       direccion, distrito_id, tipo_epe_id, caracteristica_id,
                       material_id, empresa_id, contrato_id)
  VALUES ('NAP202512-0005', 5, 'NAP202512-0005',
          -12.0875, -77.0492,
          'AV. SALABURY / F. DE AUGUSTO',
          v_distrito_id, v_tipo_epe_id, v_caract_id, v_material_id,
          v_empresa_id, v_contrato_id)
  ON CONFLICT (codigo) DO NOTHING;

  -- Panel 6: AV. SALAVERRY / CAHUDE
  INSERT INTO paneles (codigo, n_excel, nro_registro_frap, latitud, longitud,
                       direccion, distrito_id, tipo_epe_id, caracteristica_id,
                       material_id, empresa_id, contrato_id)
  VALUES ('NAP202512-0006', 6, 'NAP202512-0006',
          -12.0877, -77.0490,
          'AV. SALAVERRY / CAHUDE',
          v_distrito_id, v_tipo_epe_id, v_caract_id, v_material_id,
          v_empresa_id, v_contrato_id)
  ON CONFLICT (codigo) DO NOTHING;

  -- Panel 7: AV. SALAVERRY CDRA. 16, CÍRCULO MILITAR (PARQUE PRÓCERES)
  INSERT INTO paneles (codigo, n_excel, nro_registro_frap, latitud, longitud,
                       direccion, distrito_id, tipo_epe_id, caracteristica_id,
                       material_id, empresa_id, contrato_id)
  VALUES ('NAP202512-0007', 7, 'NAP202512-0007',
          -12.0879, -77.0488,
          'AV. SALAVERRY CDRA. 16, CÍRCULO MILITAR (PARQUE PRÓCERES)',
          v_distrito_id, v_tipo_epe_id, v_caract_id, v_material_id,
          v_empresa_id, v_contrato_id)
  ON CONFLICT (codigo) DO NOTHING;

  -- Panel 8: AV. SAN FELIPE / SAN CÍRCULO MILITAR (PARQUE PRÓCERES)
  INSERT INTO paneles (codigo, n_excel, nro_registro_frap, latitud, longitud,
                       direccion, distrito_id, tipo_epe_id, caracteristica_id,
                       material_id, empresa_id, contrato_id)
  VALUES ('NAP202512-0008', 8, 'NAP202512-0008',
          -12.0881, -77.0486,
          'AV. SAN FELIPE / SAN CÍRCULO MILITAR (PARQUE PRÓCERES)',
          v_distrito_id, v_tipo_epe_id, v_caract_id, v_material_id,
          v_empresa_id, v_contrato_id)
  ON CONFLICT (codigo) DO NOTHING;

  -- Panel 9: AV. ARRACOA / AV. SALAVURY
  INSERT INTO paneles (codigo, n_excel, nro_registro_frap, latitud, longitud,
                       direccion, distrito_id, tipo_epe_id, caracteristica_id,
                       material_id, empresa_id, contrato_id)
  VALUES ('NAP202512-0009', 9, 'NAP202512-0009',
          -12.0883, -77.0484,
          'AV. ARRACOA / AV. SALAVURY',
          v_distrito_id, v_tipo_epe_id, v_caract_id, v_material_id,
          v_empresa_id, v_contrato_id)
  ON CONFLICT (codigo) DO NOTHING;

  -- Panel 10: AV. SALAVERRY / SANCHEZ CARRIÓN
  INSERT INTO paneles (codigo, n_excel, nro_registro_frap, latitud, longitud,
                       direccion, distrito_id, tipo_epe_id, caracteristica_id,
                       material_id, empresa_id, contrato_id)
  VALUES ('NAP202512-0010', 10, 'NAP202512-0010',
          -12.0885, -77.0482,
          'AV. SALAVERRY / SANCHEZ CARRIÓN',
          v_distrito_id, v_tipo_epe_id, v_caract_id, v_material_id,
          v_empresa_id, v_contrato_id)
  ON CONFLICT (codigo) DO NOTHING;

  RAISE NOTICE 'Seed completado: 1 contrato + 10 paneles insertados (o ignorados si ya existían).';
END $$;

-- ─────────────────────────────────────────────────────────────
-- VERIFICACIÓN: muestra los paneles insertados
-- ─────────────────────────────────────────────────────────────
-- Ejecuta esta consulta para confirmar que todo quedó bien:
SELECT
  codigo,
  "distrito",
  "tipoEPE",
  "empresa",
  "numeroContrato",
  "estadoContrato",
  "fechaVencimiento",
  latitud,
  longitud
FROM v_paneles_detalle
ORDER BY codigo;
