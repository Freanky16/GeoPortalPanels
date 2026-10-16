'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';
import { useFilteredPanels } from '@/hooks/useFilteredPanels';
import { useFilterStore } from '@/store/useFilterStore';
import { CHART_PALETTE } from '@/lib/constants';
import { contarPor } from '@/lib/utils';
import styles from './DashboardPanel.module.css';

export default function ChartDistrito() {
  const paneles = useFilteredPanels();
  const toggleFilter = useFilterStore((state) => state.toggleFilter);

  const data = useMemo(() => {
    return contarPor(paneles, 'distrito').slice(0, 12);
  }, [paneles]);

  if (data.length === 0) return null;

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Top Distritos</h3>
      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="nombre"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              width={120}
              tickFormatter={(v: string) => v.length > 15 ? v.slice(0, 15) + '…' : v}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className={styles.customTooltip}>
                    <div className={styles.tooltipLabel}>{payload[0].payload.nombre}</div>
                    <div className={styles.tooltipValue}>{payload[0].value} paneles</div>
                  </div>
                );
              }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar
              dataKey="cantidad"
              radius={[0, 6, 6, 0]}
            >
              <LabelList dataKey="cantidad" position="right" fill="var(--text-secondary)" fontSize={11} />
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
