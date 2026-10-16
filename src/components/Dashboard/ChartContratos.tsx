'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import styles from './DashboardPanel.module.css';
import { useFilteredPanels } from '@/hooks/useFilteredPanels';
import { ESTADO_COLORS, ESTADO_LABELS } from '@/lib/constants';
import { useFilterStore } from '@/store/useFilterStore';

export default function ChartContratos() {
  const paneles = useFilteredPanels();
  const toggleFilter = useFilterStore((state) => state.toggleFilter);

  // Procesar datos para el gráfico
  const data = useMemo(() => {
    const conteo = { vigente: 0, por_vencer: 0, vencido: 0, sin_dato: 0 };
    paneles.forEach((p) => {
      if (conteo[p.estadoContrato] !== undefined) {
        conteo[p.estadoContrato]++;
      }
    });

    return [
      { name: 'vigente', label: ESTADO_LABELS.vigente, value: conteo.vigente, color: ESTADO_COLORS.vigente },
      { name: 'por_vencer', label: ESTADO_LABELS.por_vencer, value: conteo.por_vencer, color: ESTADO_COLORS.por_vencer },
      { name: 'vencido', label: ESTADO_LABELS.vencido, value: conteo.vencido, color: ESTADO_COLORS.vencido },
      { name: 'sin_dato', label: ESTADO_LABELS.sin_dato, value: conteo.sin_dato, color: ESTADO_COLORS.sin_dato },
    ];
  }, [paneles]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <div className={styles.tooltipLabel}>{payload[0].payload.label}</div>
          <div className={styles.tooltipValue}>{payload[0].value} paneles</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Estado de Contratos</h3>
      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={80} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]} 
              cursor="pointer"
              // Cross-filtering al hacer clic en una barra
              onClick={(data) => { if (data && data.name) toggleFilter('estadosContrato', data.name); }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
