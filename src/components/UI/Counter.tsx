'use client';

import React from 'react';
import styles from './Counter.module.css';
import { formatearNumero } from '@/lib/utils';

interface CounterProps {
  totalPaneles: number;
  totalDistritos: number;
  totalEmpresas: number;
  filtered?: boolean;
}

export default function Counter({
  totalPaneles,
  totalDistritos,
  totalEmpresas,
  filtered = false,
}: CounterProps) {
  return (
    <div className={styles.counter} aria-live="polite">
      <span className={styles.counterValue}>{formatearNumero(totalPaneles)}</span>
      <span>{filtered ? 'paneles filtrados' : 'paneles'}</span>
      <span className={styles.counterDot} />
      <span className={styles.counterValue}>{totalDistritos}</span>
      <span>distritos</span>
      <span className={styles.counterDot} />
      <span className={styles.counterValue}>{totalEmpresas}</span>
      <span>empresas</span>
    </div>
  );
}
