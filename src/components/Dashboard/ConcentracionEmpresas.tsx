'use client';

import React, { useMemo, useCallback } from 'react';
import styles from './ConcentracionEmpresas.module.css';
import { useFilteredPanels } from '@/hooks/useFilteredPanels';
import { useFilterStore } from '@/store/useFilterStore';
import { useUIStore } from '@/store/useUIStore';
import { Panel } from '@/types';

interface EmpresaRanked {
  nombre: string;
  cantidad: number;
  porcentaje: number;
  paneles: Panel[];
  bounds: [[number, number], [number, number]];
}

export default function ConcentracionEmpresas() {
  const paneles = useFilteredPanels();
  const empresasFiltro = useFilterStore((state) => state.filtros.empresas);
  const setFilter = useFilterStore((state) => state.setFilter);
  const clearFilter = useFilterStore((state) => state.clearFilter);
  const setCorredorActivo = useUIStore((state) => state.setCorredorActivo);
  const limpiarCorredorActivo = useUIStore((state) => state.limpiarCorredorActivo);
  const flyTo = useUIStore((state) => state.flyTo);

  // Recálculo reactivo en memoria: agrupa por empresa concesionaria
  const ranking = useMemo(() => {
    const grupos = new Map<string, Panel[]>();

    for (const panel of paneles) {
      const emp = panel.empresa?.trim() || 'Empresa sin registrar';
      const actual = grupos.get(emp);
      if (actual) {
        actual.push(panel);
      } else {
        grupos.set(emp, [panel]);
      }
    }

    const total = paneles.length;
    const resultado: EmpresaRanked[] = [];

    for (const [nombre, items] of grupos.entries()) {
      let minLng = Infinity;
      let maxLng = -Infinity;
      let minLat = Infinity;
      let maxLat = -Infinity;

      for (const p of items) {
        if (typeof p.longitud === 'number' && typeof p.latitud === 'number' && !isNaN(p.longitud) && !isNaN(p.latitud)) {
          if (p.longitud < minLng) minLng = p.longitud;
          if (p.longitud > maxLng) maxLng = p.longitud;
          if (p.latitud < minLat) minLat = p.latitud;
          if (p.latitud > maxLat) maxLat = p.latitud;
        }
      }

      const padLng = Math.max((maxLng - minLng) * 0.15, 0.005);
      const padLat = Math.max((maxLat - minLat) * 0.15, 0.005);

      const bounds: [[number, number], [number, number]] = [
        [minLng - padLng, minLat - padLat],
        [maxLng + padLng, maxLat + padLat],
      ];

      resultado.push({
        nombre,
        cantidad: items.length,
        porcentaje: total > 0 ? Math.round((items.length / total) * 100) : 0,
        paneles: items,
        bounds,
      });
    }

    return resultado.sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
  }, [paneles]);

  const maxCantidad = useMemo(() => {
    if (ranking.length === 0) return 1;
    return Math.max(...ranking.map((r) => r.cantidad), 1);
  }, [ranking]);

  const empresaActiva = empresasFiltro.length === 1 ? empresasFiltro[0] : null;

  const handleEmpresaClick = useCallback((item: EmpresaRanked) => {
    // Si ya está seleccionada esta empresa, deseleccionar
    if (empresaActiva === item.nombre) {
      clearFilter('empresas');
      limpiarCorredorActivo();
      return;
    }

    // 1. Activar el filtro de empresa
    setFilter('empresas', [item.nombre]);

    // 2. Activar las balizas de parpadeo suave para los paneles de esta concesionaria
    setCorredorActivo({
      nombre: `Empresa: ${item.nombre}`,
      paneles: item.paneles,
      bounds: item.bounds,
    });
  }, [empresaActiva, clearFilter, limpiarCorredorActivo, setFilter, setCorredorActivo]);

  const handleReset = useCallback(() => {
    clearFilter('empresas');
    limpiarCorredorActivo();
    flyTo([-77.0428, -12.0464], 12);
  }, [clearFilter, limpiarCorredorActivo, flyTo]);

  return (
    <div className={styles.empresasContainer}>
      {/* Encabezado */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div className={styles.titleIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 21h18M3 7v14M21 7v14M9 3h6v4H9zM9 11h2v2H9zM13 11h2v2h-2zM9 15h2v2H9zM13 15h2v2h-2z" />
            </svg>
          </div>
          <div>
            <h3 className={styles.title}>Empresas Concesionarias</h3>
            <span className={styles.subtitle}>Top 10 operadores con mayor presencia</span>
          </div>
        </div>

        <span className={styles.badgeTop10}>Top 10</span>
      </div>

      {/* Aviso de empresa activa con botón para restablecer */}
      {empresaActiva && (
        <div className={styles.activeEmpresaNotice}>
          <span>Enfocando: <strong>{empresaActiva}</strong></span>
          <button
            type="button"
            className={styles.resetEmpresaBtn}
            onClick={handleReset}
            title="Quitar filtro de empresa"
          >
            Ver todas las empresas ✕
          </button>
        </div>
      )}

      {/* Lista de Barras de Empresas */}
      <div className={styles.listContainer}>
        {ranking.length === 0 ? (
          <div className={styles.emptyNotice}>
            No hay empresas para mostrar en la vista actual.
          </div>
        ) : (
          ranking.map((item, index) => {
            const porcentajeRelativo = Math.round((item.cantidad / maxCantidad) * 100);
            const isSelected = empresaActiva === item.nombre;

            return (
              <button
                key={item.nombre}
                type="button"
                className={`${styles.empresaItem} ${isSelected ? styles.empresaItemSelected : ''}`}
                onClick={() => handleEmpresaClick(item)}
                title={`Hacer clic para enfocar los ${item.cantidad} paneles de ${item.nombre} en el mapa`}
              >
                <div className={styles.metaRow}>
                  <div className={styles.rankAndName}>
                    <span className={`${styles.rankBadge} ${isSelected ? styles.rankBadgeActive : ''}`}>
                      {index + 1}
                    </span>
                    <span className={styles.empresaNombre}>{item.nombre}</span>
                  </div>

                  <div className={styles.statsRow}>
                    <span className={styles.pctBadge}>{item.porcentaje}%</span>
                    <span className={styles.countBadge}>
                      {item.cantidad} {item.cantidad === 1 ? 'panel' : 'paneles'}
                    </span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className={styles.progressTrack}>
                  <div
                    className={`${styles.progressBar} ${isSelected ? styles.progressBarActive : ''}`}
                    style={{ width: `${porcentajeRelativo}%` }}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

