'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import styles from './InstitutionalHeader.module.css';
import { usePanelStore } from '@/store/usePanelStore';
import { useUIStore } from '@/store/useUIStore';
import { useFilteredPanels } from '@/hooks/useFilteredPanels';
import { useFilterStore } from '@/store/useFilterStore';
import { Panel } from '@/types';

export default function InstitutionalHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
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
  };

  // Exportar paneles filtrados a CSV
  const handleExportCSV = () => {
    if (!panelesFiltrados.length) return;

    const headers = [
      'Codigo',
      'Distrito',
      'Empresa',
      'Tipo EPE',
      'Material',
      'Estado Contrato',
      'Latitud',
      'Longitud',
    ];
    const rows = panelesFiltrados.map((p) => [
      `"${p.codigo}"`,
      `"${p.distrito || ''}"`,
      `"${p.empresa || ''}"`,
      `"${p.tipoEPE || ''}"`,
      `"${p.materialPredominante || ''}"`,
      `"${p.estadoContrato || ''}"`,
      p.latitud,
      p.longitud,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `paneles_lima_filtrados_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowToolsMenu(false);
  };

  const isFiltered = panelesFiltrados.length !== paneles.length;

  return (
    <header className={styles.headerContainer}>
      {/* 1. Brand Identidad Oficial */}
      <div className={styles.brandSection}>
        <div className={styles.emblemWrapper} title="Municipalidad Metropolitana de Lima">
          <img
            src="/logo_mml.png"
            alt="Logo Municipalidad Metropolitana de Lima"
            width="28"
            height="28"
            style={{ objectFit: 'contain' }}
            onError={(e) => {
              // Fallback si no carga
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <div className={styles.brandText}>
          <span className={styles.entityName}>MUNICIPALIDAD DE LIMA</span>
          <div className={styles.systemTitle}>
            <span className={styles.sigpeTag}>SIGPE</span>
            <span>Publicidad Exterior</span>
            <span className={styles.subtitle}>· Geoportal</span>
          </div>
        </div>
      </div>

      {/* 2. Omnibox Buscador Inteligente */}
      <div className={styles.searchSection}>
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
            placeholder="Buscar por código (ej. 1_NAP), empresa o calle..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
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
      <div className={styles.actionsSection} ref={toolsMenuRef}>
        {/* Status Badge */}
        <div className={styles.statusBadge} title="Base de Datos Supabase activa">
          <span className={styles.pulseDot} />
          <span>
            {isLoading
              ? 'Conectando...'
              : isFiltered
              ? `${panelesFiltrados.length} de ${paneles.length}`
              : `${paneles.length} paneles`}
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
          <span>Filtros</span>
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

        {/* Botón Dashboard Analítico */}
        <button
          className={`${styles.headerBtn} ${dashboardAbierto ? styles.headerBtnActive : ''}`}
          onClick={toggleDashboard}
          title="Métricas y estadísticas territoriales"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>Métricas</span>
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
            <div className={styles.dropdownTitle}>Herramientas del Sistema</div>

            <button className={styles.dropdownItem} onClick={handleExportCSV}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Exportar filtrados (.CSV)</span>
            </button>

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

            <button
              className={styles.dropdownItem}
              onClick={() => {
                if (typeof document !== 'undefined') {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }
                setShowToolsMenu(false);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
              <span>Pantalla completa</span>
            </button>

            <div className={styles.dropdownDivider} />

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
              <span>Vista panorámica</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
