// ============================================================
// UI STORE — Estado de la interfaz de usuario (Zustand)
// ============================================================

import { create } from 'zustand';
import { ColorScheme, MapViewState } from '@/types';
import { MapStyleKey } from '@/lib/mapConfig';

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
  // Herramientas GIS
  mostrarRadio100m: boolean;
  toggleRadio100m: () => void;
  setMostrarRadio100m: (val: boolean) => void;

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
}

export const useUIStore = create<UIStore>((set) => ({
  filtrosPanelAbierto: false,
  dashboardAbierto: false,
  theme: 'light',
  mapStyle: 'hybrid',
  colorScheme: 'estado_contrato',
  mapViewState: { center: [-77.0428, -12.0464], zoom: 12 },
  flyToTarget: null,
  mostrarRadio100m: false,

  toggleRadio100m: () =>
    set((state) => ({ mostrarRadio100m: !state.mostrarRadio100m })),
  setMostrarRadio100m: (val) =>
    set({ mostrarRadio100m: val }),

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
