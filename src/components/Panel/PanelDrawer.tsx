'use client';

import React, { useState, useEffect } from 'react';
import styles from './PanelDrawer.module.css';
import { useUIStore } from '@/store/useUIStore';
import { usePanelStore } from '@/store/usePanelStore';
import { Panel } from '@/types';

export default function PanelDrawer() {
  const isOpen = useUIStore((state) => state.drawerPanelAbierto);
  const panelEnEdicion = useUIStore((state) => state.panelEnEdicion);
  const cerrarDrawer = useUIStore((state) => state.cerrarDrawerPanel);
  const modoCaptura = useUIStore((state) => state.modoCapturaCoordenadas);
  const setModoCaptura = useUIStore((state) => state.setModoCapturaCoordenadas);
  const coordenadasCapturadas = useUIStore((state) => state.coordenadasCapturadas);
  const setCoordenadasCapturadas = useUIStore((state) => state.setCoordenadasCapturadas);

  const catalogos = usePanelStore((state) => state.catalogos);
  const fetchData = usePanelStore((state) => state.fetchData);
  const flyTo = useUIStore((state) => state.flyTo);

  // Estados del Formulario
  const [formData, setFormData] = useState<Partial<Panel>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmIncomplete, setShowConfirmIncomplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar o limpiar campos al abrir el Drawer
  useEffect(() => {
    if (isOpen) {
      if (panelEnEdicion) {
        setFormData({ ...panelEnEdicion });
      } else {
        setFormData({
          codigo: '',
          latitud: undefined,
          longitud: undefined,
          direccion: '',
          distritoId: catalogos.distritos[0]?.id || '',
          empresaId: catalogos.empresas[0]?.id || '',
          tipoViaId: '',
          espacioPublicitarioId: '',
          tipoEPEId: '',
          caracteristicaTecnicaId: '',
          materialPredominanteId: '',
          areaOcupacion: null,
          areaExhibicion: null,
          alturaPoste: null,
          alto: null,
          largo: null,
          espesor: null,
          registroFRAP: '',
          notas: '',
        });
      }
      setErrors({});
      setShowConfirmIncomplete(false);
    }
  }, [isOpen, panelEnEdicion, catalogos]);

  // Si el usuario capturó un punto en el mapa, actualizar latitud y longitud automáticamente
  useEffect(() => {
    if (coordenadasCapturadas) {
      setFormData((prev) => ({
        ...prev,
        latitud: coordenadasCapturadas.lat,
        longitud: coordenadasCapturadas.lng,
      }));
      setModoCaptura(false);
      setCoordenadasCapturadas(null);
    }
  }, [coordenadasCapturadas, setModoCaptura, setCoordenadasCapturadas]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Panel, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validarCamposPrincipales = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.codigo?.trim()) newErrors.codigo = 'El código oficial es obligatorio.';
    if (formData.latitud == null || isNaN(Number(formData.latitud))) newErrors.latitud = 'Latitud requerida.';
    if (formData.longitud == null || isNaN(Number(formData.longitud))) newErrors.longitud = 'Longitud requerida.';
    if (!formData.direccion?.trim()) newErrors.direccion = 'La dirección / vía es obligatoria.';
    if (!formData.distritoId) newErrors.distritoId = 'Selecciona un distrito.';
    if (!formData.empresaId) newErrors.empresaId = 'Selecciona una empresa.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const faltanSecundarios = () => {
    return (
      !formData.tipoEPEId ||
      !formData.materialPredominanteId ||
      !formData.caracteristicaTecnicaId ||
      !formData.registroFRAP?.trim() ||
      formData.areaExhibicion == null
    );
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarCamposPrincipales()) return;

    if (faltanSecundarios() && !showConfirmIncomplete) {
      setShowConfirmIncomplete(true);
      return;
    }

    ejecutarGuardado();
  };

  const ejecutarGuardado = async () => {
    setIsSubmitting(true);
    try {
      const modo = panelEnEdicion ? 'editar' : 'crear';
      const res = await fetch('/api/paneles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panel: formData, modo }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al guardar el panel');
      }

      // Refrescar paneles desde la base de datos
      await fetchData();

      // Volar hacia el panel recién guardado si tiene coordenadas
      if (formData.latitud && formData.longitud) {
        flyTo([Number(formData.longitud), Number(formData.latitud)], 17);
      }

      cerrarDrawer();
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setShowConfirmIncomplete(false);
    }
  };

  return (
    <div className={styles.drawerBackdrop} onClick={cerrarDrawer}>
      <aside className={styles.drawerContainer} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Drawer */}
        <div className={styles.drawerHeader}>
          <div className={styles.headerTitleWrapper}>
            <div className={styles.headerIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h2 className={styles.drawerTitle}>
                {panelEnEdicion ? `Editar Panel ${panelEnEdicion.codigo}` : 'Registrar Nuevo Panel'}
              </h2>
              <span className={styles.drawerSubtitle}>Gestión Técnica Directa en Base de Datos</span>
            </div>
          </div>

          <button className={styles.closeBtn} onClick={cerrarDrawer} aria-label="Cerrar panel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form className={styles.drawerBody} onSubmit={handlePreSubmit}>
          {/* SECCIÓN 1: IDENTIFICACIÓN Y UBICACIÓN (OBLIGATORIOS) */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeading}>
              <span>1. Identificación y Ubicación Obligatoria</span>
              <span style={{ color: '#EF4444', fontSize: '10px' }}>* Requeridos</span>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Código Oficial del Panel <span className={styles.reqStar}>*</span>
              </label>
              <input
                type="text"
                placeholder="Ej: 401_NAP"
                value={formData.codigo || ''}
                onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
                className={`${styles.input} ${errors.codigo ? styles.inputError : ''}`}
                autoFocus
              />
              {errors.codigo && <span className={styles.errorText}>{errors.codigo}</span>}
            </div>

            {/* Asignación Geográfica */}
            <div className={styles.coordsBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.label}>
                  Coordenadas Geodésicas WGS84 <span className={styles.reqStar}>*</span>
                </span>
                <span style={{ fontSize: '10px', color: '#64748B' }}>Precisión Ilimitada</span>
              </div>

              <button
                type="button"
                className={`${styles.mapCaptureBtn} ${modoCaptura ? styles.mapCaptureBtnActive : ''}`}
                onClick={() => setModoCaptura(!modoCaptura)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="22" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="12" x2="2" y2="12" />
                  <line x1="12" y1="6" x2="12" y2="2" />
                  <line x1="12" y1="22" x2="12" y2="18" />
                </svg>
                <span>{modoCaptura ? 'Haz clic en el mapa para marcar...' : '📍 Marcar en Mapa'}</span>
              </button>

              <div className={styles.coordsGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} style={{ fontSize: '11px' }}>Latitud</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-12.06535376"
                    value={formData.latitud ?? ''}
                    onChange={(e) => handleChange('latitud', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`${styles.input} ${errors.latitud ? styles.inputError : ''}`}
                  />
                  {errors.latitud && <span className={styles.errorText}>{errors.latitud}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} style={{ fontSize: '11px' }}>Longitud</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-77.03906696"
                    value={formData.longitud ?? ''}
                    onChange={(e) => handleChange('longitud', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`${styles.input} ${errors.longitud ? styles.inputError : ''}`}
                  />
                  {errors.longitud && <span className={styles.errorText}>{errors.longitud}</span>}
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Dirección / Vía <span className={styles.reqStar}>*</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Av. Salaverry Cdra. 1 / Av. 28 de Julio"
                value={formData.direccion || ''}
                onChange={(e) => handleChange('direccion', e.target.value)}
                className={`${styles.input} ${errors.direccion ? styles.inputError : ''}`}
              />
              {errors.direccion && <span className={styles.errorText}>{errors.direccion}</span>}
            </div>

            <div className={styles.twoCols}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Distrito <span className={styles.reqStar}>*</span>
                </label>
                <select
                  value={formData.distritoId || ''}
                  onChange={(e) => handleChange('distritoId', e.target.value)}
                  className={`${styles.select} ${errors.distritoId ? styles.inputError : ''}`}
                >
                  <option value="">Seleccionar Distrito...</option>
                  {catalogos.distritos.map((d) => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
                {errors.distritoId && <span className={styles.errorText}>{errors.distritoId}</span>}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Empresa Concesionaria <span className={styles.reqStar}>*</span>
                </label>
                <select
                  value={formData.empresaId || ''}
                  onChange={(e) => handleChange('empresaId', e.target.value)}
                  className={`${styles.select} ${errors.empresaId ? styles.inputError : ''}`}
                >
                  <option value="">Seleccionar Empresa...</option>
                  {catalogos.empresas.map((em) => (
                    <option key={em.id} value={em.id}>{em.nombre}</option>
                  ))}
                </select>
                {errors.empresaId && <span className={styles.errorText}>{errors.empresaId}</span>}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: ESPECIFICACIONES TÉCNICAS Y DIMENSIONES (SECUNDARIAS) */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeading}>
              <span>2. Especificaciones Técnicas y Dimensiones</span>
              <span className={styles.optionalTag}>Opcionales</span>
            </div>

            <div className={styles.twoCols}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Tipo de Soporte EPE</label>
                <select
                  value={formData.tipoEPEId || ''}
                  onChange={(e) => handleChange('tipoEPEId', e.target.value)}
                  className={styles.select}
                >
                  <option value="">(Sin clasificar)</option>
                  {catalogos.tiposEPE.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Material Predominante</label>
                <select
                  value={formData.materialPredominanteId || ''}
                  onChange={(e) => handleChange('materialPredominanteId', e.target.value)}
                  className={styles.select}
                >
                  <option value="">(Sin clasificar)</option>
                  {catalogos.materialesPredominantes.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.twoCols}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Iluminación / Característica</label>
                <select
                  value={formData.caracteristicaTecnicaId || ''}
                  onChange={(e) => handleChange('caracteristicaTecnicaId', e.target.value)}
                  className={styles.select}
                >
                  <option value="">(Sin clasificar)</option>
                  {catalogos.caracteristicasTecnicas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Espacio de Instalación</label>
                <select
                  value={formData.espacioPublicitarioId || ''}
                  onChange={(e) => handleChange('espacioPublicitarioId', e.target.value)}
                  className={styles.select}
                >
                  <option value="">(Sin clasificar)</option>
                  {catalogos.espaciosPublicitarios.map((sp) => (
                    <option key={sp.id} value={sp.id}>{sp.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.fourCols}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} style={{ fontSize: '11px' }}>Alto (m)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 3.5"
                  value={formData.alto ?? ''}
                  onChange={(e) => handleChange('alto', e.target.value ? parseFloat(e.target.value) : null)}
                  className={styles.input}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} style={{ fontSize: '11px' }}>Largo (m)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 7.2"
                  value={formData.largo ?? ''}
                  onChange={(e) => handleChange('largo', e.target.value ? parseFloat(e.target.value) : null)}
                  className={styles.input}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} style={{ fontSize: '11px' }}>Poste (m)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 12.0"
                  value={formData.alturaPoste ?? ''}
                  onChange={(e) => handleChange('alturaPoste', e.target.value ? parseFloat(e.target.value) : null)}
                  className={styles.input}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} style={{ fontSize: '11px' }}>Área (m²)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 25.2"
                  value={formData.areaExhibicion ?? ''}
                  onChange={(e) => handleChange('areaExhibicion', e.target.value ? parseFloat(e.target.value) : null)}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: CONTROL LEGAL Y FRAP */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeading}>
              <span>3. Control Legal y Registros MML</span>
              <span className={styles.optionalTag}>Opcionales</span>
            </div>

            <div className={styles.twoCols}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>N° Registro FRAP</label>
                <input
                  type="text"
                  placeholder="Ej: NAP202512-0001"
                  value={formData.registroFRAP || ''}
                  onChange={(e) => handleChange('registroFRAP', e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>N° Contrato</label>
                <input
                  type="text"
                  placeholder="Ej: 0001-2025-R"
                  value={formData.numeroContrato || ''}
                  onChange={(e) => handleChange('numeroContrato', e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className={styles.drawerFooter}>
            <button type="button" className={styles.cancelBtn} onClick={cerrarDrawer} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando en BD...' : panelEnEdicion ? 'Actualizar Panel' : 'Guardar Panel'}
            </button>
          </div>
        </form>

        {/* Modal de Confirmación Inteligente (Campos Secundarios) */}
        {showConfirmIncomplete && (
          <div className={styles.confirmDialogOverlay}>
            <div className={styles.confirmCard}>
              <h3 className={styles.confirmTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Especificaciones Secundarias</span>
              </h3>
              <p className={styles.confirmMsg}>
                Hay especificaciones técnicas secundarias pendientes (dimensiones, FRAP o materiales).
                ¿Deseas guardar los datos básicos ahora y completarlas más adelante?
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowConfirmIncomplete(false)}
                >
                  Seguir Editando
                </button>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={ejecutarGuardado}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Continuar y Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

