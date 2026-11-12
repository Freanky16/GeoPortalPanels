'use client';

import React from 'react';
import styles from './DashboardPanel.module.css';
import RankingVias from './RankingVias';
import DensidadDistritos from './DensidadDistritos';
import ConcentracionEmpresas from './ConcentracionEmpresas';
import StatsCards from './StatsCards';
import { useUIStore } from '@/store/useUIStore';

export default function DashboardPanel() {
  const isOpen = useUIStore((state) => state.dashboardAbierto);
  const toggleDashboard = useUIStore((state) => state.toggleDashboard);

  return (
    <div className={`${styles.dashboardContainer} ${!isOpen ? styles.dashboardClosed : ''}`}>
      {/* Botón Flotante para abrir/cerrar */}
      <button className={styles.toggleBtn} onClick={toggleDashboard} aria-label="Alternar panel de análisis de datos">
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
        {isOpen ? 'Ocultar Métricas de la Ciudad' : 'Ver Análisis y Métricas de Lima'}
      </button>

      <div className={styles.content}>
        {/* Fila Superior: Cifras de impacto */}
        <div className={styles.statsWrapper}>
          <StatsCards />
        </div>

        {/* Fila Principal: Panel de Métricas Territoriales (Tríada Estratégica MML) */}
        <div className={styles.metricsGrid}>
          {/* Métrica 1: Ranking de Ejes y Vías (Interactivo) */}
          <div className={styles.metricColumn}>
            <RankingVias />
          </div>

          {/* Métrica 2: Densidad por Distrito (Top 10) */}
          <div className={styles.metricColumn}>
            <DensidadDistritos />
          </div>

          {/* Métrica 3: Concentración por Empresa Concesionaria (Top 10) */}
          <div className={styles.metricColumn}>
            <ConcentracionEmpresas />
          </div>
        </div>
      </div>
    </div>
  );
}
