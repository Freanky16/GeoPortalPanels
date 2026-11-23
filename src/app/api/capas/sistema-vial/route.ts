import { NextResponse } from 'next/server';
import { CAPAS_MML_CONFIG } from '@/lib/capasMMLConfig';

// Caché en memoria para evitar llamadas redundantes a los servidores de ArcGIS
let cachedGeoJSON: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 horas

export async function GET() {
  const now = Date.now();
  if (cachedGeoJSON && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json(cachedGeoJSON, {
      headers: {
        'Cache-Control': 'public, max-age=21600, stale-while-revalidate=86400',
      },
    });
  }

  try {
    const res = await fetch(CAPAS_MML_CONFIG.sistemaVial.urlQuery, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SIGPE-MML/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 21600 },
    });

    if (!res.ok) {
      throw new Error(`Error en ArcGIS MML: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    cachedGeoJSON = data;
    lastFetchTime = now;

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=21600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('Error al consultar Sistema Vial MML:', error);
    // Si falla y teníamos caché anterior, devolverla
    if (cachedGeoJSON) {
      return NextResponse.json(cachedGeoJSON);
    }
    return NextResponse.json(
      { type: 'FeatureCollection', features: [], error: error.message },
      { status: 502 }
    );
  }
}
