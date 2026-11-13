import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');

    if (!latStr || !lonStr) {
      return NextResponse.json({ error: 'Parámetros lat y lon requeridos' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: 'Coordenadas numéricas inválidas' }, { status: 400 });
    }

    // Consulta con timeout seguro de 3 segundos hacia Nominatim
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'SIGPE-Geoportal-Lima/1.0 (gpdp@munlima.gob.pe; Municipalidad Metropolitana de Lima)',
        'Accept-Language': 'es-PE,es;q=0.9',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ direccion: null, distrito: null });
    }

    const data = await res.json();
    const addr = data.address || {};

    // 1. Extraer nombre de vía (calle, avenida, jirón, pasaje)
    const via = addr.road || addr.pedestrian || addr.footway || addr.path || addr.suburb || addr.neighbourhood || null;

    // 2. Extraer distrito
    const distrito = addr.city_district || addr.suburb || addr.town || addr.city || null;

    return NextResponse.json({
      direccion: via,
      distrito: distrito,
      displayName: data.display_name || null,
    });
  } catch {
    // Si hay timeout o error de red, responder silenciosamente con null para no bloquear la experiencia de usuario
    return NextResponse.json({ direccion: null, distrito: null });
  }
}
