'use client';
import React from 'react';
import styles from './QuickViewBar.module.css';
import { useFilterStore } from '@/store/useFilterStore';
import { EstadoContrato } from '@/types';

export default function QuickViewBar() {
  const aplicarVistaRapida = useFilterStore((state) => state.aplicarVistaRapida);

  const vistas = [
    {
      label: 'Por Vencer (< 12 meses)',
      color: '#F59E0B', // Ambar institucional
      filtros: { estadosContrato: ['por_vencer'] as EstadoContrato[] },
    },
    {
      label: 'Contratos Vigentes',
      color: '#10B981', // Verde institucional
      filtros: { estadosContrato: ['vigente'] as EstadoContrato[] },
    },
    {
      label: 'Contratos Vencidos',
      color: '#EF4444', // Rojo institucional
      filtros: { estadosContrato: ['vencido'] as EstadoContrato[] },
    },
    {
      label: 'Paneles Monumentales',
      color: '#0D9488', // Teal — distinguible y no azul neón
      filtros: { tiposEPE: ['Panel monumental', 'Panel monumental unipolar', 'Panel monumental volumétrico'] },
    },
  ];

  return (
    <div className={styles.quickViewContainer}>
      {vistas.map((vista, idx) => (
        <button
          key={idx}
          className={styles.quickViewBtn}
          onClick={() => aplicarVistaRapida(vista.filtros)}
        >
          <span className={styles.indicator} style={{ backgroundColor: vista.color }} />
          {vista.label}
        </button>
      ))}
    </div>
  );
}
