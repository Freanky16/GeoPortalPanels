'use client';

import React from 'react';
import styles from './DashboardPanel.module.css';
import RankingVias from './RankingVias';
import DensidadDistritos from './DensidadDistritos';
import StatsCards from './StatsCards';
import { useUIStore } from '@/store/useUIStore';

export default function DashboardPanel() {
  const isOpen = useUIStore((state) => state.dashboardAbierto);
  const toggleDashboard = useUIStore((state) => state.toggleDashboard);

  return (
    <div className={`${styles.dashboardContainer} ${!isOpen ? styles.dashboardClosed : ''}`}>
      {/* Botón Flotante para abrir/cerrar */}
      <button className={styles.toggleBtn} onClick={toggleDashboard} aria-label="Alternar panel de analítica vial">
        <svg
          className={`${styles.toggleIcon} ${isOpen ? styles.toggleIconOpen : ''}`}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
        {isOpen ? 'Ocultar Analítica Territorial' : 'Ver Analítica Territorial'}
      </button>

      <div className={styles.content}>
        {/* Fila Superior: Cifras de impacto */}
        <div className={styles.statsWrapper}>
          <StatsCards />
        </div>

        {/* Fila Principal: Métricas Territoriales Estratégicas */}
        <div className={styles.metricsGrid}>
          {/* Métrica A: Ranking de Ejes y Vías (Interactivo) */}
          <div className={styles.metricColumn}>
            <RankingVias />
          </div>

          {/* Métrica B: Densidad por Distrito (Top 10) */}
          <div className={styles.metricColumn}>
            <DensidadDistritos />
          </div>
        </div>
      </div>
    </div>
  );
}
