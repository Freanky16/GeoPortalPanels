-- ============================================================
-- 09_seed_catalogos.sql
-- Datos iniciales de los catálogos
-- ============================================================
-- ORDEN DE EJECUCIÓN: 9 de 10
-- INSTRUCCIÓN: Ejecutar DESPUÉS de 08_rls.sql
--
-- Este archivo carga los valores reales de los catálogos.
-- Usa INSERT ... ON CONFLICT DO NOTHING para que sea seguro
-- ejecutarlo varias veces (no duplica datos).
--
-- Fuente: Excel de lista de empresas y catálogos del proyecto.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- DISTRITOS (43 de Lima Metropolitana)
-- Fuente: INEI - División administrativa de Lima Metropolitana
-- ─────────────────────────────────────────────────────────────
INSERT INTO distritos (nombre, nombre_norm) VALUES
  ('Ancón',                    'ANCON'),
  ('Ate',                      'ATE'),
  ('Barranco',                 'BARRANCO'),
  ('Breña',                    'BRENA'),
  ('Carabayllo',               'CARABAYLLO'),
  ('Chaclacayo',               'CHACLACAYO'),
  ('Chorrillos',               'CHORRILLOS'),
  ('Cieneguilla',              'CIENEGUILLA'),
  ('Comas',                    'COMAS'),
  ('El Agustino',              'EL AGUSTINO'),
  ('Independencia',            'INDEPENDENCIA'),
  ('Jesús María',              'JESUS MARIA'),
  ('La Molina',                'LA MOLINA'),
  ('La Victoria',              'LA VICTORIA'),
  ('Lima',                     'LIMA'),
  ('Lince',                    'LINCE'),
  ('Los Olivos',               'LOS OLIVOS'),
  ('Lurigancho-Chosica',       'LURIGANCHO-CHOSICA'),
  ('Lurín',                    'LURIN'),
  ('Magdalena del Mar',        'MAGDALENA DEL MAR'),
  ('Miraflores',               'MIRAFLORES'),
  ('Pachacámac',               'PACHACAMAC'),
  ('Pucusana',                 'PUCUSANA'),
  ('Pueblo Libre',             'PUEBLO LIBRE'),
  ('Puente Piedra',            'PUENTE PIEDRA'),
  ('Punta Hermosa',            'PUNTA HERMOSA'),
  ('Punta Negra',              'PUNTA NEGRA'),
  ('Rímac',                    'RIMAC'),
  ('San Bartolo',              'SAN BARTOLO'),
  ('San Borja',                'SAN BORJA'),
  ('San Isidro',               'SAN ISIDRO'),
  ('San Juan de Lurigancho',   'SAN JUAN DE LURIGANCHO'),
  ('San Juan de Miraflores',   'SAN JUAN DE MIRAFLORES'),
  ('San Luis',                 'SAN LUIS'),
  ('San Martín de Porres',     'SAN MARTIN DE PORRES'),
  ('San Miguel',               'SAN MIGUEL'),
  ('Santa Anita',              'SANTA ANITA'),
  ('Santa María del Mar',      'SANTA MARIA DEL MAR'),
  ('Santa Rosa',               'SANTA ROSA'),
  ('Santiago de Surco',        'SANTIAGO DE SURCO'),
  ('Surquillo',                'SURQUILLO'),
  ('Villa El Salvador',        'VILLA EL SALVADOR'),
  ('Villa María del Triunfo',  'VILLA MARIA DEL TRIUNFO')
