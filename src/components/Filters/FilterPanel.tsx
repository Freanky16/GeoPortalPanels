'use client';

import React from 'react';
import styles from './FilterPanel.module.css';
import GlassCard from '../UI/GlassCard';
import FilterGroup from './FilterGroup';
import ActiveFilters from './ActiveFilters';
import { useUIStore } from '@/store/useUIStore';
import { usePanelStore } from '@/store/usePanelStore';

export default function FilterPanel() {
  const isOpen = useUIStore((state) => state.filtrosPanelAbierto);
  const togglePanel = useUIStore((state) => state.toggleFiltrosPanel);
  const catalogos = usePanelStore((state) => state.catalogos);

  // Mapeamos los estados fijos de contrato para el filtro
  const estadosContrato = [
    { id: 'vigente', nombre: 'vigente' },
    { id: 'por_vencer', nombre: 'por_vencer' },
    { id: 'vencido', nombre: 'vencido' },
    { id: 'sin_dato', nombre: 'sin_dato' },
  ];

  return (
    <>
      {/* Panel principal */}
      <GlassCard className={`${styles.panelContainer} ${!isOpen ? styles.panelClosed : ''}`}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filtros
          </div>
          <button className={styles.closeButton} onClick={togglePanel} aria-label="Cerrar filtros">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.scrollArea}>
          <ActiveFilters />

          <FilterGroup
            title="Estado del Contrato"
            filterKey="estadosContrato"
            panelKey="estadoContrato"
            options={estadosContrato}
          />
          <FilterGroup
            title="Distrito"
            filterKey="distritos"
            panelKey="distrito"
            options={catalogos.distritos}
            searchable
          />
          <FilterGroup
            title="Empresa"
            filterKey="empresas"
            panelKey="empresa"
            options={catalogos.empresas}
            searchable
          />
          <FilterGroup
            title="Tipo de Panel (EPE)"
            filterKey="tiposEPE"
            panelKey="tipoEPE"
            options={catalogos.tiposEPE}
          />
          <FilterGroup
            title="Características"
            filterKey="caracteristicasTecnicas"
            panelKey="caracteristicaTecnica"
            options={catalogos.caracteristicasTecnicas}
          />
          <FilterGroup
            title="Espacio Publicitario"
            filterKey="espaciosPublicitarios"
            panelKey="espacioPublicitario"
            options={catalogos.espaciosPublicitarios}
          />
        </div>
      </GlassCard>
    </>
  );
}
