// ============================================================
// MAP CONFIG — Configuración de MapLibre GL JS
// ============================================================

import type { StyleSpecification } from 'maplibre-gl';

export const MAP_STYLES: Record<string, string | StyleSpecification> = {
  hybrid: {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Esri, Maxar, Earthstar Geographics',
      },
      'esri-transportation': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
      },
      'esri-places': {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
      },
    },
    layers: [
      { id: 'esri-satellite-layer', type: 'raster', source: 'esri-satellite' },
      { id: 'esri-transportation-layer', type: 'raster', source: 'esri-transportation' },
      { id: 'esri-places-layer', type: 'raster', source: 'esri-places' },
    ],
  },
  satellite: {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Esri, Maxar, Earthstar Geographics',
      },
    },
    layers: [
      { id: 'esri-satellite-layer', type: 'raster', source: 'esri-satellite' },
    ],
  },
  topo: {
    version: 8,
    sources: {
      'esri-topo': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Esri, DeLorme, NAVTEQ',
      },
    },
    layers: [
      { id: 'esri-topo-layer', type: 'raster', source: 'esri-topo' },
    ],
  },
  streets: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
};

export type MapStyleKey = 'hybrid' | 'satellite' | 'topo' | 'streets';

export const MAP_STYLE_NAMES: Record<MapStyleKey, string> = {
  hybrid: 'Híbrido (Satélite con Malla Vial)',
  satellite: 'Imágenes Satelitales de Alta Definición',
  topo: 'Topografía y Relieve',
  streets: 'Cartografía Urbana Oficial (Calles)',
};

// Centro de Lima Metropolitana
export const INITIAL_VIEW = {
  center: [-77.0428, -12.0464] as [number, number],
  zoom: 12,
  pitch: 0,
  bearing: 0,
};

// Límites de Lima (para restringir navegación si se desea)
export const LIMA_BOUNDS: [[number, number], [number, number]] = [
  [-77.35, -12.45],
  [-76.60, -11.60],
];

