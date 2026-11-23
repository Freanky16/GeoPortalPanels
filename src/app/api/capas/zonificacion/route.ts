import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox'); // minLng,minLat,maxLng,maxLat

  // BBOX por defecto de Lima Metropolitana si no se pasa parámetro
  const geometryBbox = bbox || '-77.25,-12.30,-76.85,-11.85';

  const arcgisUrl = `https://services5.arcgis.com/bHvzrGGxW8wP6Utm/arcgis/rest/services/Zonficacion_Urbana_Vigente_LM_13022026_project/FeatureServer/0/query?geometry=${geometryBbox}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID,simb_zoni,etiqueta,sclas_zoni,ordenanza&resultRecordCount=2000&outSR=4326&f=geojson`;

  try {
    const res = await fetch(arcgisUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SIGPE-MML/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 21600 },
    });

    if (!res.ok) {
      throw new Error(`Error en ArcGIS IMP: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('Error al consultar Zonificación IMP:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [], error: error.message },
      { status: 502 }
    );
  }
}
