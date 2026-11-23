'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { MAP_STYLE_NAMES, MapStyleKey } from '@/lib/mapConfig';
import styles from './MapControls.module.css';

export default function MapSwitcher() {
  const mapStyle = useUIStore((state) => state.mapStyle);
  const setMapStyle = useUIStore((state) => state.setMapStyle);
  const capaSistemaVialActiva = useUIStore((state) => state.capaSistemaVialActiva);
  const toggleCapaSistemaVial = useUIStore((state) => state.toggleCapaSistemaVial);
  const capaZonificacionActiva = useUIStore((state) => state.capaZonificacionActiva);
  const toggleCapaZonificacion = useUIStore((state) => state.toggleCapaZonificacion);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.mapSwitcher}>
      <button
        className={`${styles.switcherToggle} ${capaSistemaVialActiva || capaZonificacionActiva ? styles.switcherToggleActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Cambiar capa del mapa"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
        <span className={styles.switcherLabel}>Capas</span>
      </button>

      {isOpen && (
        <div className={styles.switcherPanel}>
          <div className={styles.switcherTitle}>Estilo de Mapa</div>
          {Object.entries(MAP_STYLE_NAMES).map(([key, name]) => (
            <button
              key={key}
              className={`${styles.styleOption} ${mapStyle === key ? styles.styleOptionActive : ''}`}
              onClick={() => {
                setMapStyle(key as MapStyleKey);
              }}
            >
              <span className={styles.styleRadio}>
                {mapStyle === key && <span className={styles.styleRadioInner} />}
              </span>
              {name}
            </button>
          ))}

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />

          {/* Sección Capas MML solicitada por el usuario */}
          <div className={styles.switcherTitle}>Capas MML</div>

          <button
            className={`${styles.styleOption} ${capaSistemaVialActiva ? styles.styleOptionActive : ''}`}
            onClick={() => toggleCapaSistemaVial()}
          >
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: `2px solid ${capaSistemaVialActiva ? '#0D9488' : 'var(--text-muted)'}`,
                background: capaSistemaVialActiva ? '#0D9488' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 900,
              }}
            >
              {capaSistemaVialActiva ? '✓' : ''}
            </span>
            Sistema Vial
          </button>

          <button
            className={`${styles.styleOption} ${capaZonificacionActiva ? styles.styleOptionActive : ''}`}
            onClick={() => toggleCapaZonificacion()}
          >
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: `2px solid ${capaZonificacionActiva ? '#0D9488' : 'var(--text-muted)'}`,
                background: capaZonificacionActiva ? '#0D9488' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 900,
              }}
            >
              {capaZonificacionActiva ? '✓' : ''}
            </span>
            Zonificación
          </button>
        </div>
      )}
    </div>
  );
}
