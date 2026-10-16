import React from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = '🔍',
  title = 'Sin resultados',
  message = 'No se encontraron paneles con los filtros seleccionados. Prueba quitar algún filtro.',
  actionLabel = 'Limpiar filtros',
  onAction,
}: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon} role="img" aria-hidden="true">
        {icon}
      </span>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyMessage}>{message}</p>
      {onAction && (
        <button className={styles.emptyAction} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
