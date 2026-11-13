// ============================================================
// UI STORE — Estado de la interfaz de usuario (Zustand)
// ============================================================

import { create } from 'zustand';
import { ColorScheme, MapViewState, Panel } from '@/types';
import { MapStyleKey } from '@/lib/mapConfig';

export interface CorredorVialActivo {
  nombre: string;
  paneles: Panel[];
  bounds: [[number, number], [number, number]]; // [[minLng, minLat], [maxLng, maxLat]]
}

interface UIStore {
  // Paneles laterales
  filtrosPanelAbierto: boolean;
  dashboardAbierto: boolean;

  // Tema
  theme: 'dark' | 'light';

  // Mapa
  mapStyle: MapStyleKey;
  colorScheme: ColorScheme;
  mapViewState: MapViewState;
  flyToTarget: { center: [number, number]; zoom: number } | null;
  corredorActivo: CorredorVialActivo | null;

  // Herramientas GIS
  mostrarRadio100m: boolean;
  toggleRadio100m: () => void;
  setMostrarRadio100m: (val: boolean) => void;
  mostrarTodosRadios100m: boolean;
  toggleTodosRadios100m: () => void;
  setMostrarTodosRadios100m: (val: boolean) => void;
  leyendaAbierta: boolean;
  toggleLeyenda: () => void;
  setLeyendaAbierta: (val: boolean) => void;

  // Modo captura en mapa (mira geodésica)
  modoCapturaCoordenadas: boolean;
  setModoCapturaCoordenadas: (val: boolean) => void;
  coordenadasCapturadas: { lat: number; lng: number } | null;
  setCoordenadasCapturadas: (coords: { lat: number; lng: number } | null) => void;

  // Punto preview / simulación en mapa para el Sensor de Proximidad
  puntoSimulacion: { lat: number; lng: number; radio: number } | null;
  setPuntoSimulacion: (punto: { lat: number; lng: number; radio: number } | null) => void;

  // Drawer de Edición / Creación de Paneles (Fase 2)
  drawerPanelAbierto: boolean;
  panelEnEdicion: Panel | null; // null = Nuevo panel; Panel = Editar panel existente
  abrirDrawerNuevoPanel: () => void;
  abrirDrawerEditarPanel: (panel: Panel) => void;
  cerrarDrawerPanel: () => void;

  // Acciones
  toggleFiltrosPanel: () => void;
  setFiltrosPanelAbierto: (abierto: boolean) => void;
  toggleDashboard: () => void;
  setDashboardAbierto: (abierto: boolean) => void;
  toggleTheme: () => void;
  setMapStyle: (style: MapStyleKey) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setMapViewState: (state: MapViewState) => void;
  flyTo: (center: [number, number], zoom: number) => void;
  clearFlyTo: () => void;
  setCorredorActivo: (corredor: CorredorVialActivo | null) => void;
  limpiarCorredorActivo: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  filtrosPanelAbierto: false,
  dashboardAbierto: false,
  theme: 'light',
  mapStyle: 'hybrid',
  colorScheme: 'estado_contrato',
  mapViewState: { center: [-77.0428, -12.0464], zoom: 12 },
  flyToTarget: null,
  corredorActivo: null,
  mostrarRadio100m: false,
  mostrarTodosRadios100m: false,
  leyendaAbierta: false,
  modoCapturaCoordenadas: false,
  coordenadasCapturadas: null,
  puntoSimulacion: null,
  drawerPanelAbierto: false,
  panelEnEdicion: null,

  setModoCapturaCoordenadas: (val) => set({ modoCapturaCoordenadas: val }),
  setCoordenadasCapturadas: (coords) => set({ coordenadasCapturadas: coords }),
  setPuntoSimulacion: (punto) => set({ puntoSimulacion: punto }),

  abrirDrawerNuevoPanel: () => set({ drawerPanelAbierto: true, panelEnEdicion: null }),
  abrirDrawerEditarPanel: (panel) => set({ drawerPanelAbierto: true, panelEnEdicion: panel }),
  cerrarDrawerPanel: () => set({ drawerPanelAbierto: false, panelEnEdicion: null, modoCapturaCoordenadas: false, puntoSimulacion: null }),

  setCorredorActivo: (corredor) => set({ corredorActivo: corredor }),
  limpiarCorredorActivo: () => set({ corredorActivo: null }),

  toggleRadio100m: () =>
    set((state) => ({ mostrarRadio100m: !state.mostrarRadio100m })),
  setMostrarRadio100m: (val) =>
    set({ mostrarRadio100m: val }),
  toggleTodosRadios100m: () =>
    set((state) => ({ mostrarTodosRadios100m: !state.mostrarTodosRadios100m })),
  setMostrarTodosRadios100m: (val) =>
    set({ mostrarTodosRadios100m: val }),
  toggleLeyenda: () =>
    set((state) => ({ leyendaAbierta: !state.leyendaAbierta })),
  setLeyendaAbierta: (val) =>
    set({ leyendaAbierta: val }),

  toggleFiltrosPanel: () =>
    set((state) => ({ filtrosPanelAbierto: !state.filtrosPanelAbierto })),

  setFiltrosPanelAbierto: (abierto) =>
    set({ filtrosPanelAbierto: abierto }),

  toggleDashboard: () =>
    set((state) => ({ dashboardAbierto: !state.dashboardAbierto })),

  setDashboardAbierto: (abierto) =>
    set({ dashboardAbierto: abierto }),

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', newTheme);
      }
      return {
        theme: newTheme,
      };
    }),

  setMapStyle: (mapStyle) => set({ mapStyle }),
  setColorScheme: (colorScheme) => set({ colorScheme }),
  setMapViewState: (mapViewState) => set({ mapViewState }),

  flyTo: (center, zoom) =>
    set({ flyToTarget: { center, zoom } }),

  clearFlyTo: () => set({ flyToTarget: null }),
}));
