// ============================================================
// CAPAS MML CONFIG — Configuración aislada de Capas Oficiales MML / IMP
// ============================================================

export interface CapaMMLDefinition {
  id: string;
  nombre: string;
  descripcion: string;
  urlServicio: string;
  tipoGeometria: 'line' | 'fill';
}

export const CAPAS_MML_CONFIG = {
  sistemaVial: {
    id: 'mml-sistema-vial',
    sourceId: 'mml-sistema-vial-source',
    layerLineId: 'mml-sistema-vial-line',
    layerLabelId: 'mml-sistema-vial-label',
    nombre: 'Sistema Vial',
    descripcion: 'Malla Metropolitana Oficial: Expresas, Arteriales y Colectoras (A87)',
    urlQuery: 'https://services5.arcgis.com/bHvzrGGxW8wP6Utm/arcgis/rest/services/Sistema_Vial_Metropolitano_A87/FeatureServer/0/query?where=1%3D1&outFields=OBJECTID,NOMBRE_1,CLASIF_1,TIPO_VIA_1,TRAMO_VI_1&outSR=4326&f=geojson',
  },
  zonificacion: {
    id: 'mml-zonificacion',
    sourceId: 'mml-zonificacion-source',
    layerFillId: 'mml-zonificacion-fill',
    layerLineId: 'mml-zonificacion-line',
    nombre: 'Zonificación',
    descripcion: 'Zonificación Urbana Vigente de Lima Metropolitana (IMP)',
    urlBase: 'https://services5.arcgis.com/bHvzrGGxW8wP6Utm/arcgis/rest/services/Zonficacion_Urbana_Vigente_LM_13022026_project/FeatureServer/0',
  },
} as const;

// Colores institucionales por clasificación de vía del Sistema Vial Metropolitano
export const CLASIFICACION_VIAL_COLORS: Record<string, string> = {
  'EXPRESAS': '#DC2626',      // Rojo vial para vías expresas (ej. Vía Expresa Paseo de la República)
  'SEMI EXPRESAS': '#EA580C', // Naranja intenso
  'ARTERIALES': '#2563EB',    // Azul vial para arteriales (ej. Av. Salaverry, Av. Universitaria)
  'COLECTORAS': '#16A34A',    // Verde vial para colectoras
  'DEFAULT': '#64748B',       // Gris pizarra
};
