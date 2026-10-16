# Plan Frontend Completo — Archivos por Crear

> Este documento lista **cada archivo** que crearemos para el frontend.  
> Nada queda fuera. Cada archivo tiene su propósito explicado.

---

## Estructura de Carpetas

```
src/
├── app/
│   ├── layout.tsx              # Layout raíz (fuente Outfit, metadata SEO, providers)
│   ├── page.tsx                # Página principal (compone todo: mapa + filtros + gráficos)
│   ├── globals.css             # Variables CSS globales, reset, tipografía, modo oscuro
│   └── favicon.ico             # Ícono de la pestaña
│
├── components/
│   ├── Map/
│   │   ├── MapView.tsx         # Componente principal del mapa (MapLibre GL JS)
│   │   ├── MapView.module.css  # Estilos del mapa (full screen)
│   │   ├── MapControls.tsx     # Botones flotantes: zoom, ubicación, cambio de capa
│   │   ├── MapControls.module.css
│   │   ├── MapLegend.tsx       # Leyenda flotante de colores (por tipo/estado)
│   │   └── MapLegend.module.css
│   │
│   ├── Search/
│   │   ├── SearchBar.tsx       # Buscador flotante superior (códigos, distritos, direcciones)
│   │   ├── SearchBar.module.css
│   │   ├── SearchResults.tsx   # Dropdown de resultados agrupados por tipo
│   │   └── SearchResults.module.css
│   │
│   ├── Filters/
│   │   ├── FilterPanel.tsx     # Panel lateral plegable con todos los filtros
│   │   ├── FilterPanel.module.css
│   │   ├── FilterGroup.tsx     # Grupo individual (ej: "Distrito") con buscador interno
│   │   ├── FilterGroup.module.css
│   │   ├── FilterChip.tsx      # Pill/chip interactivo (reemplaza checkboxes)
│   │   ├── FilterChip.module.css
│   │   ├── ActiveFilters.tsx   # Barra de etiquetas activas + botón "Limpiar todo"
│   │   └── ActiveFilters.module.css
│   │
│   ├── Panel/
│   │   ├── PanelCard.tsx       # Tarjeta flotante al hacer clic en un pin (resumen rápido)
│   │   ├── PanelCard.module.css
│   │   ├── PanelDetail.tsx     # Vista expandida "Ver más detalles"
│   │   └── PanelDetail.module.css
│   │
│   ├── Dashboard/
│   │   ├── DashboardPanel.tsx  # Panel inferior desplegable con gráficos
│   │   ├── DashboardPanel.module.css
│   │   ├── ChartDistrito.tsx   # Barras horizontales por distrito
│   │   ├── ChartTipoEPE.tsx    # Anillo/donut de tipos de EPE
│   │   ├── ChartEmpresas.tsx   # Top empresas en barras
│   │   ├── ChartContratos.tsx  # Estado de contratos (vigente/por vencer/vencido)
│   │   ├── ChartTimeline.tsx   # Línea de tiempo de vencimientos
│   │   ├── StatsCards.tsx      # Tarjetas de cifras clave con números animados
│   │   └── Dashboard.module.css # Estilos compartidos de los gráficos
│   │
│   ├── QuickViews/
│   │   ├── QuickViewBar.tsx    # Barra de atajos rápidos ("Por vencer en 12 meses", etc.)
│   │   └── QuickViewBar.module.css
│   │
│   └── UI/
│       ├── Counter.tsx         # Contador "1,249 paneles · 38 distritos"
│       ├── Counter.module.css
│       ├── Tooltip.tsx         # Tooltip personalizado glassmorphism
│       ├── Tooltip.module.css
│       ├── EmptyState.tsx      # Mensaje amable cuando no hay resultados
│       ├── EmptyState.module.css
│       ├── GlassCard.tsx       # Componente base: tarjeta con efecto cristal
│       └── GlassCard.module.css
│
├── store/
│   ├── useFilterStore.ts       # Zustand: estado global de filtros activos
│   ├── usePanelStore.ts        # Zustand: datos de paneles y panel seleccionado
│   └── useUIStore.ts           # Zustand: estado de UI (panel abierto, dashboard visible, etc.)
│
├── hooks/
│   ├── useFilteredPanels.ts    # Hook: filtra paneles según filtros activos (cross-filtering)
│   ├── useURLSync.ts           # Hook: sincroniza filtros <-> URL (enlaces compartibles)
│   └── useCatalogos.ts         # Hook: carga catálogos desde Supabase
│
├── lib/
│   ├── supabase.ts             # Cliente Supabase (conexión a la base de datos)
│   ├── mapConfig.ts            # Configuración de MapLibre (estilos, centro de Lima, zoom)
│   ├── constants.ts            # Colores, breakpoints, configuración general
│   └── utils.ts                # Funciones auxiliares (formateo de fechas, "Sin dato", etc.)
│
├── data/
│   └── mockPanels.ts           # Datos de prueba (100 paneles simulados para desarrollo)
│
└── types/
    └── index.ts                # Tipos TypeScript (Panel, Contrato, Catálogos, Filtros)
```

