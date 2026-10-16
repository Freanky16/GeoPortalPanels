import { create } from 'zustand';
import { Panel, Catalogos, EstadoContrato } from '@/types';
import { supabase } from '@/lib/supabase';

// Datos por defecto vacíos
const CATALOGOS_VACIOS: Catalogos = {
  distritos: [],
  empresas: [],
  tiposVia: [],
  espaciosPublicitarios: [],
  tiposEPE: [],
  caracteristicasTecnicas: [],
  materialesPredominantes: [],
};

function mapearPanelPublico(row: Record<string, unknown>): Panel {
  return {
    id: row.id as string,
    codigo: row.codigo as string,
    numeroFila: (row.numeroFila as number) ?? null,
    latitud: Number(row.latitud),
    longitud: Number(row.longitud),
    utmEste: (row.utmEste as number) ?? null,
    utmNorte: (row.utmNorte as number) ?? null,
    direccion: (row.direccion as string) ?? null,
    distritoId: (row.distritoId as string) ?? '',
    distrito: (row.distrito as string) ?? '',
    tipoViaId: (row.tipoViaId as string) ?? null,
    tipoVia: (row.tipoVia as string) ?? null,
    espacioPublicitarioId: (row.espacioPublicitarioId as string) ?? null,
    espacioPublicitario: (row.espacioPublicitario as string) ?? null,
    tipoEPEId: (row.tipoEPEId as string) ?? null,
    tipoEPE: (row.tipoEPE as string) ?? null,
    caracteristicaTecnicaId: (row.caracteristicaTecnicaId as string) ?? null,
    caracteristicaTecnica: (row.caracteristicaTecnica as string) ?? null,
    materialPredominanteId: (row.materialPredominanteId as string) ?? null,
    materialPredominante: (row.materialPredominante as string) ?? null,
    areaOcupacion: (row.areaOcupacion as number) ?? null,
    areaExhibicion: (row.areaExhibicion as number) ?? null,
    alturaPoste: (row.alturaPoste as number) ?? null,
    alto: (row.alto as number) ?? null,
    largo: (row.largo as number) ?? null,
    espesor: (row.espesor as number) ?? null,
    empresaId: (row.empresaId as string) ?? null,
    empresa: (row.empresa as string) ?? null,
    contratoId: (row.contratoId as string) ?? null,
    tipoContrato: (row.tipoContrato as string) ?? null,
    numeroContrato: (row.numeroContrato as string) ?? null,
    registroFRAP: (row.registroFRAP as string) ?? null,
    fechaSuscripcion: (row.fechaSuscripcion as string) ?? null,
    fechaVencimiento: (row.fechaVencimiento as string) ?? null,
    estadoContrato: (row.estadoContrato as EstadoContrato) ?? 'sin_dato',
  };
}

interface PanelStore {
  // Datos
  paneles: Panel[];
  catalogos: Catalogos;
  isLoading: boolean;
  error: string | null;
  esGestor: boolean; // true si el usuario tiene sesión activa

  // Panel seleccionado
  panelSeleccionado: Panel | null;
  mostrarDetalle: boolean;

  // Acciones
  fetchData: () => Promise<void>;
  seleccionarPanel: (panel: Panel | null) => void;
  toggleDetalle: () => void;
  cerrarDetalle: () => void;
}

export const usePanelStore = create<PanelStore>((set) => ({
  paneles: [],
  catalogos: CATALOGOS_VACIOS,
  isLoading: true,
  error: null,
  esGestor: false,

  panelSeleccionado: null,
  mostrarDetalle: false,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Detectar si hay sesión activa (gestor/superadmin)
      const { data: { session } } = await supabase.auth.getSession();
      const tieneSession = !!session;

      let panelesData: Panel[] = [];
      let esGestorActivo = false;

      if (tieneSession) {
        // Intentar leer la vista completa de gestor
        const { data, error } = await supabase
          .from('v_paneles_detalle')
          .select('*');

        if (!error && data) {
          panelesData = data as Panel[];
          esGestorActivo = true;
        } else {
          console.warn('No se pudo acceder a v_paneles_detalle (permiso o sesión vencida). Usando vista pública:', error?.message);
          // Fallback a vista pública
          const { data: pubData, error: pubError } = await supabase
            .from('v_paneles_publicos')
            .select('*');
          if (pubError) throw pubError;
          panelesData = (pubData || []).map(mapearPanelPublico);
        }
      } else {
        // Usuario público: usa la vista pública
        const { data, error } = await supabase
          .from('v_paneles_publicos')
          .select('*');
        if (error) throw error;
        panelesData = (data || []).map(mapearPanelPublico);
      }

      // Obtener catálogos (siempre accesible vía v_catalogos_activos)
      const { data: catData, error: catError } = await supabase
        .from('v_catalogos_activos')
        .select('*');

      if (catError) {
        console.warn('Aviso cargando catálogos:', catError.message);
      }

      // Transformar los catálogos al formato que espera el frontend
      const catalogos: Catalogos = {
        distritos: [],
        empresas: [],
        tiposVia: [],
        espaciosPublicitarios: [],
        tiposEPE: [],
        caracteristicasTecnicas: [],
        materialesPredominantes: [],
      };
      
      (catData || []).forEach((row) => {
        const item = { id: row.id, nombre: row.nombre };
        switch (row.tipo) {
          case 'distrito': catalogos.distritos.push(item); break;
          case 'empresa': catalogos.empresas.push(item); break;
          case 'tipo_via': catalogos.tiposVia.push(item); break;
          case 'espacio_pub': catalogos.espaciosPublicitarios.push(item); break;
          case 'tipo_epe': catalogos.tiposEPE.push(item); break;
          case 'caracteristica': catalogos.caracteristicasTecnicas.push(item); break;
          case 'material': catalogos.materialesPredominantes.push(item); break;
        }
      });

      set({ 
        paneles: panelesData,
        catalogos,
        isLoading: false,
        error: null,
        esGestor: esGestorActivo,
      });

    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      console.error('Error cargando datos de Supabase:', errorMsg);
      set({ error: errorMsg || 'Error de conexión con la base de datos', isLoading: false });
    }
  },

  seleccionarPanel: (panel) =>
    set({ panelSeleccionado: panel, mostrarDetalle: !!panel }),

  toggleDetalle: () =>
    set((state) => ({ mostrarDetalle: !state.mostrarDetalle })),

  cerrarDetalle: () =>
    set({ panelSeleccionado: null, mostrarDetalle: false }),
}));
