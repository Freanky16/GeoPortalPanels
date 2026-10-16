import React from 'react';
import styles from './GlassCard.module.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = '',
  strong = false,
  style,
  onClick,
}: GlassCardProps) {
  return (
    <div
      className={`${strong ? styles.glassCardStrong : styles.glassCard} ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
