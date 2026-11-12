'use client';

import React, { useMemo, useCallback } from 'react';
import styles from './DensidadDistritos.module.css';
import { useFilteredPanels } from '@/hooks/useFilteredPanels';
import { useFilterStore } from '@/store/useFilterStore';
import { useUIStore } from '@/store/useUIStore';
import { Panel } from '@/types';

interface DistritoRanked {
  nombre: string;
  cantidad: number;
  porcentaje: number;
  paneles: Panel[];
  bounds: [[number, number], [number, number]];
}

export default function DensidadDistritos() {
  const paneles = useFilteredPanels();
  const distritosFiltro = useFilterStore((state) => state.filtros.distritos);
  const setFilter = useFilterStore((state) => state.setFilter);
  const clearFilter = useFilterStore((state) => state.clearFilter);
  const setCorredorActivo = useUIStore((state) => state.setCorredorActivo);
  const limpiarCorredorActivo = useUIStore((state) => state.limpiarCorredorActivo);
  const flyTo = useUIStore((state) => state.flyTo);

  // Recálculo reactivo en memoria: agrupa por distrito y calcula métricas
  const ranking = useMemo(() => {
    const grupos = new Map<string, Panel[]>();

    for (const panel of paneles) {
      const dist = panel.distrito?.trim() || 'Sin distrito asignado';
      const actual = grupos.get(dist);
      if (actual) {
        actual.push(panel);
      } else {
        grupos.set(dist, [panel]);
      }
    }

    const total = paneles.length;
    const resultado: DistritoRanked[] = [];

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

  const distritoActivo = distritosFiltro.length === 1 ? distritosFiltro[0] : null;

  const handleDistritoClick = useCallback((item: DistritoRanked) => {
    // Si ya está seleccionado este distrito, deseleccionar
    if (distritoActivo === item.nombre) {
      clearFilter('distritos');
      limpiarCorredorActivo();
      return;
    }

    // 1. Activar el filtro de distrito (resalta los límites perimetrales oficiales en el mapa)
    setFilter('distritos', [item.nombre]);

    // 2. Activar las balizas de parpadeo multitudinario para los paneles de este distrito
    setCorredorActivo({
      nombre: `Distrito: ${item.nombre}`,
      paneles: item.paneles,
      bounds: item.bounds,
    });
  }, [distritoActivo, clearFilter, limpiarCorredorActivo, setFilter, setCorredorActivo]);

  const handleReset = useCallback(() => {
    clearFilter('distritos');
    limpiarCorredorActivo();
    flyTo([-77.0428, -12.0464], 12);
  }, [clearFilter, limpiarCorredorActivo, flyTo]);

  return (
    <div className={styles.densidadContainer}>
      {/* Encabezado */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div className={styles.titleIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <div>
            <h3 className={styles.title}>Densidad por Distrito</h3>
            <span className={styles.subtitle}>Top 10 jurisdicciones con mayor concentración</span>
          </div>
        </div>

        <span className={styles.badgeTop10}>Top 10</span>
      </div>

      {/* Aviso de distrito activo con botón para restablecer */}
      {distritoActivo && (
        <div className={styles.activeDistritoNotice}>
          <span>Enfocando: <strong>{distritoActivo}</strong></span>
          <button
            type="button"
            className={styles.resetDistritoBtn}
            onClick={handleReset}
            title="Quitar filtro de distrito"
          >
            Ver todos los distritos ✕
          </button>
        </div>
      )}

      {/* Lista de Barras de Distritos */}
      <div className={styles.listContainer}>
        {ranking.length === 0 ? (
          <div className={styles.emptyNotice}>
            No hay distritos para mostrar en la vista actual.
          </div>
        ) : (
          ranking.map((item, index) => {
            const porcentajeRelativo = Math.round((item.cantidad / maxCantidad) * 100);
            const isSelected = distritoActivo === item.nombre;

            return (
              <button
                key={item.nombre}
                type="button"
                className={`${styles.distritoItem} ${isSelected ? styles.distritoItemSelected : ''}`}
                onClick={() => handleDistritoClick(item)}
                title={`Hacer clic para enfocar los ${item.cantidad} paneles de ${item.nombre} en el mapa`}
              >
                <div className={styles.metaRow}>
                  <div className={styles.rankAndName}>
                    <span className={`${styles.rankBadge} ${isSelected ? styles.rankBadgeActive : ''}`}>
                      {index + 1}
                    </span>
                    <span className={styles.distritoNombre}>{item.nombre}</span>
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

