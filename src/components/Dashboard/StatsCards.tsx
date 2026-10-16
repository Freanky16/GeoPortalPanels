'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useFilteredPanels } from '@/hooks/useFilteredPanels';
import { ESTADO_COLORS, ESTADO_LABELS } from '@/lib/constants';
import styles from './DashboardPanel.module.css';

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    function animate(time: number) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplayed(current);
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value]);

  return <span>{displayed.toLocaleString('es-PE')}</span>;
}

export default function StatsCards() {
  const paneles = useFilteredPanels();

  const stats = useMemo(() => {
    const total = paneles.length;
    const distritos = new Set(paneles.map(p => p.distrito)).size;
    const empresas = new Set(paneles.filter(p => p.empresa).map(p => p.empresa)).size;

    const estados = { vigente: 0, por_vencer: 0, vencido: 0, sin_dato: 0 };
    paneles.forEach(p => { estados[p.estadoContrato]++; });

    return { total, distritos, empresas, estados };
  }, [paneles]);

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statCard}>
        <div className={styles.statValue}><AnimatedNumber value={stats.total} /></div>
        <div className={styles.statLabel}>Total Paneles</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statValue}><AnimatedNumber value={stats.distritos} /></div>
        <div className={styles.statLabel}>Distritos</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statValue}><AnimatedNumber value={stats.empresas} /></div>
        <div className={styles.statLabel}>Empresas</div>
      </div>
      {Object.entries(stats.estados).map(([key, count]) => (
        <div className={styles.statCard} key={key}>
          <div className={styles.statValue} style={{ color: ESTADO_COLORS[key] }}>
            <AnimatedNumber value={count} />
          </div>
          <div className={styles.statLabel}>{ESTADO_LABELS[key]}</div>
        </div>
      ))}
    </div>
  );
}
