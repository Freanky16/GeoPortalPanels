// ============================================================
// CONSTANTES — Colores, configuración de mapa, breakpoints
// ============================================================

// --- Coordenadas de Lima ---
export const LIMA_CENTER: [number, number] = [-77.0428, -12.0464];
export const LIMA_ZOOM = 11;
export const LIMA_BOUNDS: [[number, number], [number, number]] = [
  [-77.25, -12.30], // Suroeste
  [-76.70, -11.75], // Noreste
];

// --- Colores de Estado de Contrato ---
export const ESTADO_COLORS: Record<string, string> = {
  vigente: '#16A34A',      // Verde natural
  por_vencer: '#D97706',   // Ámbar dorado
  vencido: '#DC2626',      // Rojo intenso
  sin_dato: '#78716C',     // Stone neutral
};

export const ESTADO_LABELS: Record<string, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  sin_dato: 'Sin dato',
};

// --- Colores por Tipo de EPE (7 tipos oficiales del Excel MML) ---
export const TIPO_EPE_COLORS: Record<string, string> = {
  'Panel monumental': '#E05C3A',          // Terracota
  'Panel monumental unipolar': '#D97706', // Ámbar
  'Panel monumental volumétrico': '#B45309', // Ámbar oscuro
  'Panel simple': '#0D9488',              // Teal
  'Tótem': '#0891B2',                      // Cyan natural
  'Paleta publicitaria': '#16A34A',       // Verde
  'Mobiliario urbano - nomenclatura de vías': '#7C3AED', // Violeta
};

// --- Paleta de Colores Principal (Estilo Google) ---
export const COLORS = {
  // Fondos
  bgPrimary: '#F8F9FA',         // Fondo principal claro
  bgSecondary: '#FFFFFF',       // Paneles flotantes (blanco puro)
  bgTertiary: '#F1F3F4',        // Hover / elevación / input bg
  bgGlass: 'rgba(255, 255, 255, 0.90)', // Glassmorphism

  // Textos
  textPrimary: '#202124',
  textSecondary: '#5F6368',
  textMuted: '#80868B',

  // Acentos
  accent: '#1A73E8',            // Azul Google
  accentHover: '#1557B0',
  accentLight: 'rgba(26, 115, 232, 0.12)',

  // Semáforo
  success: '#1E8E3E',           // Verde Google
  warning: '#F9AB00',           // Amarillo Google
  danger: '#D93025',            // Rojo Google

  // Bordes
  border: '#DADCE0',
  borderHover: '#BDC1C6',
};

// --- Paleta para Gráficos (12 colores diferenciados, paleta cálida) ---
export const CHART_PALETTE = [
  '#E05C3A', '#D97706', '#16A34A', '#0D9488',
  '#0891B2', '#B45309', '#7C3AED', '#DC2626',
  '#78716C', '#65A30D', '#A8A29E', '#C2410C',
];

// --- Breakpoints ---
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
};

// --- Meses cortos para vencimientos ---
export const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

// --- Umbral "por vencer" (días / meses) ---
export const DIAS_POR_VENCER = 60;
export const MESES_POR_VENCER = 2;

