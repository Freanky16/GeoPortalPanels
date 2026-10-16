'use client';

import React from 'react';
import styles from './PanelCard.module.css';
import GlassCard from '../UI/GlassCard';
import { usePanelStore } from '@/store/usePanelStore';
import { useUIStore } from '@/store/useUIStore';
import { formatearFecha, mostrarDato, claseEstado } from '@/lib/utils';
import { ESTADO_LABELS } from '@/lib/constants';

export default function PanelCard() {
  const panel = usePanelStore((state) => state.panelSeleccionado);
  const isOpen = usePanelStore((state) => state.mostrarDetalle);
  const cerrarDetalle = usePanelStore((state) => state.cerrarDetalle);
  const flyTo = useUIStore((state) => state.flyTo);
  const mostrarRadio100m = useUIStore((state) => state.mostrarRadio100m);
  const toggleRadio100m = useUIStore((state) => state.toggleRadio100m);

  if (!isOpen || !panel) return null;

  const handleZoom = () => {
    flyTo([panel.longitud, panel.latitud], 16);
  };

  return (
    <GlassCard className={`${styles.cardContainer} ficha-tecnica-print`} strong>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <span className={styles.codigo}>{panel.codigo}</span>
          <span className={styles.frap}>FRAP: {mostrarDato(panel.registroFRAP)}</span>
        </div>
        <button className={styles.closeButton} onClick={cerrarDetalle} aria-label="Cerrar ficha">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className={styles.content}>
        {/* Placeholder institucional */}
        <div className={styles.imagePlaceholder}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span>Registro fotográfico de campo</span>
        </div>

        {/* Sección: Ubicación */}
        <div className={styles.section}>
          <div className={styles.row}>
            <span className={styles.label}>Distrito</span>
            <span className={styles.value}>{panel.distrito}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Dirección</span>
            <span className={styles.value}>{mostrarDato(panel.direccion)}</span>
          </div>
          {panel.tipoVia && (
            <div className={styles.row}>
              <span className={styles.label}>Tipo de Vía</span>
              <span className={styles.value}>{panel.tipoVia}</span>
            </div>
          )}
          <div className={styles.row}>
            <span className={styles.label}>Espacio</span>
            <span className={styles.value}>{mostrarDato(panel.espacioPublicitario)}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Coordenadas WGS84</span>
            <span className={styles.value} style={{ fontSize: 11, fontFamily: 'monospace' }}>
              {panel.latitud}, {panel.longitud}
            </span>
          </div>

          {/* Botones de acción geográfica */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              className={styles.moreButton}
              onClick={handleZoom}
              style={{ flex: 1, padding: '7px 8px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              title="Centrar en el mapa"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
              <span>Centrar</span>
            </button>
            <a
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${panel.latitud},${panel.longitud}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.moreButton}
              style={{
                flex: 1,
                padding: '7px 8px',
                fontSize: 11,
                fontWeight: 700,
                textDecoration: 'none',
                textAlign: 'center',
                background: '#1A73E8',
                borderColor: '#1A73E8',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
              title="Abrir vista panorámica 360° en Google Street View"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Street View ↗</span>
            </a>
          </div>

          {/* Herramientas Normativas GIS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <button
              onClick={toggleRadio100m}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: '8px',
                border: '1px solid',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
                background: mostrarRadio100m ? 'rgba(26, 115, 232, 0.15)' : 'transparent',
                borderColor: mostrarRadio100m ? '#1A73E8' : 'var(--border-color)',
                color: mostrarRadio100m ? '#1A73E8' : 'var(--text-secondary)',
              }}
              title="Verificar zona de restricción de 100 metros según Ordenanza MML"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span>{mostrarRadio100m ? 'Ocultar radio 100 m (MML)' : 'Radio normativo (100 m)'}</span>
            </button>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Sección: Características Técnicas y Dimensiones */}
        <div className={styles.section}>
          <div className={styles.row}>
            <span className={styles.label}>Tipo de Panel</span>
            <span className={styles.value}>{mostrarDato(panel.tipoEPE)}</span>
          </div>
          {panel.materialPredominante && (
            <div className={styles.row}>
              <span className={styles.label}>Material</span>
              <span className={styles.value}>{panel.materialPredominante}</span>
            </div>
          )}
          <div className={styles.row}>
            <span className={styles.label}>Iluminación</span>
            <span className={styles.value}>{mostrarDato(panel.caracteristicaTecnica)}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Área de Exhibición</span>
            <span className={styles.value} style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
              {mostrarDato(panel.areaExhibicion, ' m²')}
            </span>
          </div>

          {/* Dimensiones físicas secundarias (Alto × Largo | Altura Poste | Espesor) */}
          {(panel.alto != null || panel.largo != null || panel.alturaPoste != null || panel.espesor != null) && (
            <div className={styles.dimensionsBox}>
              <div className={styles.dimensionsLabel}>Dimensiones Técnicas</div>
              <div className={styles.dimensionsGrid}>
                {panel.alto != null && panel.largo != null ? (
                  <span className={styles.dimChip}>Cara: {panel.alto}m (alto) × {panel.largo}m (largo)</span>
                ) : (
                  <>
                    {panel.alto != null && <span className={styles.dimChip}>Alto: {panel.alto} m</span>}
                    {panel.largo != null && <span className={styles.dimChip}>Largo: {panel.largo} m</span>}
                  </>
                )}
                {panel.alturaPoste != null && <span className={styles.dimChip}>Poste: {panel.alturaPoste} m</span>}
                {panel.espesor != null && <span className={styles.dimChip}>Espesor: {panel.espesor} m</span>}
              </div>
            </div>
          )}

          {panel.areaOcupacion != null && (
            <div className={styles.row}>
              <span className={styles.label} title="Huella física en el suelo (zapata de concreto/berma)">
                Área Ocupación (suelo)
              </span>
              <span className={styles.value}>{mostrarDato(panel.areaOcupacion, ' m²')}</span>
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* Sección: Contrato y Concesión */}
        <div className={styles.section}>
          <div className={styles.row}>
            <span className={styles.label}>Empresa</span>
            <span className={styles.value} style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {mostrarDato(panel.empresa)}
            </span>
          </div>
          {panel.numeroContrato && (
            <div className={styles.row}>
              <span className={styles.label}>N° Contrato</span>
              <span className={styles.value} style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {panel.numeroContrato}
              </span>
            </div>
          )}
          <div className={styles.row}>
            <span className={styles.label}>Estado</span>
            <span className={`${styles.statusTag} ${styles[claseEstado(panel.estadoContrato)]}`}>
              {ESTADO_LABELS[panel.estadoContrato]}
            </span>
          </div>
          {panel.fechaSuscripcion && (
            <div className={styles.row}>
              <span className={styles.label}>Suscripción</span>
              <span className={styles.value}>{formatearFecha(panel.fechaSuscripcion)}</span>
            </div>
          )}
          <div className={styles.row}>
            <span className={styles.label}>Vencimiento</span>
            <span className={styles.value}>{formatearFecha(panel.fechaVencimiento)}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