ON CONFLICT (nombre_norm) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- EMPRESAS
-- Fuente: Excel de lista de empresas (34 empresas, con duplicados marcados)
-- Los duplicados conocidos tienen nota para revisión con el ingeniero.
-- ─────────────────────────────────────────────────────────────
INSERT INTO empresas (nombre, nombre_norm, notas) VALUES
  ('PANELES NAPSA S.R.L.',                                              'PANELES NAPSA SRL',              NULL),
  ('ILLUMINATY S.A.C.',                                                 'ILLUMINATY SAC',                 NULL),
  ('VALLAS Y GIGANTOGRAFÍAS DEL PERÚ S.A.',                            'VALLAS Y GIGANTOGRAFIAS DEL PERU SA', NULL),
  ('GLORIDE S.R.L.',                                                    'GLORIDE SRL',                    NULL),
  ('SOFIE S.A.',                                                        'SOFIE SA',                       NULL),
  ('CONSTRUCTORA PROBIAN S.A.C.',                                       'CONSTRUCTORA PROBIAN SAC',        NULL),
  ('VISUALEED S.A.C.',                                                  'VISUALEED SAC',                  NULL),
  ('BRASIL PUBLICIDAD EXTERIOR S.A.C.',                                 'BRASIL PUBLICIDAD EXTERIOR SAC',  NULL),
  ('IMPACTO VISUAL OUTDOOR S.A.C.',                                     'IMPACTO VISUAL OUTDOOR SAC',      NULL),
  ('PUBLI-REX S.A.',                                                    'PUBLI-REX SA',                   NULL),
  ('IMPACTO MEDIA S.A.C.',                                              'IMPACTO MEDIA SAC',              NULL),
  ('SOS CHANNEL S.A.C.',                                                'SOS CHANNEL SAC',                NULL),
  ('PRODUCCION Y MANTENIMIENTO DEL PERU S.A.C.',                        'PRODUCCION Y MANTENIMIENTO DEL PERU SAC', NULL),
  ('PANORAMA VISUAL S.A.C.',                                            'PANORAMA VISUAL SAC',            NULL),
  ('J2 DIGITAL OUTDOOR S.A.C.',                                         'J2 DIGITAL OUTDOOR SAC',         NULL),
  ('ABRAHAN DIONICIO SANDOVAL PRADO',                                   'ABRAHAN DIONICIO SANDOVAL PRADO', NULL),
  ('GRUPO TOPVISO S.A.C.',                                              'GRUPO TOPVISO SAC',              NULL),
  ('REOBA DIGITAL E.I.R.L.',                                            'REOBA DIGITAL EIRL',             NULL),
  ('PROMOTORA TURISTICA E INMOBILIARIA TRANSOCEANICA S.A.C.',           'PROMOTORA TURISTICA E INMOBILIARIA TRANSOCEANICA SAC', 'POSIBLE DUPLICADO: verificar si es la misma empresa que la fila 32 (con/sin tilde en "TURÍSTICA")'),
  ('BOOMERANG PANELS S.A.C.',                                           'BOOMERANG PANELS SAC',           NULL),
  ('INPUE S.A.C.',                                                      'INPUE SAC',                      NULL),
  ('SELECTA MEDIA E.I.R.L.',                                            'SELECTA MEDIA EIRL',             NULL),
  ('ALTAVIES DUN S.A.C.',                                               'ALTAVIES DUN SAC',               NULL),
  ('STREET MEDIA S.A.C.',                                               'STREET MEDIA SAC',               NULL),
  ('ESTADÍSTICAS S.A.C.',                                               'ESTADISTICAS SAC',               NULL),
  ('ALAC MANAGEMENT S.A.C.',                                            'ALAC MANAGEMENT SAC',            NULL),
  ('PUBLIC VIEW S.A.C.',                                                'PUBLIC VIEW SAC',                NULL),
  ('FÍSICOS Y GRÁFICOS PUBLICITARIOS S.A.C.',                          'FISICOS Y GRAFICOS PUBLICITARIOS SAC', NULL),
  ('PUBLICIDAD SAC',                                                    'PUBLICIDAD SAC',                 NULL),
  ('INCA CHANNEL S.A.C.',                                               'INCA CHANNEL SAC',               NULL),
  ('VIMAXPRESS ASOCIADOS S.A.C.',                                       'VIMAXPRESS ASOCIADOS SAC',       NULL),
  ('PROMOTORA TURÍSTICA E INMOBILIARIA TRANSOCEÁNICA S.A.C.',          'PROMOTORA TURISTICA E INMOBILIARIA TRANSOCEANICA SAC', 'POSIBLE DUPLICADO: verificar si es la misma empresa que la fila 19 (con/sin tilde)'),
  ('PUNTO VISUAL S.A.',                                                 'PUNTO VISUAL SA',                NULL),
  ('INPUT',                                                             'INPUT',                          'POSIBLE DUPLICADO: verificar si es la misma empresa que INPUT S.A.C.')
