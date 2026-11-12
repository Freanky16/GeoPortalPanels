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
  const flyTo = useUIStore((state) => state.flyTo);
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
    // 1. Vuelo animado y suave hacia el corredor vial
    flyTo(item.centroide, 15);

    // 2. Si tiene paneles, enfocar el primer elemento del grupo para abrir ficha
    if (item.paneles.length > 0) {
      seleccionarPanel(item.paneles[0]);
    }
  }, [flyTo, seleccionarPanel]);

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
            <span className={styles.subtitle}>Top 10 arterias con mayor densidad</span>
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

      {/* Lista de Barras Interactivas */}
      <div className={styles.listContainer}>
        {ranking.length === 0 ? (
          <div className={styles.emptyNotice}>
            No se encontraron vías con paneles en la vista o filtro actual.
          </div>
        ) : (
          ranking.map((item, index) => {
            const porcentajeRelativo = Math.round((item.cantidad / maxCantidad) * 100);
            const isTop3 = index < 3;

            return (
              <button
                key={item.nombre}
                type="button"
                className={styles.viaItem}
                onClick={() => handleViaClick(item)}
                title={`Hacer clic para enfocar los ${item.cantidad} paneles de ${item.nombre} en el mapa`}
              >
                <div className={styles.viaMetaRow}>
                  <div className={styles.viaRankAndName}>
                    <span className={`${styles.rankBadge} ${isTop3 ? styles.rankBadgeTop : ''}`}>
                      {index + 1}
                    </span>
                    <span className={styles.viaNombre}>{item.nombre}</span>
                  </div>

                  <div className={styles.viaStats}>
                    <span className={`${styles.tipoTag} ${item.categoria === 'eje' ? styles.tipoEje : styles.tipoCalle}`}>
                      {item.categoria === 'eje' ? 'Eje' : 'Local'}
                    </span>
                    <span className={styles.countBadge}>
                      {item.cantidad}
                    </span>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div className={styles.progressTrack}>
                  <div
                    className={`${styles.progressBar} ${isTop3 ? styles.progressBarTop : ''}`}
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

