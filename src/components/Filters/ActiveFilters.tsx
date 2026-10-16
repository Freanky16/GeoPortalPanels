'use client';

import React from 'react';
import styles from './ActiveFilters.module.css';
import { useFilterStore } from '@/store/useFilterStore';
import { FiltrosActivos } from '@/types';

type FilterKey = keyof Omit<FiltrosActivos, 'busqueda'>;

export default function ActiveFilters() {
  const filtros = useFilterStore((state) => state.filtros);
  const toggleFilter = useFilterStore((state) => state.toggleFilter);
  const clearAll = useFilterStore((state) => state.clearAll);
  const setBusqueda = useFilterStore((state) => state.setBusqueda);
  const hayFiltros = useFilterStore((state) => state.hayFiltrosActivos());

  if (!hayFiltros) return null;

  // Recopilar todos los filtros activos en un solo array plano para renderizarlos
  const activeTags: { key: FilterKey | 'busqueda'; valor: string; label: string }[] = [];

  if (filtros.busqueda) {
    activeTags.push({
      key: 'busqueda',
      valor: filtros.busqueda,
      label: `Búsqueda: ${filtros.busqueda}`,
    });
  }

  Object.entries(filtros).forEach(([k, v]) => {
    if (k === 'busqueda') return;
    const key = k as FilterKey;
    const valores = v as string[];
    valores.forEach((valor) => {
      activeTags.push({
        key,
        valor,
        label: valor,
      });
    });
  });

  const handleRemove = (tag: typeof activeTags[0]) => {
    if (tag.key === 'busqueda') {
      setBusqueda('');
    } else {
      toggleFilter(tag.key, tag.valor);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Filtros activos</span>
        <button className={styles.clearAllBtn} onClick={clearAll}>
          Limpiar todo
        </button>
      </div>
      <div className={styles.chipsWrapper}>
        {activeTags.map((tag, idx) => (
          <div key={`${tag.key}-${idx}`} className={styles.activeChip}>
            <span>{tag.label}</span>
            <button
              className={styles.removeBtn}
              onClick={() => handleRemove(tag)}
              aria-label={`Quitar filtro ${tag.label}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
