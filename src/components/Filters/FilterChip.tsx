'use client';

import React from 'react';
import styles from './FilterChip.module.css';

interface FilterChipProps {
  label: string;
  count?: number;
  active: boolean;
  dimmed?: boolean;
  onToggle: () => void;
}

export default function FilterChip({
  label,
  count,
  active,
  dimmed = false,
  onToggle,
}: FilterChipProps) {
  
  let className = styles.chip;
  if (active) className = styles.chipActive;
  if (dimmed && !active) className = styles.chipDimmed;

  return (
    <button
      type="button"
      className={className}
      onClick={onToggle}
      aria-pressed={active}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={styles.chipCount}>({count})</span>
      )}
    </button>
  );
}
