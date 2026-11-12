'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import styles from './MapView.module.css';

import { useUIStore } from '@/store/useUIStore';
import { useFilteredPanels } from '@/hooks/useFilteredPanels';
import { usePanelStore } from '@/store/usePanelStore';
import { useFilterStore } from '@/store/useFilterStore';
import { MAP_STYLES, INITIAL_VIEW } from '@/lib/mapConfig';
import { ESTADO_COLORS, TIPO_EPE_COLORS } from '@/lib/constants';
import { Panel } from '@/types';

// Configurar el worker estático para Next.js (Turbopack)
maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.js');

// ID de la fuente y capas en MapLibre
const SOURCE_ID = 'paneles-source';
const PANELES_POINT_LAYER = 'paneles-point';
const PANELES_HALO_LAYER = 'paneles-halo';
const DISTRITOS_SOURCE_ID = 'distritos-source';
const DISTRITOS_LINE_LAYER = 'distritos-line';
const DISTRITOS_FILL_LAYER = 'distritos-highlight-fill';
const DISTRITOS_HIGHLIGHT_LAYER = 'distritos-highlight-line';
const RADIO_BUFFER_SOURCE_ID = 'radio-buffer-source';
const RADIO_BUFFER_FILL_LAYER = 'radio-buffer-fill';
const RADIO_BUFFER_LINE_LAYER = 'radio-buffer-line';

// Auditoría Global de Proximidad 100m (Todos los paneles)
const RADIO_ALL_BUFFER_SOURCE_ID = 'radio-all-buffer-source';
const RADIO_ALL_BUFFER_FILL_LAYER = 'radio-all-buffer-fill';
const RADIO_ALL_BUFFER_LINE_LAYER = 'radio-all-buffer-line';

// Parpadeo Multitudinario de Corredor Vial (Multi-Beacon Pulse WebGL)
const CORREDOR_BEACONS_SOURCE_ID = 'corredor-beacons-source';
const CORREDOR_PULSE_OUTER_LAYER = 'corredor-pulse-outer';
const CORREDOR_PULSE_INNER_LAYER = 'corredor-pulse-inner';

/**
 * Genera un polígono GeoJSON circular con radio en metros
 */
function createGeoJSONCircle(center: [number, number], radiusInMeters: number, points = 64): GeoJSON.FeatureCollection {
  const coords: [number, number][] = [];
  const [lng, lat] = center;
  const latRad = (lat * Math.PI) / 180;
  const dLat = (radiusInMeters / 6371000) * (180 / Math.PI);
  const dLng = dLat / Math.cos(latRad);

  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const pLng = lng + dLng * Math.cos(angle);
    const pLat = lat + dLat * Math.sin(angle);
    coords.push([pLng, pLat]);
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
        properties: {
          radio: radiusInMeters,
        },
      },
    ],
  };
}

/**
 * Genera polígonos GeoJSON circulares de 100m geodésicos para múltiples paneles
 */
