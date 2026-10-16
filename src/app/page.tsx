'use client';

import React, { Suspense, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import InstitutionalHeader from '@/components/Header/InstitutionalHeader';
import FilterPanel from '@/components/Filters/FilterPanel';
import PanelCard from '@/components/Panel/PanelCard';
import DashboardPanel from '@/components/Dashboard/DashboardPanel';
import MapSwitcher from '@/components/Map/MapSwitcher';
import MapControls from '@/components/Map/MapControls';
import MapLegend from '@/components/Map/MapLegend';
import QuickViewBar from '@/components/QuickViews/QuickViewBar';
import { useURLSync } from '@/hooks/useURLSync';
import { usePanelStore } from '@/store/usePanelStore';
import { useUIStore } from '@/store/useUIStore';

// El mapa debe cargarse dinámicamente sin SSR (Server-Side Rendering) 
// porque MapLibre GL JS depende de la API del navegador (window, document)
const MapView = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#F8FAFC' }}>
      Cargando Geoportal MML...
    </div>
  )
});

// Componente auxiliar para inicializar hooks que usan useSearchParams (deben estar en un Suspense)
function SyncHooks() {
  useURLSync();
  return null;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const mapViewState = useUIStore(state => state.mapViewState);
  const flyTo = useUIStore(state => state.flyTo);

  React.useEffect(() => {
    setMounted(true);
    usePanelStore.getState().fetchData();
  }, []);

  const handleZoomIn = useCallback(() => {
    flyTo(mapViewState.center, mapViewState.zoom + 1);
  }, [flyTo, mapViewState]);

  const handleZoomOut = useCallback(() => {
    flyTo(mapViewState.center, mapViewState.zoom - 1);
  }, [flyTo, mapViewState]);

  const handleResetView = useCallback(() => {
    flyTo([-77.0428, -12.0464], 12);
  }, [flyTo]);

  if (!mounted) return <main style={{ width: '100vw', height: '100vh', background: '#0F172A' }} />;

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Suspense fallback={null}>
        <SyncHooks />
      </Suspense>

      {/* 1. Capa Cartográfica Base */}
      <MapView />

      {/* 2. Encabezado Institucional MML - SIGPE */}
      <InstitutionalHeader />

      {/* 3. Selector de Estilo de Mapa y Controles de Zoom (Esquina inferior derecha) */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />
      <MapSwitcher />

      {/* 4. Leyenda Cartográfica (Esquina inferior izquierda) */}
      <MapLegend />

      {/* 5. Panel Desplegable de Filtros */}
      <FilterPanel />

      {/* 6. Ficha Técnica del Panel Seleccionado */}
      <PanelCard />

      {/* 7. Panel Analítico y Estadístico — NOTA: Esto está oculto por ahora para entrega preliminar */}
      {/* <DashboardPanel /> */}
    </main>
  );
}
