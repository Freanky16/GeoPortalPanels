'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { MAP_STYLE_NAMES, MapStyleKey } from '@/lib/mapConfig';
import styles from './MapControls.module.css';

export default function MapSwitcher() {
  const mapStyle = useUIStore((state) => state.mapStyle);
  const setMapStyle = useUIStore((state) => state.setMapStyle);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.mapSwitcher}>
      <button
        className={styles.switcherToggle}
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
          <div className={styles.switcherTitle}>🗺️ Estilo de Mapa</div>
          {Object.entries(MAP_STYLE_NAMES).map(([key, name]) => (
            <button
              key={key}
              className={`${styles.styleOption} ${mapStyle === key ? styles.styleOptionActive : ''}`}
              onClick={() => {
                setMapStyle(key as MapStyleKey);
                setIsOpen(false);
              }}
            >
              <span className={styles.styleRadio}>
                {mapStyle === key && <span className={styles.styleRadioInner} />}
              </span>
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
