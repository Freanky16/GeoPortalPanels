// ============================================================
// useFilteredPanels — Hook de filtrado cruzado
// ============================================================
// Este hook es el CEREBRO de la app: toma todos los paneles
// y los filtros activos, y retorna solo los paneles que cumplen
// TODOS los criterios. Es usado por el Mapa, los Gráficos y
// el Contador simultáneamente.

import { useMemo } from 'react';
import { Panel, FiltrosActivos } from '@/types';
import { usePanelStore } from '@/store/usePanelStore';
import { useFilterStore } from '@/store/useFilterStore';

/**
 * Filtra los paneles según los filtros activos.
 * Retorna los paneles que cumplen TODOS los filtros (AND lógico).
 */
function filtrarPaneles(paneles: Panel[], filtros: FiltrosActivos): Panel[] {
  return paneles.filter((panel) => {
    // Filtro por búsqueda de texto
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      const coincide =
        panel.codigo.toLowerCase().includes(busqueda) ||
        (panel.distrito && panel.distrito.toLowerCase().includes(busqueda)) ||
        (panel.direccion && panel.direccion.toLowerCase().includes(busqueda)) ||
        (panel.empresa && panel.empresa.toLowerCase().includes(busqueda)) ||
        (panel.numeroContrato && panel.numeroContrato.toLowerCase().includes(busqueda)) ||
        (panel.registroFRAP && panel.registroFRAP.toLowerCase().includes(busqueda));
      if (!coincide) return false;
    }

    // Filtro por distritos
    if (filtros.distritos.length > 0 && !filtros.distritos.includes(panel.distrito)) {
      return false;
    }

    // Filtro por empresas
    if (filtros.empresas.length > 0 && (!panel.empresa || !filtros.empresas.includes(panel.empresa))) {
      return false;
    }

    // Filtro por tipos de vía
    if (filtros.tiposVia.length > 0 && (!panel.tipoVia || !filtros.tiposVia.includes(panel.tipoVia))) {
      return false;
    }

    // Filtro por espacios publicitarios
    if (filtros.espaciosPublicitarios.length > 0 && (!panel.espacioPublicitario || !filtros.espaciosPublicitarios.includes(panel.espacioPublicitario))) {
      return false;
    }

    // Filtro por tipos de EPE
    if (filtros.tiposEPE.length > 0 && (!panel.tipoEPE || !filtros.tiposEPE.includes(panel.tipoEPE))) {
      return false;
    }

    // Filtro por características técnicas
    if (filtros.caracteristicasTecnicas.length > 0 && (!panel.caracteristicaTecnica || !filtros.caracteristicasTecnicas.includes(panel.caracteristicaTecnica))) {
      return false;
    }

    // Filtro por materiales predominantes
    if (filtros.materialesPredominantes.length > 0 && (!panel.materialPredominante || !filtros.materialesPredominantes.includes(panel.materialPredominante))) {
      return false;
    }

    // Filtro por estado de contrato
    if (filtros.estadosContrato.length > 0 && !filtros.estadosContrato.includes(panel.estadoContrato)) {
      return false;
    }

    // Filtro por tipo de contrato
    if (filtros.tiposContrato.length > 0 && (!panel.tipoContrato || !filtros.tiposContrato.includes(panel.tipoContrato))) {
      return false;
    }

    return true;
  });
}

/**
 * Hook principal de filtrado cruzado.
 * Memoizado para que solo se recalcule cuando los paneles o los filtros cambien.
 */
export function useFilteredPanels(): Panel[] {
  const paneles = usePanelStore((state) => state.paneles);
  const filtros = useFilterStore((state) => state.filtros);

  return useMemo(() => filtrarPaneles(paneles, filtros), [paneles, filtros]);
}

/**
 * Hook auxiliar que retorna los conteos de cada valor para un campo.
 * Se usa para mostrar "(84)" junto a cada opción de filtro.
 * Toma en cuenta los demás filtros activos (cross-count).
 */
export function useFilterCounts(
  fieldKey: keyof Panel,
  filterKey: keyof Omit<FiltrosActivos, 'busqueda'>
): Record<string, number> {
  const paneles = usePanelStore((state) => state.paneles);
  const filtros = useFilterStore((state) => state.filtros);

  return useMemo(() => {
    // Filtrar usando todos los filtros EXCEPTO el actual
    const filtrosSinEste: FiltrosActivos = {
      ...filtros,
      [filterKey]: [],
    };
    const panelesBase = filtrarPaneles(paneles, filtrosSinEste);

    // Contar ocurrencias
    const conteo: Record<string, number> = {};
    panelesBase.forEach((panel) => {
      const valor = String(panel[fieldKey] ?? 'Sin dato');
      conteo[valor] = (conteo[valor] || 0) + 1;
    });
    return conteo;
  }, [paneles, filtros, fieldKey, filterKey]);
}
