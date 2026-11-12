import { Panel } from '@/types';

export type CategoriaVia = 'todas' | 'ejes' | 'calles';

export interface ViaRanked {
  nombre: string;
  categoria: 'eje' | 'calle';
  cantidad: number;
  porcentaje: number;
  paneles: Panel[];
  centroide: [number, number]; // [lng, lat]
}

/**
 * Normaliza y extrae el nombre oficial del corredor o vía
 * a partir del campo libre de dirección municipal.
 */
export function normalizarNombreVia(rawDireccion: string | null | undefined): { nombre: string; categoria: 'eje' | 'calle' } | null {
  if (!rawDireccion) return null;

  let d = rawDireccion.trim().toUpperCase();
  if (d.length < 3) return null;

  // Remover prefijos comunes no constitutivos del nombre de vía
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

  // 2. Separar por cruces o referencias secundarias (/ , CON , ESQ , FRENTE , CDRA , N° , KM)
  const delimitadores = /\s*(?:\/|\s+CON\s+|\s+ESQ\.?\s+|\s+CRUCE\s+|\s+FRENTE\s+|\s+FTE\.?\s+|\s+CDRA\.?\s+|\s+CUADRA\s+|\s+KM\.?\s+|\s+N[°º]\s*|\s+#\s*|\s*\()\s*/i;
  const partes = d.split(delimitadores);
  let primeraParte = partes[0].trim();

  // Si la primera parte quedó vacía o muy corta y hay segunda parte con nombre de vía
  if (primeraParte.length < 4 && partes.length > 1) {
    primeraParte = partes[1].trim();
  }

  // Quitar números finales sueltos (ej. "AV. BRASIL 1613" -> "AV. BRASIL")
  primeraParte = primeraParte.replace(/\s+\d+.*$/, '').trim();

  // 3. Patrones de Avenidas y Corredores
  const matchAv = primeraParte.match(/^(?:AV[.,]?\s+|AVENIDA\s+|AUTOPISTA\s+)(.+)/i);
  if (matchAv) {
    let nombre = matchAv[1].trim();
    // Limpieza de sufijos cardinales o residuales comunes
    nombre = limpiarNombreVia(nombre);
    if (nombre.length >= 3) {
      return { nombre: `Av. ${toTitleCase(nombre)}`, categoria: 'eje' };
    }
  }

  // 4. Patrones de Jirones
  const matchJr = primeraParte.match(/^(?:JR[.,]?\s+|JIR[OÓ]N\s+)(.+)/i);
  if (matchJr) {
    let nombre = limpiarNombreVia(matchJr[1].trim());
    if (nombre.length >= 3) {
      return { nombre: `Jr. ${toTitleCase(nombre)}`, categoria: 'calle' };
    }
  }

  // 5. Patrones de Calles
  const matchCa = primeraParte.match(/^(?:CA[.,]?\s+|CALLE\s+)(.+)/i);
  if (matchCa) {
    let nombre = limpiarNombreVia(matchCa[1].trim());
    if (nombre.length >= 3) {
      return { nombre: `Calle ${toTitleCase(nombre)}`, categoria: 'calle' };
    }
  }

  // 6. Patrones de Pasajes
  const matchPsje = primeraParte.match(/^(?:PSJE[.,]?\s+|PASAJE\s+)(.+)/i);
  if (matchPsje) {
    let nombre = limpiarNombreVia(matchPsje[1].trim());
    if (nombre.length >= 3) {
      return { nombre: `Psje. ${toTitleCase(nombre)}`, categoria: 'calle' };
    }
  }

  // 7. Si no empieza explícitamente con AV/JR pero contiene un nombre conocido o término
  // Por ejemplo: "AREQUIPA / BERNARDO ALCEDO" o "ARAMBURÚ CDRA 8"
  if (/^(AREQUIPA|ARAMBUR[UÚ]|SALAVERRY|BRASIL|FAUCETT|VENEZUELA|BENAVÍDES|BENAVIDES|BOL[IÍ]VAR|COLMENA|GRAU|TACNA|ALFONSO\s+UGARTE|T[UÚ]PAC\s+AMARU|CANAD[AÁ]|UNIVERSITARIA|LA\s+MARINA)/i.test(primeraParte)) {
    const nombre = limpiarNombreVia(primeraParte);
    return { nombre: `Av. ${toTitleCase(nombre)}`, categoria: 'eje' };
  }

  // Si tiene longitud razonable, clasificar por descarte
  const nombreLimpio = limpiarNombreVia(primeraParte);
  if (nombreLimpio.length >= 4) {
    return {
      nombre: toTitleCase(nombreLimpio),
      categoria: /AV|PROLONGACI|CARRETERA|AUTOPISTA/i.test(nombreLimpio) ? 'eje' : 'calle',
    };
  }

  return null;
}

function limpiarNombreVia(str: string): string {
  return str
    .replace(/\b(ESTE|OESTE|NORTE|SUR)\b$/i, '') // Unificar variantes cardinales para consolidar corredor
    .replace(/[._\-]+$/g, '')
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
 * agrupado y con cálculo de centroide exacto para el zoom del mapa.
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
    // Calcular centroide medio para interactividad visual en el mapa
    let sumLng = 0;
    let sumLat = 0;
    let validos = 0;

    for (const p of items) {
      if (typeof p.longitud === 'number' && typeof p.latitud === 'number' && !isNaN(p.longitud) && !isNaN(p.latitud)) {
        sumLng += p.longitud;
        sumLat += p.latitud;
        validos++;
      }
    }

    const centroide: [number, number] = validos > 0
      ? [sumLng / validos, sumLat / validos]
      : [-77.0428, -12.0464];

    resultado.push({
      nombre,
      categoria: cat,
      cantidad: items.length,
      porcentaje: totalConsiderados > 0 ? Math.round((items.length / totalConsiderados) * 100) : 0,
      paneles: items,
      centroide,
    });
  }

  // Ordenar de mayor a menor y tomar los Top N
  return resultado.sort((a, b) => b.cantidad - a.cantidad).slice(0, limite);
}