ON CONFLICT DO NOTHING;  -- NO tenemos UNIQUE en empresas (hay duplicados a resolver), así que ignoramos conflictos de nombre_norm

-- ─────────────────────────────────────────────────────────────
-- TIPOS DE VÍA
-- ─────────────────────────────────────────────────────────────
INSERT INTO tipos_via (nombre, nombre_norm) VALUES
  ('Colectora',     'COLECTORA'),
  ('Arterial',      'ARTERIAL'),
  ('Expresa',       'EXPRESA'),
  ('Intercambio',   'INTERCAMBIO')
ON CONFLICT (nombre_norm) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- ESPACIOS PUBLICITARIOS
-- ─────────────────────────────────────────────────────────────
INSERT INTO espacios_publicitarios (nombre, nombre_norm) VALUES
  ('Franja de vereda',              'FRANJA DE VEREDA'),
  ('Separador lateral',             'SEPARADOR LATERAL'),
  ('Separador central',             'SEPARADOR CENTRAL'),
  ('Isla de intercambio',           'ISLA DE INTERCAMBIO'),
  ('Remanente de intercambio',      'REMANENTE DE INTERCAMBIO'),
  ('Túnel',                         'TUNEL'),
  ('Puente peatonal',               'PUENTE PEATONAL'),
  ('Bajo puente de intercambio',    'BAJO PUENTE DE INTERCAMBIO')
ON CONFLICT (nombre_norm) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- TIPOS DE EPE (Elemento de Publicidad Exterior)
-- ─────────────────────────────────────────────────────────────
INSERT INTO tipos_epe (nombre, nombre_norm) VALUES
  ('Panel monumental',                          'PANEL MONUMENTAL'),
  ('Panel monumental unipolar',                 'PANEL MONUMENTAL UNIPOLAR'),
  ('Panel monumental volumétrico',              'PANEL MONUMENTAL VOLUMETRICO'),
  ('Panel simple',                              'PANEL SIMPLE'),
  ('Tótem',                                    'TOTEM'),
  ('Paleta publicitaria',                       'PALETA PUBLICITARIA'),
  ('Mobiliario urbano - nomenclatura de vías',  'MOBILIARIO URBANO - NOMENCLATURA DE VIAS'),
  ('Otro',                                      'OTRO')
ON CONFLICT (nombre_norm) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- CARACTERÍSTICAS TÉCNICAS
-- ─────────────────────────────────────────────────────────────
INSERT INTO caracteristicas_tecnicas (nombre, nombre_norm) VALUES
  ('Luminoso',    'LUMINOSO'),
  ('Iluminado',   'ILUMINADO'),
  ('Especial',    'ESPECIAL'),
  ('Sencillo',    'SENCILLO')
ON CONFLICT (nombre_norm) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MATERIALES
-- Fuente: Excel (columna "MATERIAL PREDOMINANTE")
-- Los valores que vi en las imágenes + los del front mock
-- Agregar más cuando tengas el Excel completo
-- ─────────────────────────────────────────────────────────────
INSERT INTO materiales (nombre, nombre_norm) VALUES
  ('Vidrio',          'VIDRIO'),
  ('Madera',          'MADERA'),
  ('Acrílico',        'ACRILICO'),
  ('Lona',            'LONA'),
  ('Metal',           'METAL'),
  ('Backlight Film',  'BACKLIGHT FILM'),
  ('LED',             'LED'),
  ('Mixto',           'MIXTO'),
  ('Otro',            'OTRO')
ON CONFLICT (nombre_norm) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- TIPOS DE CONTRATO
-- Confirmados: Reordenamiento, Puntos Nuevos
-- ─────────────────────────────────────────────────────────────
INSERT INTO tipos_contrato (nombre, nombre_norm) VALUES
  ('Reordenamiento',  'REORDENAMIENTO'),
  ('Puntos Nuevos',   'PUNTOS NUEVOS')
ON CONFLICT (nombre_norm) DO NOTHING;
