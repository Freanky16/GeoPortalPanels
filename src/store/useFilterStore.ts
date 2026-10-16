// ============================================================
// FILTER STORE — Estado global de filtros (Zustand)
// ============================================================

import { create } from 'zustand';
import { FiltrosActivos, FILTROS_VACIOS, EstadoContrato } from '@/types';

type FilterKey = keyof Omit<FiltrosActivos, 'busqueda'>;

interface FilterStore {
  filtros: FiltrosActivos;

  // Agregar/quitar un valor individual de un filtro
  toggleFilter: (key: FilterKey, valor: string) => void;

  // Establecer todos los valores de un filtro
  setFilter: (key: FilterKey, valores: string[]) => void;

  // Búsqueda por texto
  setBusqueda: (texto: string) => void;

  // Limpiar un filtro específico
  clearFilter: (key: FilterKey) => void;

  // Limpiar todos los filtros
  clearAll: () => void;

  // Verificar si hay filtros activos
  hayFiltrosActivos: () => boolean;

  // Obtener la cantidad de filtros activos
  cantidadFiltrosActivos: () => number;

  // Aplicar una vista rápida (preset de filtros)
  aplicarVistaRapida: (filtros: Partial<FiltrosActivos>) => void;
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  filtros: { ...FILTROS_VACIOS },

  toggleFilter: (key, valor) =>
    set((state) => {
      const actuales = state.filtros[key] as string[];
      const nuevos = actuales.includes(valor)
        ? actuales.filter((v) => v !== valor)
        : [...actuales, valor];
      return {
        filtros: { ...state.filtros, [key]: nuevos },
      };
    }),

  setFilter: (key, valores) =>
    set((state) => ({
      filtros: { ...state.filtros, [key]: valores },
    })),

  setBusqueda: (texto) =>
    set((state) => ({
      filtros: { ...state.filtros, busqueda: texto },
    })),

  clearFilter: (key) =>
    set((state) => ({
      filtros: { ...state.filtros, [key]: [] },
    })),

  clearAll: () =>
    set({ filtros: { ...FILTROS_VACIOS } }),

  hayFiltrosActivos: () => {
    const { filtros } = get();
    return (
      filtros.busqueda !== '' ||
      Object.keys(filtros).some((key) => {
        if (key === 'busqueda') return false;
        const val = filtros[key as FilterKey];
        return Array.isArray(val) && val.length > 0;
      })
    );
  },

  cantidadFiltrosActivos: () => {
    const { filtros } = get();
    let count = filtros.busqueda ? 1 : 0;
    Object.keys(filtros).forEach((key) => {
      if (key === 'busqueda') return;
      const val = filtros[key as FilterKey];
      if (Array.isArray(val)) count += val.length;
    });
    return count;
  },

  aplicarVistaRapida: (preset) =>
    set((state) => ({
      filtros: { ...FILTROS_VACIOS, ...preset },
    })),
}));
