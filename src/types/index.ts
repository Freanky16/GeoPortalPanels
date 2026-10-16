// ============================================================
// TIPOS — Plataforma de Paneles Publicitarios de Lima
// ============================================================

// --- Catálogos (Tablas maestras) ---

export interface Distrito {
  id: string;
  nombre: string;
}

export interface Empresa {
  id: string;
  nombre: string;
}

export interface TipoVia {
  id: string;
  nombre: string;
}

export interface EspacioPublicitario {
  id: string;
  nombre: string;
}

export interface TipoEPE {
  id: string;
  nombre: string;
}

export interface CaracteristicaTecnica {
  id: string;
  nombre: string;
}

export interface MaterialPredominante {
  id: string;
  nombre: string;
}

// --- Contrato ---

export type EstadoContrato = 'vigente' | 'por_vencer' | 'vencido' | 'sin_dato';

export interface Contrato {
  id: string;
  numero: string;            // Ej: "0001-2025-R"
  tipo: string;              // Ej: "REORDENAMIENTO"
  empresaId: string;
  fechaSuscripcion: string | null;  // ISO date string
  fechaVencimiento: string | null;  // Calculada (+5 años)
  estado: EstadoContrato;
}

// --- Panel (Elemento de Publicidad Exterior) ---

export interface Panel {
  id: string;                 // ID interno de la base de datos
  codigo: string;             // Código oficial ej: "1_NAP"
  numeroFila: number | null;  // N° del Excel, solo referencial

  // Ubicación
  latitud: number;
  longitud: number;
  utmEste: number | null;     // Respaldo, no se usa en el mapa
  utmNorte: number | null;    // Respaldo, no se usa en el mapa
  direccion: string | null;
  distritoId: string;
  distrito: string;           // Nombre del distrito (desnormalizado para rendimiento)
  tipoViaId: string | null;
  tipoVia: string | null;
  espacioPublicitarioId: string | null;
  espacioPublicitario: string | null;

  // Características
  tipoEPEId: string | null;
  tipoEPE: string | null;
  caracteristicaTecnicaId: string | null;
  caracteristicaTecnica: string | null;
  materialPredominanteId: string | null;
  materialPredominante: string | null;

  // Medidas (metros)
  areaOcupacion: number | null;
  areaExhibicion: number | null;
  alturaPoste: number | null;
  alto: number | null;
  largo: number | null;
  espesor: number | null;

  // Contrato
  empresaId: string | null;
  empresa: string | null;
  contratoId: string | null;
  tipoContrato: string | null;
  numeroContrato: string | null;
  registroFRAP: string | null;   // Ej: "NAP202512-0001"
  fechaSuscripcion: string | null;
  fechaVencimiento: string | null;
  estadoContrato: EstadoContrato;
}

// --- Filtros ---

export interface FiltrosActivos {
  distritos: string[];
  empresas: string[];
  tiposVia: string[];
  espaciosPublicitarios: string[];
  tiposEPE: string[];
  caracteristicasTecnicas: string[];
  materialesPredominantes: string[];
  estadosContrato: EstadoContrato[];
  tiposContrato: string[];
  busqueda: string;
}

export const FILTROS_VACIOS: FiltrosActivos = {
  distritos: [],
  empresas: [],
  tiposVia: [],
  espaciosPublicitarios: [],
  tiposEPE: [],
  caracteristicasTecnicas: [],
  materialesPredominantes: [],
  estadosContrato: [],
  tiposContrato: [],
  busqueda: '',
};

// --- Catálogos agrupados ---

export interface Catalogos {
  distritos: Distrito[];
  empresas: Empresa[];
  tiposVia: TipoVia[];
  espaciosPublicitarios: EspacioPublicitario[];
  tiposEPE: TipoEPE[];
  caracteristicasTecnicas: CaracteristicaTecnica[];
  materialesPredominantes: MaterialPredominante[];
}

// --- UI State ---

export type ColorScheme = 'tipo_epe' | 'estado_contrato' | 'empresa';

export interface MapViewState {
  center: [number, number];
  zoom: number;
}
