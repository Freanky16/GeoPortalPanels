'use client';

import React from 'react';
import styles from './MapLegend.module.css';
import { useUIStore } from '@/store/useUIStore';
import { ESTADO_COLORS, ESTADO_LABELS, TIPO_EPE_COLORS } from '@/lib/constants';

export default function MapLegend() {
  const isOpen = useUIStore((state) => state.leyendaAbierta);
  const toggleLeyenda = useUIStore((state) => state.toggleLeyenda);
  const setLeyendaAbierta = useUIStore((state) => state.setLeyendaAbierta);
  const colorScheme = useUIStore((state) => state.colorScheme);
  const setColorScheme = useUIStore((state) => state.setColorScheme);

  const schemes = [
    { key: 'estado_contrato' as const, label: 'Estado Legal' },
    { key: 'tipo_epe' as const, label: 'Tipo EPE' },
  ];

  const legendItems = colorScheme === 'tipo_epe'
    ? Object.entries(TIPO_EPE_COLORS).map(([label, color]) => ({
        color,
        label,
      }))
    : Object.entries(ESTADO_COLORS).map(([key, color]) => ({
        color,
        label: ESTADO_LABELS[key] || key,
      }));

  return (
    <div className={styles.legendWrapper}>
      <button
        className={styles.legendToggle}
        onClick={toggleLeyenda}
        aria-label="Alternar leyenda"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>Leyenda</span>
      </button>

      {isOpen && (
        <div className={styles.legendContainer}>
          <div className={styles.legendHeader}>
            <span style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1A73E8' }}>
              Leyenda
            </span>
            <button
              onClick={() => setLeyendaAbierta(false)}
              style={{ background: 'none', border: 'none', color: '#70757A', cursor: 'pointer', padding: 2 }}
              aria-label="Cerrar simbología"
            >
              ✕
            </button>
          </div>

          {/* Color scheme switcher */}
          <div className={styles.schemeSelector}>
            {schemes.map((s) => (
              <button
                key={s.key}
                className={`${styles.schemeBtn} ${colorScheme === s.key ? styles.schemeBtnActive : ''}`}
                onClick={() => setColorScheme(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Legend items */}
          <div className={styles.legendItems}>
            {legendItems.map((item) => (
              <div className={styles.legendItem} key={item.label}>
                <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
                <span className={styles.legendLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
