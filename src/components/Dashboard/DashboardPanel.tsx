'use client';

import React from 'react';
import styles from './DashboardPanel.module.css';
import ChartContratos from './ChartContratos';
import ChartDistrito from './ChartDistrito';
import ChartTipoEPE from './ChartTipoEPE';
import ChartEmpresas from './ChartEmpresas';
import ChartTimeline from './ChartTimeline';
import StatsCards from './StatsCards';
import { useUIStore } from '@/store/useUIStore';

export default function DashboardPanel() {
  const isOpen = useUIStore((state) => state.dashboardAbierto);
  const toggleDashboard = useUIStore((state) => state.toggleDashboard);

  return (
    <div className={`${styles.dashboardContainer} ${!isOpen ? styles.dashboardClosed : ''}`}>
      <button className={styles.toggleBtn} onClick={toggleDashboard} aria-label="Alternar panel de gráficos">
        <svg
          className={`${styles.toggleIcon} ${isOpen ? styles.toggleIconOpen : ''}`}
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
        {isOpen ? 'Ocultar Analítica' : 'Ver Analítica'}
      </button>

      <div className={styles.content}>
        <div style={{ width: '100%', marginBottom: '16px' }}>
          <StatsCards />
        </div>
        <ChartContratos />
        <ChartDistrito />
        <ChartTipoEPE />
        <ChartEmpresas />
        <ChartTimeline />
      </div>
    </div>
  );
}
