// ============================================================
// useURLSync — Sincronizar filtros con la URL
// ============================================================
// Cuando el usuario filtra, la URL se actualiza.
// Si alguien abre esa URL, ve exactamente los mismos filtros.

'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useFilterStore } from '@/store/useFilterStore';
import { FiltrosActivos, FILTROS_VACIOS, EstadoContrato } from '@/types';

// Mapeo entre claves de filtro y parámetros de URL
const PARAM_MAP: Record<string, keyof Omit<FiltrosActivos, 'busqueda'>> = {
  dist: 'distritos',
  emp: 'empresas',
  via: 'tiposVia',
  esp: 'espaciosPublicitarios',
  epe: 'tiposEPE',
  tec: 'caracteristicasTecnicas',
  mat: 'materialesPredominantes',
  est: 'estadosContrato',
  tc: 'tiposContrato',
};

const REVERSE_MAP = Object.fromEntries(
  Object.entries(PARAM_MAP).map(([k, v]) => [v, k])
);

/**
 * Hook que mantiene sincronizados los filtros del store con los query params de la URL.
 */
export function useURLSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filtros = useFilterStore((state) => state.filtros);
  const isFirstLoad = useRef(true);

  // Al cargar la página, leer filtros de la URL
  useEffect(() => {
    if (!isFirstLoad.current) return;
    isFirstLoad.current = false;

    const store = useFilterStore.getState();
    let hayFiltrosEnURL = false;

    // Leer cada parámetro
    Object.entries(PARAM_MAP).forEach(([param, key]) => {
      const valor = searchParams.get(param);
      if (valor) {
        const valores = valor.split(',').map(decodeURIComponent);
        store.setFilter(key, valores);
        hayFiltrosEnURL = true;
      }
    });

    // Leer búsqueda
    const busqueda = searchParams.get('q');
    if (busqueda) {
      store.setBusqueda(decodeURIComponent(busqueda));
      hayFiltrosEnURL = true;
    }
  }, [searchParams]);

  // Cuando los filtros cambien, actualizar la URL
  useEffect(() => {
    if (isFirstLoad.current) return;

    const params = new URLSearchParams();

    // Escribir cada filtro como parámetro
    Object.entries(REVERSE_MAP).forEach(([key, param]) => {
      const valores = filtros[key as keyof Omit<FiltrosActivos, 'busqueda'>];
      if (Array.isArray(valores) && valores.length > 0) {
        params.set(param, valores.map(encodeURIComponent).join(','));
      }
    });

    // Escribir búsqueda
    if (filtros.busqueda) {
      params.set('q', encodeURIComponent(filtros.busqueda));
    }

    const queryString = params.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;

    router.replace(newURL, { scroll: false });
  }, [filtros, router, pathname]);
}
