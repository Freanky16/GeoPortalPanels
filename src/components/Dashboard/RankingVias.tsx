'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './RankingVias.module.css';
import { useFilteredPanels } from '@/hooks/useFilteredPanels';
import { useUIStore } from '@/store/useUIStore';
import { usePanelStore } from '@/store/usePanelStore';
import { calcularRankingVias, CategoriaVia, ViaRanked } from '@/lib/viasNormalizer';

export default function RankingVias() {
  const [categoria, setCategoria] = useState<CategoriaVia>('todas');
  const paneles = useFilteredPanels();
  const corredorActivo = useUIStore((state) => state.corredorActivo);
  const setCorredorActivo = useUIStore((state) => state.setCorredorActivo);
  const limpiarCorredorActivo = useUIStore((state) => state.limpiarCorredorActivo);
  const seleccionarPanel = usePanelStore((state) => state.seleccionarPanel);

  // Recálculo reactivo y automático en memoria (< 5 ms)
  const ranking = useMemo(() => {
    return calcularRankingVias(paneles, categoria, 10);
  }, [paneles, categoria]);

  // Cantidad máxima del ranking para normalizar visualmente la barra al 100%
  const maxCantidad = useMemo(() => {
    if (ranking.length === 0) return 1;
    return Math.max(...ranking.map((r) => r.cantidad), 1);
  }, [ranking]);

  const handleViaClick = useCallback((item: ViaRanked) => {
    // Si ya está activo este corredor, deseleccionar al hacer clic de nuevo
    if (corredorActivo?.nombre === item.nombre) {
      limpiarCorredorActivo();
      return;
    }

    // 1. Activar el corredor en el mapa con su encuadre exacto (fitBounds) y paneles
    setCorredorActivo({
      nombre: item.nombre,
      paneles: item.paneles,
      bounds: item.bounds,
    });

    // 2. Si tiene paneles, seleccionar el primero para ficha técnica
    if (item.paneles.length > 0) {
      seleccionarPanel(item.paneles[0]);
    }
  }, [corredorActivo, setCorredorActivo, limpiarCorredorActivo, seleccionarPanel]);

  return (
    <div className={styles.rankingContainer}>
      {/* Encabezado y Selector Integrado */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div className={styles.titleIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 19L8 5M16 19L20 5M12 7V9M12 13V15M12 19V21" />
            </svg>
          </div>
          <div>
            <h3 className={styles.title}>Ranking de Ejes y Vías</h3>
            <span className={styles.subtitle}>Top 10 arterias con mayor concentración</span>
          </div>
        </div>

        {/* Selector de 3 niveles */}
        <div className={styles.tabsGroup} role="tablist">
          <button
            type="button"
            className={`${styles.tabBtn} ${categoria === 'todas' ? styles.tabBtnActive : ''}`}
            onClick={() => setCategoria('todas')}
          >
            Todas
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${categoria === 'ejes' ? styles.tabBtnActive : ''}`}
            onClick={() => setCategoria('ejes')}
          >
            Ejes / Av.
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${categoria === 'calles' ? styles.tabBtnActive : ''}`}
            onClick={() => setCategoria('calles')}
          >
            Calles
          </button>
        </div>
      </div>

      {/* Aviso de corredor activo con botón de restablecer */}
      {corredorActivo && (
        <div className={styles.activeCorredorNotice}>
          <span>Enfocando: <strong>{corredorActivo.nombre}</strong> ({corredorActivo.paneles.length} paneles)</span>
          <button
            type="button"
            className={styles.resetCorredorBtn}
            onClick={limpiarCorredorActivo}
            title="Quitar enfoque de la vía"
          >
            Ver toda la ciudad ✕
          </button>
        </div>
      )}

      {/* Lista de Barras Interactivas */}
      <div className={styles.listContainer}>
        {ranking.length === 0 ? (
          <div className={styles.emptyNotice}>
            No se encontraron vías con paneles en el filtro actual.
          </div>
        ) : (
          ranking.map((item, index) => {
            const porcentajeRelativo = Math.round((item.cantidad / maxCantidad) * 100);
            const isSelected = corredorActivo?.nombre === item.nombre;

            return (
              <button
                key={item.nombre}
                type="button"
                className={`${styles.viaItem} ${isSelected ? styles.viaItemSelected : ''}`}
                onClick={() => handleViaClick(item)}
                title={`Hacer clic para enfocar los ${item.cantidad} paneles de ${item.nombre} en el mapa`}
              >
                <div className={styles.viaMetaRow}>
                  <div className={styles.viaRankAndName}>
                    <span className={`${styles.rankBadge} ${isSelected ? styles.rankBadgeActive : ''}`}>
                      {index + 1}
                    </span>
                    <span className={styles.viaNombre}>{item.nombre}</span>
                  </div>

                  <div className={styles.viaStats}>
                    <span className={styles.countBadge}>
                      {item.cantidad} {item.cantidad === 1 ? 'panel' : 'paneles'}
                    </span>
                  </div>
                </div>

                {/* Barra de Progreso uniforme institucional */}
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
