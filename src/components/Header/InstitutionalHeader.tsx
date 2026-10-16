'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import styles from './InstitutionalHeader.module.css';
import { usePanelStore } from '@/store/usePanelStore';
import { useUIStore } from '@/store/useUIStore';
import { useFilteredPanels } from '@/hooks/useFilteredPanels';
import { useFilterStore } from '@/store/useFilterStore';
import { Panel } from '@/types';
import * as XLSX from 'xlsx';
import { ESTADO_LABELS } from '@/lib/constants';

export default function InstitutionalHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Stores
  const paneles = usePanelStore((state) => state.paneles);
  const isLoading = usePanelStore((state) => state.isLoading);
  const fetchData = usePanelStore((state) => state.fetchData);
  const seleccionarPanel = usePanelStore((state) => state.seleccionarPanel);

  const filtrosPanelAbierto = useUIStore((state) => state.filtrosPanelAbierto);
  const toggleFiltrosPanel = useUIStore((state) => state.toggleFiltrosPanel);
  const dashboardAbierto = useUIStore((state) => state.dashboardAbierto);
  const toggleDashboard = useUIStore((state) => state.toggleDashboard);
  const flyTo = useUIStore((state) => state.flyTo);
  const mostrarTodosRadios100m = useUIStore((state) => state.mostrarTodosRadios100m);
  const toggleTodosRadios100m = useUIStore((state) => state.toggleTodosRadios100m);

  const panelesFiltrados = useFilteredPanels();
  const activeFiltersCount = useFilterStore((state) => state.cantidadFiltrosActivos());

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda predictiva
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase().trim();

    return paneles
      .filter((p) => {
        return (
          p.codigo.toLowerCase().includes(q) ||
          (p.empresa && p.empresa.toLowerCase().includes(q)) ||
          (p.distrito && p.distrito.toLowerCase().includes(q)) ||
          (p.direccion && p.direccion.toLowerCase().includes(q))
        );
      })
      .slice(0, 7);
  }, [searchQuery, paneles]);

  const handleSelectPanel = (panel: Panel) => {
    seleccionarPanel(panel);
    flyTo([panel.longitud, panel.latitud], 17);
    setShowSuggestions(false);
    setSearchQuery('');
    setMobileSearchOpen(false);
  };

  // Exportar paneles filtrados a Microsoft Excel (.XLSX) con las 22 columnas oficiales
  const handleExportExcel = () => {
    if (!panelesFiltrados.length) return;

    const rows = panelesFiltrados.map((p, index) => ({
      'N°': p.numeroFila ?? (index + 1),
      'Código': p.codigo,
      'Distrito': p.distrito || 'Sin dato',
      'Dirección': p.direccion || 'Sin dato',
      'Empresa': p.empresa || 'Sin dato',
      'Tipo EPE': p.tipoEPE || 'Sin dato',
      'Material Predominante': p.materialPredominante || 'Sin dato',
      'Características Técnicas': p.caracteristicaTecnica || 'Sin dato',
      'Tipo de Vía': p.tipoVia || 'Sin dato',
      'Espacio Publicitario': p.espacioPublicitario || 'Sin dato',
      'Estado Legal': (ESTADO_LABELS[p.estadoContrato] || p.estadoContrato || 'Sin dato').toUpperCase(),
      'Área Exhibición (m²)': p.areaExhibicion ?? 'Sin dato',
      'Área Ocupación (m²)': p.areaOcupacion ?? 'Sin dato',
      'Altura Poste (m)': p.alturaPoste ?? 'Sin dato',
      'Alto (m)': p.alto ?? 'Sin dato',
      'Largo (m)': p.largo ?? 'Sin dato',
      'Espesor (m)': p.espesor ?? 'Sin dato',
      'N° Contrato': p.numeroContrato || 'Sin dato',
      'N° Registro FRAP': p.registroFRAP || 'Sin dato',
      'Fecha Suscripción': p.fechaSuscripcion || 'Sin dato',
      'Fecha Vencimiento': p.fechaVencimiento || 'Sin dato',
      'Latitud': p.latitud,
      'Longitud': p.longitud,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Configurar anchos automáticos de columna para máxima legibilidad oficial
    worksheet['!cols'] = [
      { wch: 6 },   // N°
      { wch: 14 },  // Código
      { wch: 22 },  // Distrito
      { wch: 42 },  // Dirección
      { wch: 34 },  // Empresa
      { wch: 30 },  // Tipo EPE
      { wch: 20 },  // Material
      { wch: 26 },  // Características Técnicas
      { wch: 16 },  // Tipo de Vía
      { wch: 22 },  // Espacio Publicitario
      { wch: 16 },  // Estado Legal
      { wch: 18 },  // Área Exhibición
      { wch: 18 },  // Área Ocupación
      { wch: 16 },  // Altura Poste
      { wch: 12 },  // Alto
      { wch: 12 },  // Largo
      { wch: 12 },  // Espesor
      { wch: 18 },  // N° Contrato
      { wch: 18 },  // Registro FRAP
      { wch: 18 },  // Suscripción
      { wch: 18 },  // Vencimiento
      { wch: 13 },  // Latitud
      { wch: 13 },  // Longitud
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Paneles_MML_22_Columnas');

    const fechaHoy = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `reporte_paneles_mml_${fechaHoy}.xlsx`);
    setShowToolsMenu(false);
  };

  const isFiltered = panelesFiltrados.length !== paneles.length;

  return (
    <header className={styles.headerContainer}>
      {/* 1. Brand Identidad Oficial (GPIP · Paneles Lima) */}
      <div className={`${styles.brandSection} ${mobileSearchOpen ? styles.hideOnMobileSearch : ''}`}>
        <div className={styles.emblemWrapper} title="Municipalidad Metropolitana de Lima">
          <img
            src="/logo_mml.png"
            alt="Logo Municipalidad Metropolitana de Lima"
            width="28"
            height="28"
            style={{ objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <div className={styles.brandText}>
          <span className={styles.entityName}>MUNICIPALIDAD METROPOLITANA DE LIMA</span>
          <div className={styles.systemTitle}>
            <span className={styles.sigpeTag}>GPIP</span>
            <span className={styles.titleMain}>Paneles Lima</span>
            <span className={styles.subtitle}>· Geoportal de Publicidad Exterior</span>
          </div>
        </div>
      </div>

      {/* 2. Omnibox Buscador Inteligente (Desktop y Mobile desplegable) */}
      <div className={`${styles.searchSection} ${mobileSearchOpen ? styles.mobileSearchActive : ''}`}>
        {mobileSearchOpen && (
          <button
            className={styles.mobileBackBtn}
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Cerrar búsqueda móvil"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}

        <div className={styles.searchForm}>
          <svg
            className={styles.searchIcon}
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por código, empresa o calle..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            autoFocus={mobileSearchOpen}
          />
          {searchQuery && (
            <button
              className={styles.clearSearchBtn}
              onClick={() => {
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              aria-label="Limpiar búsqueda"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Sugerencias en tiempo real */}
        {showSuggestions && searchResults.length > 0 && (
          <div className={styles.suggestionsBox}>
            {searchResults.map((panel) => (
              <button
                key={panel.id}
                className={styles.suggestionItem}
                onClick={() => handleSelectPanel(panel)}
              >
                <div>
                  <span className={styles.suggestionCode}>{panel.codigo}</span>
                  <span style={{ margin: '0 6px', color: '#64748B' }}>·</span>
                  <span>{panel.empresa || 'Sin empresa'}</span>
                </div>
                <span className={styles.suggestionDetail}>{panel.distrito}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Acciones y Herramientas */}
      <div className={`${styles.actionsSection} ${mobileSearchOpen ? styles.hideOnMobileSearch : ''}`} ref={toolsMenuRef}>
        {/* Botón Lupa en Móvil (< 768px) */}
        <button
          className={`${styles.headerBtn} ${styles.mobileSearchTrigger}`}
          onClick={() => setMobileSearchOpen(true)}
          title="Buscar panel o empresa"
          aria-label="Buscar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        {/* Status Badge */}
        <div className={styles.statusBadge} title="Base de Datos Supabase activa">
          <span className={styles.pulseDot} />
          <span className={styles.statusTextFull}>
            {isLoading
              ? 'Conectando...'
              : isFiltered
              ? `${panelesFiltrados.length} de ${paneles.length}`
              : `${paneles.length} paneles`}
          </span>
          <span className={styles.statusTextCompact}>
            {isLoading
              ? '...'
              : isFiltered
              ? `${panelesFiltrados.length}/${paneles.length}`
              : `${paneles.length}`}
          </span>
        </div>

        {/* Botón Filtros Territoriales */}
        <button
          className={`${styles.headerBtn} ${filtrosPanelAbierto ? styles.headerBtnActive : ''}`}
          onClick={toggleFiltrosPanel}
          title="Filtros territoriales y atributos"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          <span className={styles.btnLabel}>Filtros</span>
          {activeFiltersCount > 0 && (
            <span
              style={{
                background: '#1A73E8',
                color: '#FFFFFF',
                borderRadius: '99px',
                padding: '0 6px',
                fontSize: '10px',
                fontWeight: 800,
              }}
            >
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Botón Métricas y Estadísticas */}
        <button
          className={`${styles.headerBtn} ${dashboardAbierto ? styles.headerBtnActive : ''}`}
          onClick={toggleDashboard}
          title="Métricas territoriales de publicidad exterior"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span className={styles.btnLabel}>Métricas</span>
        </button>

        {/* Menú de Tres Puntos (Herramientas GIS) */}
        <button
          className={`${styles.headerBtn} ${styles.iconBtn} ${showToolsMenu ? styles.headerBtnActive : ''}`}
          onClick={() => setShowToolsMenu(!showToolsMenu)}
          title="Herramientas y opciones"
          aria-label="Herramientas"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>

        {/* Dropdown de Herramientas */}
        {showToolsMenu && (
          <div className={styles.toolsDropdown}>
            <div className={styles.dropdownTitle}>Herramientas de Fiscalización</div>

            {/* Herramienta 1: Auditoría Global de Distancia 100m */}
            <button
              className={`${styles.dropdownItem} ${mostrarTodosRadios100m ? styles.dropdownItemActive : ''}`}
              onClick={() => {
                toggleTodosRadios100m();
                setShowToolsMenu(false);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>Auditoría de proximidad (100 m)</span>
                <span style={{ fontSize: '10px', color: mostrarTodosRadios100m ? '#1E8E3E' : '#64748B', fontWeight: 700 }}>
                  {mostrarTodosRadios100m ? '● ACTIVO (Radios sobre el mapa)' : '○ Inactivo (Ver radios normativos)'}
                </span>
              </div>
            </button>

            <div className={styles.dropdownDivider} />

            {/* Herramienta 2: Exportar 22 Columnas */}
            <button className={styles.dropdownItem} onClick={handleExportExcel}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Exportar Excel 22 col. (.xlsx)</span>
            </button>

            {/* Herramienta 3: Actualizar */}
            <button
              className={styles.dropdownItem}
              onClick={() => {
                fetchData();
                setShowToolsMenu(false);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Actualizar datos</span>
            </button>

            <div className={styles.dropdownDivider} />

            {/* Herramienta 4: Vista Panorámica */}
            <button
              className={styles.dropdownItem}
              onClick={() => {
                flyTo([-77.0428, -12.0464], 12);
                setShowToolsMenu(false);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 19 21 12 17 5 21 12 2" />
              </svg>
              <span>Vista panorámica Lima</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
