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
}

/**
 * Normaliza y extrae el nombre oficial del corredor o vía
 * a partir de la dirección municipal.
 * Si la dirección está vacía o pendiente, retorna categoría para auditoría.
 */
export function normalizarNombreVia(rawDireccion: string | null | undefined): { nombre: string; categoria: 'eje' | 'calle' } {
  if (!rawDireccion || rawDireccion.trim().length === 0 || /^(SIN\s+DATO|N\/A|-|\.)$/i.test(rawDireccion.trim())) {
    return { nombre: 'Vías en proceso de auditoría', categoria: 'calle' };
  }

  let d = rawDireccion.trim().toUpperCase();

  // Remover prefijos de referencias relativas
  d = d.replace(/^(A\s+\d+\s+MTRS?\.?\s+(?:DEL\s+CRUCE\s+CON\s+)?|ALTURA\s+|ALT\.?\s+|FRENTE\s+AL\s+PREDIO\s+\d+|AUXILIAR\s+DE\s+LA\s+|AUXILIAR\s+)/i, '');

  // 1. Grandes ejes y autopistas emblemáticas
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

  if (primeraParte.length < 3 && partes.length > 1) {
    primeraParte = partes[1].trim();
  }

  // Quitar números finales sueltos
  primeraParte = primeraParte.replace(/\s+\d+.*$/, '').trim();

  // 3. Patrones de Avenidas y Corredores
  const matchAv = primeraParte.match(/^(?:AV[.,]?\s+|AVENIDA\s+|AUTOPISTA\s+)(.+)/i);
  if (matchAv) {
    const nombre = limpiarNombreVia(matchAv[1]);
    if (nombre.length >= 2 && !esPalabraGenerica(nombre)) {
      return { nombre: `Av. ${toTitleCase(nombre)}`, categoria: 'eje' };
    }
  }

  // 4. Patrones de Jirones
  const matchJr = primeraParte.match(/^(?:JR[.,]?\s+|JIR[OÓ]N\s+)(.+)/i);
  if (matchJr) {
    const nombre = limpiarNombreVia(matchJr[1]);
    if (nombre.length >= 2 && !esPalabraGenerica(nombre)) {
      return { nombre: `Jr. ${toTitleCase(nombre)}`, categoria: 'calle' };
    }
  }

  // 5. Patrones de Calles
  const matchCa = primeraParte.match(/^(?:CA[.,]?\s+|CALLE\s+)(.+)/i);
  if (matchCa) {
    const nombre = limpiarNombreVia(matchCa[1]);
    if (nombre.length >= 2 && !esPalabraGenerica(nombre)) {
      return { nombre: `Calle ${toTitleCase(nombre)}`, categoria: 'calle' };
    }
  }

  // 6. Patrones de Pasajes
  const matchPsje = primeraParte.match(/^(?:PSJE[.,]?\s+|PASAJE\s+)(.+)/i);
  if (matchPsje) {
    const nombre = limpiarNombreVia(matchPsje[1]);
    if (nombre.length >= 2 && !esPalabraGenerica(nombre)) {
      return { nombre: `Psje. ${toTitleCase(nombre)}`, categoria: 'calle' };
    }
  }

  // 7. Avenidas conocidas sin prefijo explícito
  if (/^(AREQUIPA|ARAMBUR[UÚ]|SALAVERRY|BRASIL|FAUCETT|VENEZUELA|BENAVÍDES|BENAVIDES|BOL[IÍ]VAR|COLMENA|GRAU|TACNA|ALFONSO\s+UGARTE|T[UÚ]PAC\s+AMARU|CANAD[AÁ]|UNIVERSITARIA|LA\s+MARINA)/i.test(primeraParte)) {
    const nombre = limpiarNombreVia(primeraParte);
    return { nombre: `Av. ${toTitleCase(nombre)}`, categoria: 'eje' };
  }

  // 8. Caso general: Si el texto contiene un nombre sustancial
  const nombreLimpio = limpiarNombreVia(primeraParte);
  if (nombreLimpio.length >= 3 && !esPalabraGenerica(nombreLimpio)) {
    const esEje = /AV|PROLONGACI|CARRETERA|AUTOPISTA/i.test(nombreLimpio);
    return {
      nombre: esEje ? `Av. ${toTitleCase(nombreLimpio)}` : `Calle ${toTitleCase(nombreLimpio)}`,
      categoria: esEje ? 'eje' : 'calle',
    };
  }

  return { nombre: 'Vías en proceso de auditoría', categoria: 'calle' };
}

function esPalabraGenerica(str: string): boolean {
  const s = str.toUpperCase().trim();
  return [
    'CALLE', 'PRINCIPAL', 'CRUCE', 'ALTURA', 'FRENTE', 'CDRA', 'CUADRA',
    'AVENIDA', 'AV', 'JR', 'JIRON', 'PASAJE', 'PSJE', 'LOTE', 'URB',
  ].includes(s);
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
 * agrupado y con cálculo de bounds exacto para el zoom del mapa.
 */
export function calcularRankingVias(paneles: Panel[], categoria: CategoriaVia = 'todas', limite = 10): ViaRanked[] {
  const grupos = new Map<string, { categoria: 'eje' | 'calle'; paneles: Panel[] }>();

  for (const panel of paneles) {
    const viaInfo = normalizarNombreVia(panel.direccion);

    // Si el usuario filtra por categoría
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

    for (const p of items) {
      if (typeof p.longitud === 'number' && typeof p.latitud === 'number' && !isNaN(p.longitud) && !isNaN(p.latitud)) {
        sumLng += p.longitud;
        sumLat += p.latitud;
        validos++;

        if (p.longitud < minLng) minLng = p.longitud;
        if (p.longitud > maxLng) maxLng = p.longitud;
        if (p.latitud < minLat) minLat = p.latitud;
        if (p.latitud > maxLat) maxLat = p.latitud;
      }
    }

    const centroide: [number, number] = validos > 0
      ? [sumLng / validos, sumLat / validos]
      : [-77.0428, -12.0464];

    const padLng = Math.max((maxLng - minLng) * 0.12, 0.004);
    const padLat = Math.max((maxLat - minLat) * 0.12, 0.004);

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
    });
  }

  // Ordenar de mayor a menor y tomar los Top N
  return resultado.sort((a, b) => b.cantidad - a.cantidad).slice(0, limite);
}
