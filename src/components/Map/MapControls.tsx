'use client';

import React from 'react';
import styles from './MapControls.module.css';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export default function MapControls({ onZoomIn, onZoomOut, onResetView }: MapControlsProps) {
  return (
    <div className={styles.controlsContainer}>
      <button className={styles.controlBtn} onClick={onZoomIn} aria-label="Acercar" title="Acercar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button className={styles.controlBtn} onClick={onZoomOut} aria-label="Alejar" title="Alejar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <div className={styles.divider} />
      <button className={styles.controlBtn} onClick={onResetView} aria-label="Vista inicial" title="Volver a Lima">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  );
}
