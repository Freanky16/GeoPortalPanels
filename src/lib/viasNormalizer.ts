import { Panel } from '@/types';

export type CategoriaVia = 'todas' | 'ejes' | 'calles';

export interface ViaRanked {
  nombre: string;
  categoria: 'eje' | 'calle';
  cantidad: number;
  porcentaje: number;
  paneles: Panel[];
  centroide: [number, number]; // [lng, lat]
  bounds: [[number, number], [number, number]]; // [[minLng, minLat], [maxLng, maxLat]]
  coordenadasOrdenadas: [number, number][]; // Coordenadas para trazar la línea del corredor
}

// Lista negra estricta de nombres que NO son vías reales válidas
const NOMBRES_INVALIDOS = new Set([
  'CALLE',
  'PRINCIPAL',
  'CRUCE',
  'ALTURA',
  'FRENTE',
  'CDRA',
  'CUADRA',
  'LIMA',
  'AVENIDA',
  'AV',
  'JR',
  'JIRON',
  'PASAJE',
  'PSJE',
  'SIN DATO',
  'AUTOPISTA',
  'PARQUE',
  'SIN NOMBRE',
]);

/**
 * Normaliza y extrae el nombre oficial del corredor o vía
 * a partir del campo libre de dirección municipal.
 */
export function normalizarNombreVia(rawDireccion: string | null | undefined): { nombre: string; categoria: 'eje' | 'calle' } | null {
  if (!rawDireccion) return null;

  let d = rawDireccion.trim().toUpperCase();
  if (d.length < 3) return null;

  // Remover prefijos de referencias relativas
  d = d.replace(/^(A\s+\d+\s+MTRS?\.?\s+(?:DEL\s+CRUCE\s+CON\s+)?|ALTURA\s+|ALT\.?\s+|FRENTE\s+AL\s+PREDIO\s+\d+|AUXILIAR\s+DE\s+LA\s+|AUXILIAR\s+)/i, '');

  // 1. Detección de grandes autopistas y ejes metropolitanos emblemáticos
  if (/PANAMERICANA\s+SUR/i.test(d)) {
    return { nombre: 'Panamericana Sur', categoria: 'eje' };
  }
  if (/PANAMERICANA\s+NORTE/i.test(d)) {
    return { nombre: 'Panamericana Norte', categoria: 'eje' };
  }
  if (/EVITAMIENTO/i.test(d)) {
    return { nombre: 'Vía de Evitamiento', categoria: 'eje' };
  }
  if (/PASEO\s+DE\s+LA\s+REP[UÚ]BLICA/i.test(d)) {
    return { nombre: 'Vía Expresa Paseo de la República', categoria: 'eje' };
  }
  if (/COSTA\s+VERDE/i.test(d)) {
    return { nombre: 'Circuito de Playas (Costa Verde)', categoria: 'eje' };
  }

  // 2. Separar por cruces o referencias secundarias
  const delimitadores = /\s*(?:\/|\s+CON\s+|\s+ESQ\.?\s+|\s+CRUCE\s+|\s+FRENTE\s+|\s+FTE\.?\s+|\s+CDRA\.?\s+|\s+CUADRA\s+|\s+KM\.?\s+|\s+N[°º]\s*|\s+#\s*|\s*\()\s*/i;
  const partes = d.split(delimitadores);
  let primeraParte = partes[0].trim();

  if (primeraParte.length < 4 && partes.length > 1) {
    primeraParte = partes[1].trim();
  }

  // Quitar números finales sueltos
  primeraParte = primeraParte.replace(/\s+\d+.*$/, '').trim();

  // 3. Patrones de Avenidas y Corredores
  const matchAv = primeraParte.match(/^(?:AV[.,]?\s+|AVENIDA\s+|AUTOPISTA\s+)(.+)/i);
  if (matchAv) {
    let nombre = limpiarNombreVia(matchAv[1].trim());
    if (esNombreValido(nombre)) {
      return { nombre: `Av. ${toTitleCase(nombre)}`, categoria: 'eje' };
    }
  }

  // 4. Patrones de Jirones
  const matchJr = primeraParte.match(/^(?:JR[.,]?\s+|JIR[OÓ]N\s+)(.+)/i);
  if (matchJr) {
    let nombre = limpiarNombreVia(matchJr[1].trim());
    if (esNombreValido(nombre)) {
      return { nombre: `Jr. ${toTitleCase(nombre)}`, categoria: 'calle' };
    }
  }

  // 5. Patrones de Calles
  const matchCa = primeraParte.match(/^(?:CA[.,]?\s+|CALLE\s+)(.+)/i);
  if (matchCa) {
    let nombre = limpiarNombreVia(matchCa[1].trim());
    if (esNombreValido(nombre)) {
      return { nombre: `Calle ${toTitleCase(nombre)}`, categoria: 'calle' };
    }
  }

  // 6. Patrones de Pasajes
  const matchPsje = primeraParte.match(/^(?:PSJE[.,]?\s+|PASAJE\s+)(.+)/i);
  if (matchPsje) {
    let nombre = limpiarNombreVia(matchPsje[1].trim());
    if (esNombreValido(nombre)) {
      return { nombre: `Psje. ${toTitleCase(nombre)}`, categoria: 'calle' };
    }
  }

  // 7. Avenidas conocidas sin prefijo explícito
  if (/^(AREQUIPA|ARAMBUR[UÚ]|SALAVERRY|BRASIL|FAUCETT|VENEZUELA|BENAVÍDES|BENAVIDES|BOL[IÍ]VAR|COLMENA|GRAU|TACNA|ALFONSO\s+UGARTE|T[UÚ]PAC\s+AMARU|CANAD[AÁ]|UNIVERSITARIA|LA\s+MARINA)/i.test(primeraParte)) {
    const nombre = limpiarNombreVia(primeraParte);
    if (esNombreValido(nombre)) {
      return { nombre: `Av. ${toTitleCase(nombre)}`, categoria: 'eje' };
    }
  }

  // Descarte: si es una calle con nombre válido de más de 4 letras
  const nombreLimpio = limpiarNombreVia(primeraParte);
  if (esNombreValido(nombreLimpio)) {
    const esEje = /AV|PROLONGACI|CARRETERA|AUTOPISTA/i.test(nombreLimpio);
    return {
      nombre: esEje ? `Av. ${toTitleCase(nombreLimpio)}` : `Calle ${toTitleCase(nombreLimpio)}`,
      categoria: esEje ? 'eje' : 'calle',
    };
  }

  return null;
}

function esNombreValido(nombre: string): boolean {
  if (!nombre) return false;
  const upper = nombre.toUpperCase().trim();
  if (upper.length < 3) return false;
  if (NOMBRES_INVALIDOS.has(upper)) return false;
  // Si solo son números o signos
  if (/^[\d\s._\-#]+$/.test(upper)) return false;
  return true;
}

function limpiarNombreVia(str: string): string {
  return str
    .replace(/\b(ESTE|OESTE|NORTE|SUR)\b$/i, '')
    .replace(/^(CALLE|AV|AVENIDA|JR|JIRON|PSJE|PASAJE)\s+/i, '')
    .replace(/[._\-#,]+$/g, '')
    .trim();
}

function toTitleCase(str: string): string {
  const minusculas = ['de', 'del', 'la', 'las', 'los', 'el', 'en', 'y'];
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word, idx) => {
      if (idx !== 0 && minusculas.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Procesa todos los paneles filtrados y genera el ranking Top N
 * agrupado, con bounds y secuencia de coordenadas para dibujar el corredor vial.
 */
export function calcularRankingVias(paneles: Panel[], categoria: CategoriaVia = 'todas', limite = 10): ViaRanked[] {
  const grupos = new Map<string, { categoria: 'eje' | 'calle'; paneles: Panel[] }>();

  for (const panel of paneles) {
    const viaInfo = normalizarNombreVia(panel.direccion);
    if (!viaInfo) continue;

    if (categoria === 'ejes' && viaInfo.categoria !== 'eje') continue;
    if (categoria === 'calles' && viaInfo.categoria !== 'calle') continue;

    const actual = grupos.get(viaInfo.nombre);
    if (actual) {
      actual.paneles.push(panel);
    } else {
      grupos.set(viaInfo.nombre, {
        categoria: viaInfo.categoria,
        paneles: [panel],
      });
    }
  }

  const totalConsiderados = Array.from(grupos.values()).reduce((sum, item) => sum + item.paneles.length, 0);
  const resultado: ViaRanked[] = [];

  for (const [nombre, { categoria: cat, paneles: items }] of grupos.entries()) {
    let sumLng = 0;
    let sumLat = 0;
    let validos = 0;

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    const puntosValidos: [number, number][] = [];

    for (const p of items) {
      if (typeof p.longitud === 'number' && typeof p.latitud === 'number' && !isNaN(p.longitud) && !isNaN(p.latitud)) {
        sumLng += p.longitud;
        sumLat += p.latitud;
        validos++;

        if (p.longitud < minLng) minLng = p.longitud;
        if (p.longitud > maxLng) maxLng = p.longitud;
        if (p.latitud < minLat) minLat = p.latitud;
        if (p.latitud > maxLat) maxLat = p.latitud;

        puntosValidos.push([p.longitud, p.latitud]);
      }
    }

    const centroide: [number, number] = validos > 0
      ? [sumLng / validos, sumLat / validos]
      : [-77.0428, -12.0464];

    // Ordenar los puntos a lo largo del eje principal para dibujar una línea de corredor prolija
    // Si la dispersión en latitud es mayor que en longitud, ordenar por latitud, sino por longitud
    const spanLat = maxLat - minLat;
    const spanLng = maxLng - minLng;
    if (spanLat > spanLng) {
      puntosValidos.sort((a, b) => a[1] - b[1]);
    } else {
      puntosValidos.sort((a, b) => a[0] - b[0]);
    }

    // Pequeño margen (padding) al bounds para que no queden los paneles pegados al borde de la pantalla
    const padLng = Math.max((maxLng - minLng) * 0.1, 0.003);
    const padLat = Math.max((maxLat - minLat) * 0.1, 0.003);

    const bounds: [[number, number], [number, number]] = [
      [minLng - padLng, minLat - padLat],
      [maxLng + padLng, maxLat + padLat],
    ];

    resultado.push({
      nombre,
      categoria: cat,
      cantidad: items.length,
      porcentaje: totalConsiderados > 0 ? Math.round((items.length / totalConsiderados) * 100) : 0,
      paneles: items,
      centroide,
      bounds,
      coordenadasOrdenadas: puntosValidos,
    });
  }

  // Ordenar de mayor a menor y tomar los Top N
  return resultado.sort((a, b) => b.cantidad - a.cantidad).slice(0, limite);
}