function createGeoJSONCircles(centers: [number, number][], radiusInMeters: number, points = 32): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = centers.map((center, idx) => {
    const coords: [number, number][] = [];
    const [lng, lat] = center;
    const latRad = (lat * Math.PI) / 180;
    const dLat = (radiusInMeters / 6371000) * (180 / Math.PI);
    const dLng = dLat / Math.cos(latRad);

    for (let i = 0; i <= points; i++) {
      const angle = (i * 2 * Math.PI) / points;
      const pLng = lng + dLng * Math.cos(angle);
      const pLat = lat + dLat * Math.sin(angle);
      coords.push([pLng, pLat]);
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
      properties: {
        id: idx,
        radio: radiusInMeters,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Normaliza y expande los nombres de distritos para soportar variantes
 * con tildes (ej: "Jesús María" de la BD) y sin tildes ("JESUS MARIA" de distritos.geojson),
 * así como nombres compuestos ("Lurigancho-Chosica" -> "LURIGANCHO").
 */
function expandirVariantesDistrito(distritos: string[]): string[] {
  const result = new Set<string>();
  for (const d of distritos) {
    if (!d) continue;
    const upper = d.toUpperCase().trim();
    const sinTildes = upper.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    result.add(upper);
    result.add(sinTildes);

    if (sinTildes.includes('LURIGANCHO')) result.add('LURIGANCHO');
    if (sinTildes.includes('MAGDALENA')) result.add('MAGDALENA DEL MAR');
    if (sinTildes.includes('ATE')) result.add('ATE');
  }
  return Array.from(result);
}

/**
 * Convierte un arreglo de paneles a FeatureCollection GeoJSON listo para MapLibre
 */
function buildPanelsGeoJSON(paneles: Panel[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: paneles.map((panel) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [panel.longitud, panel.latitud],
      },
      properties: {
        id: panel.id,
        codigo: panel.codigo,
        estadoContrato: panel.estadoContrato,
        tipoEPE: panel.tipoEPE,
        empresa: panel.empresa,
        panelData: JSON.stringify(panel),
      },
    })),
  };
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const hoverPopup = useRef<maplibregl.Popup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const currentStyleKeyRef = useRef<string>('');

  // Stores
  const mapStyle = useUIStore((state) => state.mapStyle);
  const colorScheme = useUIStore((state) => state.colorScheme);
  const flyToTarget = useUIStore((state) => state.flyToTarget);
  const clearFlyTo = useUIStore((state) => state.clearFlyTo);
  const setMapViewState = useUIStore((state) => state.setMapViewState);
  const mostrarRadio100m = useUIStore((state) => state.mostrarRadio100m);
  const mostrarTodosRadios100m = useUIStore((state) => state.mostrarTodosRadios100m);
  const panelSeleccionado = usePanelStore((state) => state.panelSeleccionado);
  const seleccionarPanel = usePanelStore((state) => state.seleccionarPanel);
  const corredorActivo = useUIStore((state) => state.corredorActivo);

  // Hook que retorna los paneles filtrados en tiempo real
  const panelesFiltrados = useFilteredPanels();
  const distritosFiltro = useFilterStore((state) => state.filtros.distritos);

  // Refs para que los callbacks de eventos de MapLibre siempre tengan los datos más recientes
  const panelesFiltradosRef = useRef(panelesFiltrados);
  panelesFiltradosRef.current = panelesFiltrados;

  const distritosFiltroRef = useRef(distritosFiltro);
  distritosFiltroRef.current = distritosFiltro;

  const mostrarRadio100mRef = useRef(mostrarRadio100m);
  mostrarRadio100mRef.current = mostrarRadio100m;

  const mostrarTodosRadios100mRef = useRef(mostrarTodosRadios100m);
  mostrarTodosRadios100mRef.current = mostrarTodosRadios100m;

  const panelSeleccionadoRef = useRef(panelSeleccionado);
  panelSeleccionadoRef.current = panelSeleccionado;

  // Ref para el faro / luz pulsante (Beacon Pulse) del panel seleccionado
  const beaconMarkerRef = useRef<maplibregl.Marker | null>(null);

  /**
   * Agrega la fuente GeoJSON y las capas de visualización al mapa.
   * Se llama tanto en la carga inicial como después de cambiar estilo.
   */
  const addSourceAndLayers = useCallback((mapInstance: maplibregl.Map) => {
    // 1. Agregar fuente GeoJSON de Paneles (precargada con los paneles actuales)
    if (!mapInstance.getSource(SOURCE_ID)) {
      mapInstance.addSource(SOURCE_ID, {
        type: 'geojson',
        data: buildPanelsGeoJSON(panelesFiltradosRef.current),
        cluster: false,
      });
    }

    // 2. Agregar fuente de Distritos (límites oficiales de Lima Metropolitana)
    if (!mapInstance.getSource(DISTRITOS_SOURCE_ID)) {
      mapInstance.addSource(DISTRITOS_SOURCE_ID, {
        type: 'geojson',
        data: '/data/distritos.geojson',
      });
    }

    // 3. Capa: Relleno suave para distritos seleccionados en el filtro
    if (!mapInstance.getLayer(DISTRITOS_FILL_LAYER)) {
      mapInstance.addLayer({
        id: DISTRITOS_FILL_LAYER,
        type: 'fill',
        source: DISTRITOS_SOURCE_ID,
        paint: {
          'fill-color': '#0284C7',
          'fill-opacity': 0.12,
        },
        filter: ['in', 'distrito', ''],
      });
    }

    // 4. Capa: Límites de todos los distritos (líneas continuas suaves, estilo GIS profesional)
    if (!mapInstance.getLayer(DISTRITOS_LINE_LAYER)) {
      mapInstance.addLayer({
        id: DISTRITOS_LINE_LAYER,
        type: 'line',
        source: DISTRITOS_SOURCE_ID,
        paint: {
          'line-color': '#78909C',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            9, 0.6,
            12, 1.0,
            15, 1.8,
          ],
          'line-opacity': 0.45,
        },
      });
    }

    // 5. Capa: Resalte perimetral del distrito seleccionado
    if (!mapInstance.getLayer(DISTRITOS_HIGHLIGHT_LAYER)) {
      mapInstance.addLayer({
        id: DISTRITOS_HIGHLIGHT_LAYER,
        type: 'line',
        source: DISTRITOS_SOURCE_ID,
        paint: {
          'line-color': '#0284C7',
          'line-width': 2.5,
          'line-opacity': 0.9,
        },
        filter: ['in', 'distrito', ''],
      });
    }

    // 6. Capa: Halo de fondo para los puntos (sombra y contraste sobre cualquier satélite o mapa)
    if (!mapInstance.getLayer(PANELES_HALO_LAYER)) {
      mapInstance.addLayer({
        id: PANELES_HALO_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            9, 1.5,
            11, 2.8,
            13, 4.8,
            15, 6.8,
            17, 8.5,
            19, 10.5,
          ],
          'circle-color': '#000000',
          'circle-opacity': [
            'interpolate', ['linear'], ['zoom'],
            9, 0.0,
            10, 0.25,
            12, 0.5,
            15, 0.65,
          ],
          'circle-blur': 0.6,
        },
      });
    }

    // 7. Capa: Puntos de Paneles Publicitarios (Punteros métricos dinámicos por zoom)
    if (!mapInstance.getLayer(PANELES_POINT_LAYER)) {
      mapInstance.addLayer({
        id: PANELES_POINT_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            9, 1.0,
            11, 2.0,
            13, 3.8,
            15, 5.2,
            17, 7.0,
            19, 9.0,
          ],
          'circle-color': [
            'match',
            ['get', 'estadoContrato'],
            'vigente', ESTADO_COLORS.vigente,
            'por_vencer', ESTADO_COLORS.por_vencer,
            'vencido', ESTADO_COLORS.vencido,
            ESTADO_COLORS.sin_dato,
          ],
          'circle-opacity': [
            'interpolate', ['linear'], ['zoom'],
            8, 0.0,
            9, 0.4,
            11, 0.85,
            13, 0.95,
            15, 1.0,
          ],
          'circle-stroke-width': [
            'interpolate', ['linear'], ['zoom'],
            10, 0.5,
            13, 1.2,
            16, 2.0,
          ],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': [
            'interpolate', ['linear'], ['zoom'],
            9, 0.0,
            11, 0.6,
            13, 0.95,
          ],
        },
      });
    }

    // 7. Capa y fuente: Radio normativo de 100 metros (Ordenanza MML)
    if (!mapInstance.getSource(RADIO_BUFFER_SOURCE_ID)) {
      mapInstance.addSource(RADIO_BUFFER_SOURCE_ID, {
        type: 'geojson',
        data: (mostrarRadio100mRef.current && panelSeleccionadoRef.current)
          ? createGeoJSONCircle([panelSeleccionadoRef.current.longitud, panelSeleccionadoRef.current.latitud], 100)
          : { type: 'FeatureCollection', features: [] },
      });
    }

    if (!mapInstance.getLayer(RADIO_BUFFER_FILL_LAYER)) {
      mapInstance.addLayer(
        {
          id: RADIO_BUFFER_FILL_LAYER,
          type: 'fill',
          source: RADIO_BUFFER_SOURCE_ID,
          paint: {
            'fill-color': '#1A73E8',
            'fill-opacity': 0.18,
          },
        },
        PANELES_HALO_LAYER // Insertar antes del halo de puntos para que los puntos queden encima
      );
    }

    if (!mapInstance.getLayer(RADIO_BUFFER_LINE_LAYER)) {
      mapInstance.addLayer(
        {
          id: RADIO_BUFFER_LINE_LAYER,
          type: 'line',
          source: RADIO_BUFFER_SOURCE_ID,
          paint: {
            'line-color': '#1A73E8',
            'line-width': 2.2,
            'line-dasharray': [3, 2],
            'line-opacity': 0.85,
          },
        },
        PANELES_HALO_LAYER
      );
    }

    // 8. Capa y fuente: Auditoría Global de 100 metros (Todos los paneles visibles)
    if (!mapInstance.getSource(RADIO_ALL_BUFFER_SOURCE_ID)) {
      mapInstance.addSource(RADIO_ALL_BUFFER_SOURCE_ID, {
        type: 'geojson',
        data: (mostrarTodosRadios100mRef.current && panelesFiltradosRef.current.length > 0)
          ? createGeoJSONCircles(panelesFiltradosRef.current.map(p => [p.longitud, p.latitud]), 100)
          : { type: 'FeatureCollection', features: [] },
      });
    }

    if (!mapInstance.getLayer(RADIO_ALL_BUFFER_FILL_LAYER)) {
      mapInstance.addLayer(
        {
          id: RADIO_ALL_BUFFER_FILL_LAYER,
          type: 'fill',
          source: RADIO_ALL_BUFFER_SOURCE_ID,
          paint: {
            'fill-color': '#2563EB',
            'fill-opacity': 0.14,
          },
        },
        RADIO_BUFFER_FILL_LAYER
      );
    }

    if (!mapInstance.getLayer(RADIO_ALL_BUFFER_LINE_LAYER)) {
      mapInstance.addLayer(
        {
          id: RADIO_ALL_BUFFER_LINE_LAYER,
          type: 'line',
          source: RADIO_ALL_BUFFER_SOURCE_ID,
          paint: {
            'line-color': '#3B82F6',
            'line-width': 1.6,
            'line-dasharray': [2, 2],
            'line-opacity': 0.75,
          },
        },
        RADIO_BUFFER_FILL_LAYER
      );
    }

    // 9. Capa y fuente: Parpadeo Multitudinario (Multi-Beacon Pulse WebGL)
    if (!mapInstance.getSource(CORREDOR_BEACONS_SOURCE_ID)) {
      mapInstance.addSource(CORREDOR_BEACONS_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    // Onda exterior del parpadeo (Halo amplio y difuso que escala con el zoom)
    if (!mapInstance.getLayer(CORREDOR_PULSE_OUTER_LAYER)) {
      mapInstance.addLayer(
        {
          id: CORREDOR_PULSE_OUTER_LAYER,
          type: 'circle',
          source: CORREDOR_BEACONS_SOURCE_ID,
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              9, 3.5,
              11, 7.0,
              13, 13.0,
              15, 20.0,
              17, 30.0,
              19, 42.0,
            ],
            'circle-color': [
              'match',
              ['get', 'estadoContrato'],
              'vigente', ESTADO_COLORS.vigente,
              'por_vencer', ESTADO_COLORS.por_vencer,
              'vencido', ESTADO_COLORS.vencido,
              ESTADO_COLORS.sin_dato,
            ],
            'circle-opacity': 0.45,
            'circle-blur': 0.75,
          },
        },
        PANELES_HALO_LAYER
      );
    }

    // Onda interior del parpadeo (Anillo concentrado de alta energía)
    if (!mapInstance.getLayer(CORREDOR_PULSE_INNER_LAYER)) {
      mapInstance.addLayer(
        {
          id: CORREDOR_PULSE_INNER_LAYER,
          type: 'circle',
          source: CORREDOR_BEACONS_SOURCE_ID,
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              9, 2.0,
              11, 4.5,
              13, 8.5,
              15, 13.0,
              17, 19.0,
              19, 26.0,
            ],
            'circle-color': [
              'match',
              ['get', 'estadoContrato'],
              'vigente', ESTADO_COLORS.vigente,
              'por_vencer', ESTADO_COLORS.por_vencer,
              'vencido', ESTADO_COLORS.vencido,
              ESTADO_COLORS.sin_dato,
            ],
            'circle-opacity': 0.65,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-opacity': 0.85,
          },
        },
        PANELES_HALO_LAYER
      );
    }
  }, []);

  /**
   * Configura eventos de click y hover en los puntos de paneles.
   */
  const setupMapInteractions = useCallback((mapInstance: maplibregl.Map) => {
    // Popup reutilizable
    if (!hoverPopup.current) {
      hoverPopup.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
        className: styles.mapTooltip,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapInstance.on('click', PANELES_POINT_LAYER, (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const properties = e.features[0].properties;
      if (!properties?.panelData) return;
      try {
        const panel = JSON.parse(properties.panelData);
        seleccionarPanel(panel);
      } catch {
        // Silenciar error de parseo
      }
    });

    // Hover con Tooltip informativo inmediato
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapInstance.on('mouseenter', PANELES_POINT_LAYER, (e: any) => {
      mapInstance.getCanvas().style.cursor = 'pointer';
      if (!e.features || e.features.length === 0) return;

      const props = e.features[0].properties;
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates;
      let panelObj = null;
      try {
        panelObj = JSON.parse(props?.panelData || '{}');
      } catch {
        // null
      }

      const codigo = panelObj?.codigo || props?.codigo || 'Panel';
      const empresa = panelObj?.empresa || 'Empresa no registrada';
      const distrito = panelObj?.distrito || '';
      const estado = panelObj?.estadoContrato || 'sin_dato';

      const estadoLabels: Record<string, { text: string; color: string }> = {
        vigente: { text: 'Vigente', color: '#10B981' },
        por_vencer: { text: 'Por Vencer', color: '#F59E0B' },
        vencido: { text: 'Vencido', color: '#EF4444' },
        sin_dato: { text: 'Sin Dato', color: '#0284C7' },
      };
      const badge = estadoLabels[estado] || estadoLabels.sin_dato;

      const htmlContent = `
        <div style="font-family: inherit; font-size: 11px; line-height: 1.4; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: #0F172A; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span>${codigo}</span>
            <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; background: ${badge.color}20; color: ${badge.color}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${badge.color}40;">
              ${badge.text}
            </span>
          </div>
          <div style="color: #475569; font-weight: 600; margin-top: 2px;">${empresa}</div>
          ${distrito ? `<div style="color: #94A3B8; font-size: 10px;">Distrito: ${distrito}</div>` : ''}
          <div style="color: #0284C7; font-size: 10px; margin-top: 4px; font-weight: 700;">Click para ver ficha completa ↗</div>
        </div>
      `;

      hoverPopup.current
        ?.setLngLat(coords as [number, number])
        .setHTML(htmlContent)
        .addTo(mapInstance);
    });

    mapInstance.on('mouseleave', PANELES_POINT_LAYER, () => {
      mapInstance.getCanvas().style.cursor = '';
      hoverPopup.current?.remove();
    });
  }, [seleccionarPanel]);

  // 1. Inicializar el mapa
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const styleDefinition = MAP_STYLES[mapStyle] || MAP_STYLES.hybrid;
    currentStyleKeyRef.current = mapStyle;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: styleDefinition as any,
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      maxZoom: 19,
      minZoom: 8,
      attributionControl: false,
    });

    map.current = mapInstance;

    // Escala cartográfica oficial métrica (como Google Maps / GIS)
    const scaleControl = new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric',
    });
    mapInstance.addControl(scaleControl, 'bottom-left');

    mapInstance.on('load', () => {
      addSourceAndLayers(mapInstance);
      setupMapInteractions(mapInstance);
      setMapReady(true);
      setTimeout(() => mapInstance.resize(), 100);
    });

    // Guardián permanente: si el estilo cambia o se recarga, reinstala capas y datos inmediatamente
    mapInstance.on('styledata', () => {
      if (mapInstance.isStyleLoaded() && !mapInstance.getSource(SOURCE_ID)) {
        addSourceAndLayers(mapInstance);
        setupMapInteractions(mapInstance);
        const src = mapInstance.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
        if (src) {
          src.setData(buildPanelsGeoJSON(panelesFiltradosRef.current));
        }
      }
    });

    // Guardar estado de vista al mover/zoom
    mapInstance.on('moveend', () => {
      const center = mapInstance.getCenter();
      setMapViewState({
        center: [center.lng, center.lat],
        zoom: mapInstance.getZoom(),
      });
    });

    return () => {
      beaconMarkerRef.current?.remove();
      beaconMarkerRef.current = null;
      hoverPopup.current?.remove();
      map.current?.remove();
      map.current = null;
      setMapReady(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Actualizar datos en el mapa cuando cambian los filtros
  useEffect(() => {
    if (!mapReady || !map.current) return;

    const source = map.current.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
    if (!source) return;

    // Convertir paneles filtrados a GeoJSON FeatureCollection
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: panelesFiltrados.map((panel) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [panel.longitud, panel.latitud],
        },
        properties: {
          id: panel.id,
          codigo: panel.codigo,
          estadoContrato: panel.estadoContrato,
          tipoEPE: panel.tipoEPE,
          empresa: panel.empresa,
          panelData: JSON.stringify(panel),
        },
      })),
    };

    source.setData(geojson);
  }, [panelesFiltrados, mapReady]);

  // 3. Estándar único de color: Estado Legal (Vigente, Por vencer, Vencido, Sin dato)
  useEffect(() => {
    if (!mapReady || !map.current) return;
    if (!map.current.getLayer(PANELES_POINT_LAYER)) return;

    const colorExpression: maplibregl.ExpressionSpecification = [
      'match',
      ['get', 'estadoContrato'],
      'vigente', ESTADO_COLORS.vigente,
      'por_vencer', ESTADO_COLORS.por_vencer,
      'vencido', ESTADO_COLORS.vencido,
      /* default (sin dato) */ ESTADO_COLORS.sin_dato,
    ];

    map.current.setPaintProperty(PANELES_POINT_LAYER, 'circle-color', colorExpression);
  }, [mapReady]);

  // 3.5. Actualizar resalte de distritos
  useEffect(() => {
    if (!mapReady || !map.current) return;
    if (!map.current.getLayer(DISTRITOS_HIGHLIGHT_LAYER) || !map.current.getLayer(DISTRITOS_FILL_LAYER)) return;

    if (distritosFiltro && distritosFiltro.length > 0) {
      const variantes = expandirVariantesDistrito(distritosFiltro);
      const filterExpr: any = ['in', 'distrito', ...variantes];
      map.current.setFilter(DISTRITOS_HIGHLIGHT_LAYER, filterExpr);
      map.current.setFilter(DISTRITOS_FILL_LAYER, filterExpr);
    } else {
      map.current.setFilter(DISTRITOS_HIGHLIGHT_LAYER, ['in', 'distrito', '']);
      map.current.setFilter(DISTRITOS_FILL_LAYER, ['in', 'distrito', '']);
    }
  }, [distritosFiltro, mapReady]);

  // 4. Cambiar el estilo base del mapa (Híbrido, Satelital, Topo, Calles)
  useEffect(() => {
    if (!map.current) return;
    if (currentStyleKeyRef.current === mapStyle) return;
    currentStyleKeyRef.current = mapStyle;

    const styleDefinition = MAP_STYLES[mapStyle] || MAP_STYLES.hybrid;

    const reapplyAllData = () => {
      if (!map.current) return;
      addSourceAndLayers(map.current);
      setupMapInteractions(map.current);

      const src = map.current.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
      if (src) {
        src.setData(buildPanelsGeoJSON(panelesFiltradosRef.current));
      }

      // Reaplicar resalte de distritos
      if (map.current.getLayer(DISTRITOS_HIGHLIGHT_LAYER) && map.current.getLayer(DISTRITOS_FILL_LAYER)) {
        if (distritosFiltroRef.current && distritosFiltroRef.current.length > 0) {
          const variantes = expandirVariantesDistrito(distritosFiltroRef.current);
          const filterExpr: any = ['in', 'distrito', ...variantes];
          map.current.setFilter(DISTRITOS_HIGHLIGHT_LAYER, filterExpr);
          map.current.setFilter(DISTRITOS_FILL_LAYER, filterExpr);
        } else {
          map.current.setFilter(DISTRITOS_HIGHLIGHT_LAYER, ['in', 'distrito', '']);
          map.current.setFilter(DISTRITOS_FILL_LAYER, ['in', 'distrito', '']);
        }
      }

      setMapReady(true);
    };

    let reloaded = false;
    const handleReady = () => {
      if (reloaded) return;
      reloaded = true;
      reapplyAllData();
    };

    map.current.setStyle(styleDefinition as any);
    map.current.once('style.load', handleReady);
    map.current.once('styledata', () => {
      if (map.current?.isStyleLoaded()) handleReady();
    });

    const timer = setTimeout(() => {
      if (!reloaded && map.current?.isStyleLoaded()) {
        handleReady();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [mapStyle, addSourceAndLayers, setupMapInteractions]);

  // 5. FlyTo (volar suavemente hacia una coordenada)
  useEffect(() => {
    if (!mapReady || !map.current || !flyToTarget) return;
    map.current.flyTo({
      center: flyToTarget.center,
      zoom: flyToTarget.zoom,
      essential: true,
      duration: 1200,
    });
    setTimeout(() => clearFlyTo(), 1200);
  }, [flyToTarget, mapReady, clearFlyTo]);

  // 5.5. Encuadre exacto (fitBounds), realce y Parpadeo Multitudinario del Corredor Vial Activo
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const beaconsSource = map.current.getSource(CORREDOR_BEACONS_SOURCE_ID) as maplibregl.GeoJSONSource;

    let animFrameId: number | null = null;

    if (corredorActivo && corredorActivo.paneles.length > 0) {
      // 1. Cargar todos los paneles de esta vía en la fuente de balizas parpadeantes
      if (beaconsSource) {
        beaconsSource.setData(buildPanelsGeoJSON(corredorActivo.paneles));
      }

      // 2. Loop de animación sinusoidal suave para el parpadeo armónico colectivo
      let startTime = performance.now();
      const animatePulse = (currentTime: number) => {
        if (!map.current) return;
        const elapsed = (currentTime - startTime) / 1000;
        // Onda periódica de respiración luminosa (ciclo de 1.4 segundos)
        const wave = 0.5 + 0.5 * Math.sin((elapsed * 2 * Math.PI) / 1.4);
        const outerOpacity = 0.2 + 0.55 * wave;
        const innerOpacity = 0.35 + 0.6 * wave;

        if (map.current.getLayer(CORREDOR_PULSE_OUTER_LAYER)) {
          map.current.setPaintProperty(CORREDOR_PULSE_OUTER_LAYER, 'circle-opacity', outerOpacity);
        }
        if (map.current.getLayer(CORREDOR_PULSE_INNER_LAYER)) {
          map.current.setPaintProperty(CORREDOR_PULSE_INNER_LAYER, 'circle-opacity', innerOpacity);
        }

        animFrameId = requestAnimationFrame(animatePulse);
      };

      animFrameId = requestAnimationFrame(animatePulse);

      // 3. Encuadre inteligente fitBounds hacia el tramo de la arteria
      try {
        map.current.fitBounds(corredorActivo.bounds, {
          padding: 95,
          duration: 1200,
          maxZoom: 16,
        });
      } catch {
        // Fallback
      }

      // 4. Resaltar los paneles del corredor y atenuar suavemente los demás
      if (map.current.getLayer(PANELES_POINT_LAYER)) {
        const codigosCorredor = corredorActivo.paneles.map((p) => p.codigo);
        map.current.setPaintProperty(PANELES_POINT_LAYER, 'circle-opacity', [
          'case',
          ['in', ['get', 'codigo'], ['literal', codigosCorredor]],
          1.0,
          0.12, // atenuado suave para el resto de la ciudad
        ]);
        map.current.setPaintProperty(PANELES_POINT_LAYER, 'circle-stroke-opacity', [
          'case',
          ['in', ['get', 'codigo'], ['literal', codigosCorredor]],
          0.95,
          0.1,
        ]);
        map.current.setPaintProperty(PANELES_POINT_LAYER, 'circle-radius', [
          'case',
          ['in', ['get', 'codigo'], ['literal', codigosCorredor]],
          [
            'interpolate', ['linear'], ['zoom'],
            9, 3.0,
            11, 4.5,
            13, 6.5,
            15, 8.5,
            17, 10.5,
            19, 12.5,
          ],
          [
            'interpolate', ['linear'], ['zoom'],
            9, 1.0,
            11, 2.0,
            13, 3.8,
            15, 5.2,
            17, 7.0,
            19, 9.0,
          ],
        ]);
      }
    } else {
      // Sin corredor activo: vaciar balizas y restaurar opacidades normales
      if (beaconsSource) {
        beaconsSource.setData({ type: 'FeatureCollection', features: [] });
      }
      if (map.current.getLayer(PANELES_POINT_LAYER)) {
        map.current.setPaintProperty(PANELES_POINT_LAYER, 'circle-opacity', [
          'interpolate', ['linear'], ['zoom'],
          8, 0.0,
          9, 0.4,
          11, 0.85,
          13, 0.95,
          15, 1.0,
        ]);
        map.current.setPaintProperty(PANELES_POINT_LAYER, 'circle-stroke-opacity', [
          'interpolate', ['linear'], ['zoom'],
          9, 0.0,
          11, 0.6,
          13, 0.95,
        ]);
        map.current.setPaintProperty(PANELES_POINT_LAYER, 'circle-radius', [
          'interpolate', ['linear'], ['zoom'],
          9, 1.0,
          11, 2.0,
          13, 3.8,
          15, 5.2,
          17, 7.0,
          19, 9.0,
        ]);
      }
    }

    return () => {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, [corredorActivo, mapReady]);

  // 6. Radio Normativo de 100 metros (Ordenanza MML - separación mínima entre elementos)
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const source = map.current.getSource(RADIO_BUFFER_SOURCE_ID) as maplibregl.GeoJSONSource;
    if (!source) return;

    if (mostrarRadio100m && panelSeleccionado) {
      const circleData = createGeoJSONCircle([panelSeleccionado.longitud, panelSeleccionado.latitud], 100);
      source.setData(circleData);
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [mostrarRadio100m, panelSeleccionado, mapReady]);

  // 6.5. Auditoría Global de Proximidad 100m (Todos los paneles visibles)
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const source = map.current.getSource(RADIO_ALL_BUFFER_SOURCE_ID) as maplibregl.GeoJSONSource;
    if (!source) return;

    if (mostrarTodosRadios100m && panelesFiltrados.length > 0) {
      const centers = panelesFiltrados.map((p) => [p.longitud, p.latitud] as [number, number]);
      const circlesData = createGeoJSONCircles(centers, 100);
      source.setData(circlesData);
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [mostrarTodosRadios100m, panelesFiltrados, mapReady]);

  // 6.6. Faro / Luz pulsante (Beacon Pulse) para el panel seleccionado
  useEffect(() => {
    if (!mapReady || !map.current) return;

    // Remover faro anterior si existía
    if (beaconMarkerRef.current) {
      beaconMarkerRef.current.remove();
      beaconMarkerRef.current = null;
    }

    if (
      !panelSeleccionado ||
      typeof panelSeleccionado.longitud !== 'number' ||
      typeof panelSeleccionado.latitud !== 'number' ||
      isNaN(panelSeleccionado.longitud) ||
      isNaN(panelSeleccionado.latitud)
    ) return;

    const color = ESTADO_COLORS[panelSeleccionado.estadoContrato] || ESTADO_COLORS.sin_dato || '#0284C7';

    // Contenedor principal para MapLibre Marker
    const el = document.createElement('div');
    el.className = 'beacon-marker-wrapper';

    // Crear el elemento DOM interactivo con animación CSS pura de pulso
    const container = document.createElement('div');
    container.className = 'beacon-pulse-container';
    container.style.color = color;

    const wave1 = document.createElement('div');
    wave1.className = 'beacon-wave';

    const wave2 = document.createElement('div');
    wave2.className = 'beacon-wave beacon-wave-2';

    const wave3 = document.createElement('div');
    wave3.className = 'beacon-wave beacon-wave-3';

    const dot = document.createElement('div');
    dot.className = 'beacon-center-dot';

    container.appendChild(wave1);
    container.appendChild(wave2);
    container.appendChild(wave3);
    container.appendChild(dot);
    el.appendChild(container);

    const marker = new maplibregl.Marker({
      element: el,
      anchor: 'center',
    })
      .setLngLat([panelSeleccionado.longitud, panelSeleccionado.latitud])
      .addTo(map.current);

    beaconMarkerRef.current = marker;

    return () => {
      marker.remove();
      if (beaconMarkerRef.current === marker) {
        beaconMarkerRef.current = null;
      }
    };
  }, [panelSeleccionado, mapReady]);

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapContainer} className={styles.mapContainer} />
    </div>
  );
}

