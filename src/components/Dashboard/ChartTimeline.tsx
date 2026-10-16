'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useFilteredPanels } from '@/hooks/useFilteredPanels';
import { MESES_CORTOS } from '@/lib/constants';
import styles from './DashboardPanel.module.css';

export default function ChartTimeline() {
  const paneles = useFilteredPanels();

  const data = useMemo(() => {
    const hoy = new Date();
    const meses: { mes: string; vencimientos: number; fullDate: string }[] = [];

    // Generar los próximos 24 meses
    for (let i = 0; i < 24; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
      const year = fecha.getFullYear();
      const month = fecha.getMonth();
      const label = `${MESES_CORTOS[month]} ${String(year).slice(2)}`;

      const count = paneles.filter((p) => {
        if (!p.fechaVencimiento) return false;
        const fv = new Date(p.fechaVencimiento);
        return fv.getFullYear() === year && fv.getMonth() === month;
      }).length;

      meses.push({ mes: label, vencimientos: count, fullDate: `${year}-${String(month + 1).padStart(2, '0')}` });
    }

    return meses;
  }, [paneles]);

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Vencimientos por Mes (24 meses)</h3>
      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientVenc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              interval={2}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              width={30}
              allowDecimals={false}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className={styles.customTooltip}>
                    <div className={styles.tooltipLabel}>{payload[0].payload.mes}</div>
                    <div className={styles.tooltipValue}>{payload[0].value} contratos vencen</div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="vencimientos"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#gradientVenc)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
