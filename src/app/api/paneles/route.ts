import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente administrativo Supabase usando service_role_key para operaciones técnicas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { panel, modo } = body; // modo: 'crear' | 'editar'

    if (!panel) {
      return NextResponse.json({ error: 'Faltan los datos del panel' }, { status: 400 });
    }

    const {
      id,
      codigo,
      latitud,
      longitud,
      direccion,
      distritoId,
      tipoViaId,
      espacioPublicitarioId,
      tipoEPEId,
      caracteristicaTecnicaId,
      materialPredominanteId,
      empresaId,
      areaOcupacion,
      areaExhibicion,
      alturaPoste,
      alto,
      largo,
      espesor,
      numeroContrato,
      registroFRAP,
      fechaSuscripcion,
      notas,
    } = panel;

    // Validar campos mínimos obligatorios según normativa MML
    if (!codigo || latitud == null || longitud == null || !distritoId || !empresaId) {
      return NextResponse.json(
        { error: 'Campos requeridos incompletos: Código, Coordenadas, Distrito y Empresa son obligatorios.' },
        { status: 400 }
      );
    }

    // Preparar objeto de inserción/actualización con nombres de columna de la tabla 'paneles'
    const panelPayload: Record<string, any> = {
      codigo: String(codigo).trim(),
      latitud: Number(latitud),
      longitud: Number(longitud),
      direccion: direccion ? String(direccion).trim() : null,
      distrito_id: distritoId,
      empresa_id: empresaId,
      tipo_via_id: tipoViaId || null,
      espacio_pub_id: espacioPublicitarioId || null,
      tipo_epe_id: tipoEPEId || null,
      caracteristica_id: caracteristicaTecnicaId || null,
      material_id: materialPredominanteId || null,
      area_ocupacion: areaOcupacion ? Number(areaOcupacion) : null,
      area_exhibicion: areaExhibicion ? Number(areaExhibicion) : null,
      altura_poste: alturaPoste ? Number(alturaPoste) : null,
      alto: alto ? Number(alto) : null,
      largo: largo ? Number(largo) : null,
      espesor: espesor ? Number(espesor) : null,
      nro_registro_frap: registroFRAP ? String(registroFRAP).trim() : null,
      notas: notas ? String(notas).trim() : null,
      activo: true,
    };

    if (modo === 'editar' && id) {
      // Actualizar registro existente
      const { data, error } = await supabaseAdmin
        .from('paneles')
        .update(panelPayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar panel:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, panel: data });
    } else {
      // Crear nuevo registro
      const { data, error } = await supabaseAdmin
        .from('paneles')
        .insert([panelPayload])
        .select()
        .single();

      if (error) {
        console.error('Error al crear panel:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, panel: data });
    }
  } catch (err: any) {
    console.error('Error inesperado en /api/paneles:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}

