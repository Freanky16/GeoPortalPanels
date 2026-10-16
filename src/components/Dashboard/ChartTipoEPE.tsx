'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useFilteredPanels } from '@/hooks/useFilteredPanels';
import { useFilterStore } from '@/store/useFilterStore';
import { TIPO_EPE_COLORS } from '@/lib/constants';
import { contarPor } from '@/lib/utils';
import styles from './DashboardPanel.module.css';

export default function ChartTipoEPE() {
  const paneles = useFilteredPanels();
  const toggleFilter = useFilterStore((state) => state.toggleFilter);

  const data = useMemo(() => {
    return contarPor(paneles, 'tipoEPE');
  }, [paneles]);

  if (data.length === 0) return null;

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Tipos de EPE</h3>
      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="cantidad"
              nameKey="nombre"
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="80%"
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.nombre}
                  fill={TIPO_EPE_COLORS[entry.nombre] || '#6B7280'}
                  fillOpacity={0.9}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className={styles.customTooltip}>
                    <div className={styles.tooltipLabel}>{payload[0].name}</div>
                    <div className={styles.tooltipValue}>{payload[0].value} paneles</div>
                  </div>
                );
              }}
            />
            <Legend
              formatter={(value: string) => (
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                  {value.length > 18 ? value.slice(0, 18) + '…' : value}
                </span>
              )}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
