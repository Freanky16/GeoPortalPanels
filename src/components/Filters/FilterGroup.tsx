'use client';

import React, { useState, useMemo } from 'react';
import styles from './FilterGroup.module.css';
import FilterChip from './FilterChip';
import { useFilterStore } from '@/store/useFilterStore';
import { useFilterCounts } from '@/hooks/useFilteredPanels';
import { FiltrosActivos, Panel } from '@/types';

interface FilterGroupProps {
  title: string;
  filterKey: keyof Omit<FiltrosActivos, 'busqueda'>;
  panelKey: keyof Panel;
  options: { id: string; nombre: string }[];
  searchable?: boolean;
}

export default function FilterGroup({
  title,
  filterKey,
  panelKey,
  options,
  searchable = false,
}: FilterGroupProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const activeFilters = useFilterStore((state) => state.filtros[filterKey] as string[]);
  const toggleFilter = useFilterStore((state) => state.toggleFilter);
  const counts = useFilterCounts(panelKey, filterKey);

  // Filtrar opciones por búsqueda interna y ordenarlas (las activas primero)
  const displayOptions = useMemo(() => {
    let filtered = options;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = options.filter(opt => opt.nombre.toLowerCase().includes(lower));
    }
    
    // Ordenar: primero seleccionados, luego con resultados > 0, luego el resto
    return [...filtered].sort((a, b) => {
      const aActive = activeFilters.includes(a.nombre);
      const bActive = activeFilters.includes(b.nombre);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      const aCount = counts[a.nombre] || 0;
      const bCount = counts[b.nombre] || 0;
      return bCount - aCount;
    });
  }, [options, searchTerm, activeFilters, counts]);

  return (
    <div className={styles.groupContainer}>
      <div className={styles.groupHeader} onClick={() => setIsOpen(!isOpen)}>
        <span className={styles.groupTitle}>{title}</span>
        <svg
          className={`${styles.toggleIcon} ${isOpen ? styles.open : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div className={styles.groupContent}>
          {searchable && options.length > 5 && (
            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={`Buscar ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          <div className={styles.chipsContainer}>
            {displayOptions.map((opt) => {
              const count = counts[opt.nombre] || 0;
              const isActive = activeFilters.includes(opt.nombre);
              // Si no hay resultados y no está activo, atenuar
              const isDimmed = count === 0 && !isActive;

              return (
                <FilterChip
                  key={opt.id}
                  label={opt.nombre}
                  count={count}
                  active={isActive}
                  dimmed={isDimmed}
                  onToggle={() => toggleFilter(filterKey, opt.nombre)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