---

## Orden de Creación (Secuencial)

### Bloque 1 — Cimientos (Sin esto nada funciona)
| #  | Archivo | Qué hace |
|----|---------|----------|
| 1  | `types/index.ts` | Define la forma de los datos (Panel, Contrato, etc.) |
| 2  | `lib/constants.ts` | Colores, coordenadas de Lima, breakpoints |
| 3  | `lib/utils.ts` | Funciones de formateo y helpers |
| 4  | `data/mockPanels.ts` | 100 paneles de prueba con datos realistas |
| 5  | `app/globals.css` | Reset, variables CSS, tipografía, glassmorphism base |
| 6  | `app/layout.tsx` | Layout raíz con fuente Outfit y metadata |

### Bloque 2 — El Mapa (El protagonista)
| #  | Archivo | Qué hace |
|----|---------|----------|
| 7  | `lib/mapConfig.ts` | Estilo del mapa, centro en Lima, zoom inicial |
| 8  | `components/Map/MapView.tsx + .css` | Mapa full-screen con clustering y pines |
| 9  | `components/Map/MapControls.tsx + .css` | Zoom, ubicación, cambio de capa |
| 10 | `components/Map/MapLegend.tsx + .css` | Leyenda de colores |

### Bloque 3 — Filtrado Cruzado (El cerebro)
| #  | Archivo | Qué hace |
|----|---------|----------|
| 11 | `store/useFilterStore.ts` | Estado global de filtros |
| 12 | `store/usePanelStore.ts` | Datos y selección de paneles |
| 13 | `store/useUIStore.ts` | Estado de la interfaz |
| 14 | `hooks/useFilteredPanels.ts` | Lógica de filtrado cruzado |
| 15 | `hooks/useURLSync.ts` | Sincronización filtros ↔ URL |

### Bloque 4 — Búsqueda y Filtros (La interacción)
| #  | Archivo | Qué hace |
|----|---------|----------|
| 16 | `components/UI/GlassCard.tsx + .css` | Componente base reutilizable |
| 17 | `components/Search/SearchBar.tsx + .css` | Buscador flotante |
| 18 | `components/Search/SearchResults.tsx + .css` | Dropdown de resultados |
| 19 | `components/Filters/FilterChip.tsx + .css` | Pill interactiva |
| 20 | `components/Filters/FilterGroup.tsx + .css` | Grupo de filtro con buscador |
| 21 | `components/Filters/FilterPanel.tsx + .css` | Panel lateral completo |
| 22 | `components/Filters/ActiveFilters.tsx + .css` | Etiquetas activas |

### Bloque 5 — Ficha del Panel (El detalle)
| #  | Archivo | Qué hace |
|----|---------|----------|
| 23 | `components/Panel/PanelCard.tsx + .css` | Tarjeta resumen al clic |
| 24 | `components/Panel/PanelDetail.tsx + .css` | Vista expandida |

### Bloque 6 — Dashboard y Gráficos (La analítica)
| #  | Archivo | Qué hace |
|----|---------|----------|
| 25 | `components/UI/Counter.tsx + .css` | Contador animado |
| 26 | `components/UI/EmptyState.tsx + .css` | Estado vacío amable |
| 27 | `components/UI/Tooltip.tsx + .css` | Tooltip glassmorphism |
| 28 | `components/Dashboard/StatsCards.tsx` | Tarjetas de cifras clave |
| 29 | `components/Dashboard/ChartDistrito.tsx` | Barras por distrito |
| 30 | `components/Dashboard/ChartTipoEPE.tsx` | Anillo tipos EPE |
| 31 | `components/Dashboard/ChartEmpresas.tsx` | Top empresas |
| 32 | `components/Dashboard/ChartContratos.tsx` | Estado de contratos |
| 33 | `components/Dashboard/ChartTimeline.tsx` | Línea de vencimientos |
| 34 | `components/Dashboard/DashboardPanel.tsx + .css` | Panel inferior |

### Bloque 7 — Vistas Rápidas y Ensamblaje
| #  | Archivo | Qué hace |
|----|---------|----------|
| 35 | `components/QuickViews/QuickViewBar.tsx + .css` | Atajos rápidos |
| 36 | `app/page.tsx` | **Página principal**: ensambla TODOS los componentes |

---

## Dependencias npm a Instalar

```bash
npm install maplibre-gl recharts zustand
npm install -D @types/maplibre-gl
```

---

## Notas Importantes

- **No se usa Tailwind.** Todo es CSS Modules con variables CSS personalizadas.
- **Datos mock primero.** Usamos `mockPanels.ts` hasta conectar Supabase (backend).
- **Responsive desde el día 1.** Cada `.module.css` incluye media queries para móvil.
- **Modo oscuro como default.** Con toggle para modo claro via CSS `[data-theme]`.
- **Accesibilidad básica.** Labels en filtros, navegación por teclado, colores + íconos.
