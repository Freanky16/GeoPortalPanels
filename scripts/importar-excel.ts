// ============================================================
// importar-excel.ts
// Script de importación robusto — Municipalidad de Lima
// ============================================================
// USO:
//   npx tsx scripts/importar-excel.ts                    → importa datos_reales.xlsx
//   npx tsx scripts/importar-excel.ts --dry-run          → simula sin escribir en la BD
//   npx tsx scripts/importar-excel.ts --file=otro.xlsx   → importa otro archivo
//
// CARACTERÍSTICAS:
//   ✅ Upsert por CODIGO (idempotente: re-importar actualiza sin duplicar)
//   ✅ Contratos: busca existentes antes de crear nuevos
//   ✅ Matching de catálogos con tolerancia ("S.R.L." = "SRL")
//   ✅ Fechas: soporta DD/MM/YYYY, YYYY-MM-DD y seriales de Excel
//   ✅ Registro de cada importación en tabla 'importaciones'
//   ✅ Reporte detallado de errores por fila
//   ✅ Subida en lotes (batches) para no saturar Supabase
// ============================================================

import * as xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const FILE_FLAG = ARGS.find(a => a.startsWith('--file='));
const EXCEL_FILE = FILE_FLAG
  ? FILE_FLAG.split('=')[1]
  : 'datos_reales.xlsx';
const BATCH_SIZE = 100;

// ─────────────────────────────────────────────────────────────
// SUPABASE CLIENT
// ─────────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ ERROR: Faltan credenciales de Supabase en .env.local');
  console.error('   Necesitas: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('\n⚠️  AVISO: Estás usando ANON_KEY en vez de SERVICE_ROLE_KEY.');
  console.warn('   El script podría fallar si RLS bloquea las operaciones.\n');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────

/**
 * Normalización estándar: quita tildes, pasa a mayúsculas,
 * recorta espacios y colapsa espacios múltiples.
 * Es equivalente a la función normalizar_texto() de la BD.
 */
function normalizar(texto: any): string {
  if (texto == null || texto === '') return '';
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quitar diacríticos
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ');             // colapsar espacios
}

/**
 * Normalización agresiva: además quita puntos.
 * Sirve para matchear "PANELES NAPSA S.R.L." con "PANELES NAPSA SRL".
 */
function normalizarAgresivo(texto: any): string {
  return normalizar(texto).replace(/\./g, '');
}

/**
 * Parsea una fecha del Excel a formato ISO (YYYY-MM-DD).
 *
 * Acepta:
 *  - Texto "DD/MM/YYYY"  → "2025-12-22"
 *  - Texto "YYYY-MM-DD"  → se deja tal cual
 *  - Número serial Excel  → se convierte (ej: 45648 → fecha ISO)
 *  - Vacío/null           → null
 */
function parsearFecha(valor: any): string | null {
  if (valor == null || valor === '') return null;

  // Número serial de Excel (cuenta días desde 1900-01-01)
  if (typeof valor === 'number') {
    const fecha = new Date((valor - 25569) * 86400000);
    if (isNaN(fecha.getTime())) return null;
    return fecha.toISOString().split('T')[0];
  }

  const str = String(valor).trim();

  // Formato DD/MM/YYYY o D/M/YYYY
  const partes = str.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (partes) {
    const [, dia, mes, anio] = partes;
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  // Formato YYYY-MM-DD (ya está en ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  return null; // formato no reconocido
}

/**
 * Parsea un valor numérico del Excel.
 * Tolera comas decimales, unidades ("m²"), espacios.
 * Devuelve null si no es un número válido.
 * La BD tiene CHECK (campo > 0), así que ≤ 0 se trata como null.
 */
function parsearNumero(valor: any): number | null {
  if (valor == null || valor === '') return null;
  if (typeof valor === 'number') return valor > 0 ? valor : null;

  const limpio = String(valor)
    .replace(/m²|m2|m/gi, '')
    .replace(/,/g, '.')
    .replace(/\s/g, '')
    .trim();

  const num = parseFloat(limpio);
  if (isNaN(num) || num <= 0) return null;
  return num;
}

/**
 * Lee un valor de una fila de Excel probando varios nombres de columna.
 * Esto hace al script tolerante a variaciones en los encabezados.
 */
function leerColumna(row: Record<string, any>, ...nombres: string[]): any {
  for (const nombre of nombres) {
    const val = row[nombre];
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// TIPOS INTERNOS
// ─────────────────────────────────────────────────────────────

interface ErrorFila {
  fila: number;
  codigo: string;
  campo: string;
  mensaje: string;
  nivel: 'error' | 'warn';
}

interface ResumenImportacion {
  archivo: string;
  totalFilasExcel: number;
  filasValidas: number;
  filasRechazadas: number;
  contratosCreados: number;
  contratosReutilizados: number;
  panelesSubidos: number;
  panelesFallidos: number;
  errores: ErrorFila[];
  dryRun: boolean;
}

// ─────────────────────────────────────────────────────────────
// MAPAS DE CATÁLOGO CON DOBLE NIVEL DE MATCHING
// ─────────────────────────────────────────────────────────────

/**
 * Estructura que permite buscar un catálogo primero por match normal
 * (con puntos), y si falla, por match agresivo (sin puntos).
 * Esto evita que "S.R.L." ≠ "SRL" rompa la importación.
 */
interface CatMap {
  normal: Map<string, string>;
  agresivo: Map<string, string>;
}

function crearMapa(items: { id: string; nombre: string }[]): CatMap {
  const normal = new Map<string, string>();
  const agresivo = new Map<string, string>();
  for (const item of items) {
    normal.set(normalizar(item.nombre), item.id);
    agresivo.set(normalizarAgresivo(item.nombre), item.id);
  }
  return { normal, agresivo };
}

function buscarEnMapa(mapa: CatMap, valor: any): string | null {
  if (valor == null || valor === '') return null;
  // Intento 1: match estándar (respeta puntos)
  const id = mapa.normal.get(normalizar(valor));
  if (id) return id;
  // Intento 2: match agresivo (quita puntos → "S.R.L." = "SRL")
  return mapa.agresivo.get(normalizarAgresivo(valor)) || null;
}

// ─────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────

async function importarExcel(): Promise<void> {
  const filePath = path.join(process.cwd(), 'scripts', EXCEL_FILE);

  // ── Banner ──
  console.log('\n' + '═'.repeat(62));
  console.log('  📊 IMPORTADOR DE PANELES — Municipalidad de Lima');
  console.log('═'.repeat(62));
  console.log(`  📂 Archivo:    ${EXCEL_FILE}`);
  console.log(`  🔗 Supabase:   ${supabaseUrl}`);
  console.log(`  📦 Batch size: ${BATCH_SIZE} paneles por bloque`);
  if (DRY_RUN) {
    console.log('  🧪 MODO:       SIMULACIÓN (no se guardan datos)');
  } else {
    console.log('  🚀 MODO:       PRODUCCIÓN (se guardan datos en la BD)');
  }
  console.log('═'.repeat(62));

  // ═════════════════════════════════════════════════════════
  // PASO 1: LEER EXCEL
  // ═════════════════════════════════════════════════════════

  console.log('\n📂 Paso 1/6 — Leyendo archivo Excel...');

  let workbook: xlsx.WorkBook;
  try {
    workbook = xlsx.readFile(filePath);
  } catch (err: any) {
    console.error(`   ❌ No se pudo abrir: ${filePath}`);
    console.error(`   ${err.message}`);
    process.exit(1);
  }

  // Prefiere hoja llamada "Paneles"; si no, usa la primera hoja.
  const sheetName = workbook.SheetNames.includes('Paneles')
    ? 'Paneles'
    : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json<Record<string, any>>(worksheet);

  console.log(`   ✅ Hoja "${sheetName}": ${data.length} filas encontradas.`);

  if (data.length === 0) {
    console.error('   ❌ El archivo está vacío. Nada que importar.');
    return;
  }

  // Mostrar columnas detectadas para diagnóstico rápido
  const colsDetectadas = Object.keys(data[0]);
  console.log(`   📋 Columnas: ${colsDetectadas.join(' | ')}`);

  // ═════════════════════════════════════════════════════════
  // PASO 2: CARGAR CATÁLOGOS
  // ═════════════════════════════════════════════════════════

  console.log('\n📥 Paso 2/6 — Descargando catálogos de Supabase...');

  const { data: catalogosDB, error: errCat } = await supabase
    .from('v_catalogos_activos')
    .select('*');

  if (errCat) {
    console.error(`   ❌ Error descargando catálogos: ${errCat.message}`);
    console.error('   ¿Ejecutaste los scripts SQL (01 al 09)?');
    process.exit(1);
  }
  if (!catalogosDB || catalogosDB.length === 0) {
    console.error('   ❌ La vista v_catalogos_activos devolvió 0 registros.');
    console.error('   ¿Ejecutaste 09_seed_catalogos.sql?');
    process.exit(1);
  }

  // Separar catálogos por tipo
  const porTipo: Record<string, { id: string; nombre: string }[]> = {};
  for (const c of catalogosDB) {
    if (!porTipo[c.tipo]) porTipo[c.tipo] = [];
    porTipo[c.tipo].push({ id: c.id, nombre: c.nombre });
  }

  const mapDistritos      = crearMapa(porTipo['distrito'] || []);
  const mapEmpresas       = crearMapa(porTipo['empresa'] || []);
  const mapTiposContrato  = crearMapa(porTipo['tipo_contrato'] || []);
  const mapTiposEPE       = crearMapa(porTipo['tipo_epe'] || []);
  const mapCaract         = crearMapa(porTipo['caracteristica'] || []);
  const mapMaterial       = crearMapa(porTipo['material'] || []);
  const mapTiposVia       = crearMapa(porTipo['tipo_via'] || []);
  const mapEspacioPub     = crearMapa(porTipo['espacio_pub'] || []);

  const cnt = (tipo: string) => (porTipo[tipo] || []).length;
  console.log(`   ✅ Catálogos cargados:`);
  console.log(`      ${cnt('distrito')} distritos · ${cnt('empresa')} empresas · ${cnt('tipo_contrato')} tipos contrato`);
  console.log(`      ${cnt('tipo_epe')} tipos EPE · ${cnt('caracteristica')} características · ${cnt('material')} materiales`);
  console.log(`      ${cnt('tipo_via')} tipos vía · ${cnt('espacio_pub')} espacios publicitarios`);

  // ═════════════════════════════════════════════════════════
  // PASO 3: VALIDAR Y TRANSFORMAR CADA FILA
  // ═════════════════════════════════════════════════════════

  console.log('\n⚙️  Paso 3/6 — Validando y transformando datos...');

  const errores: ErrorFila[] = [];
  const panelesValidos: any[] = [];
  const contratosUnicos = new Map<string, any>();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const numFila = i + 2; // fila 1 = cabecera, índice 0 = primera fila de datos

    // ── Leer cada campo con tolerancia a nombres alternativos ──

    const rawCodigo   = leerColumna(row, 'CODIGO', 'COD', 'CÓDIGO', 'COD. PANEL');
    const rawLat      = leerColumna(row, 'LAT', 'LATITUD', 'Y', 'COORD_Y');
    const rawLon      = leerColumna(row, 'LON', 'LONGITUD', 'LONG', 'X', 'COORD_X');
    const rawDistrito = leerColumna(row, 'DISTRITO');
    const rawEmpresa  = leerColumna(row, 'EMPRESA', 'RAZON SOCIAL', 'COMPAÑIA', 'COMPANIA');

    const codigoStr = rawCodigo ? String(rawCodigo).trim() : '';

    // ── Validar los 4 campos que la BD exige NOT NULL ──

    let filaValida = true;

    if (!codigoStr) {
      errores.push({
        fila: numFila, codigo: '(vacío)', campo: 'CODIGO',
        mensaje: 'CODIGO está vacío. Campo obligatorio en la BD.', nivel: 'error'
      });
      filaValida = false;
    }

    if (rawLat == null) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'LAT',
        mensaje: 'LAT (latitud) está vacía. Campo obligatorio en la BD.', nivel: 'error'
      });
      filaValida = false;
    }

    if (rawLon == null) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'LON',
        mensaje: 'LON (longitud) está vacía. Campo obligatorio en la BD.', nivel: 'error'
      });
      filaValida = false;
    }

    // Parsear coordenadas
    const latNum = parseFloat(rawLat);
    const lonNum = parseFloat(rawLon);

    if (rawLat != null && (isNaN(latNum) || latNum < -90 || latNum > 90)) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'LAT',
        mensaje: `LAT="${rawLat}" no es una coordenada válida (-90 a 90).`, nivel: 'error'
      });
      filaValida = false;
    }

    if (rawLon != null && (isNaN(lonNum) || lonNum < -180 || lonNum > 180)) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'LON',
        mensaje: `LON="${rawLon}" no es una coordenada válida (-180 a 180).`, nivel: 'error'
      });
      filaValida = false;
    }

    // Distrito: obligatorio y debe existir en la BD
    const distritoId = buscarEnMapa(mapDistritos, rawDistrito);

    if (!rawDistrito) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'DISTRITO',
        mensaje: 'DISTRITO está vacío. Campo obligatorio en la BD.', nivel: 'error'
      });
      filaValida = false;
    } else if (!distritoId) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'DISTRITO',
        mensaje: `DISTRITO="${rawDistrito}" no existe en la BD. Verifique ortografía.`, nivel: 'error'
      });
      filaValida = false;
    }

    // Si falla algún campo crítico, saltar esta fila
    if (!filaValida) continue;

    // ── Resolver catálogos opcionales ──

    const empresaId = buscarEnMapa(mapEmpresas, rawEmpresa);
    if (rawEmpresa && !empresaId) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'EMPRESA',
        mensaje: `EMPRESA="${rawEmpresa}" no encontrada en la BD. Se importará sin empresa.`,
        nivel: 'warn'
      });
    }

    const rawTipoEpe = leerColumna(row, 'TIPO EPE', 'TIPO DE EPE', 'TIPO ELEMENTO');
    const tipoEpeId = buscarEnMapa(mapTiposEPE, rawTipoEpe);
    if (rawTipoEpe && !tipoEpeId) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'TIPO EPE',
        mensaje: `TIPO EPE="${rawTipoEpe}" no encontrado en la BD.`, nivel: 'warn'
      });
    }

    const rawCaract = leerColumna(row,
      'CARACT. TECNICAS', 'CARACTERISTICAS', 'CARACT TECNICAS',
      'CARACTERISTICAS TECNICAS', 'CARACT. TÉCNICAS');
    const caractId = buscarEnMapa(mapCaract, rawCaract);
    if (rawCaract && !caractId) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'CARACT. TECNICAS',
        mensaje: `CARACT. TECNICAS="${rawCaract}" no encontrada en la BD.`, nivel: 'warn'
      });
    }

    const rawMaterial = leerColumna(row,
      'MATERIAL PREDOMINANTE', 'MATERIAL', 'MAT. PREDOMINANTE');
    const materialId = buscarEnMapa(mapMaterial, rawMaterial);
    if (rawMaterial && !materialId) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'MATERIAL PREDOMINANTE',
        mensaje: `MATERIAL="${rawMaterial}" no encontrado en la BD.`, nivel: 'warn'
      });
    }

    const rawTipoVia = leerColumna(row, 'TIPO DE VIA', 'TIPO VIA', 'VIA');
    const tipoViaId = buscarEnMapa(mapTiposVia, rawTipoVia);
    if (rawTipoVia && !tipoViaId) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'TIPO DE VIA',
        mensaje: `TIPO DE VIA="${rawTipoVia}" no encontrado en la BD.`, nivel: 'warn'
      });
    }

    const rawEspacioPub = leerColumna(row,
      'ESPACIO PUBLICITARIO', 'ESP. PUBLICITARIO', 'ESPACIO PUB');
    const espacioPubId = buscarEnMapa(mapEspacioPub, rawEspacioPub);
    if (rawEspacioPub && !espacioPubId) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'ESPACIO PUBLICITARIO',
        mensaje: `ESPACIO PUBLICITARIO="${rawEspacioPub}" no encontrado en la BD.`, nivel: 'warn'
      });
    }

    // ── Contrato (opcional) ──

    const rawNumContrato = leerColumna(row,
      'N° CONTRATO', 'CONTRATO', 'NRO CONTRATO', 'N CONTRATO');
    let contratoKey: string | null = null;

    if (rawNumContrato && empresaId) {
      const rawTipoContrato = leerColumna(row, 'TIPO CONTRATO', 'TIPO_CONTRATO');
      const tipoContratoId = buscarEnMapa(mapTiposContrato, rawTipoContrato);

      const fechaSuscripcion = parsearFecha(
        leerColumna(row, 'FECHA SUSCRIPCION', 'FECHA', 'FEC. SUSCRIPCION',
          'FECHA DE SUSCRIPCION')
      );

      contratoKey = `${empresaId}||${normalizar(rawNumContrato)}`;

      if (!contratosUnicos.has(contratoKey)) {
        contratosUnicos.set(contratoKey, {
          numero_contrato: normalizar(rawNumContrato),
          empresa_id: empresaId,
          tipo_contrato_id: tipoContratoId || null,
          fecha_suscripcion: fechaSuscripcion,
          plazo_anios: 5,
        });
      }
    } else if (rawNumContrato && !empresaId) {
      errores.push({
        fila: numFila, codigo: codigoStr, campo: 'N° CONTRATO',
        mensaje: `Tiene contrato "${rawNumContrato}" pero la empresa no se resolvió. Se importará sin contrato.`,
        nivel: 'warn'
      });
    }

    // ── Construir el objeto panel para insertar ──

    const rawNExcel = leerColumna(row, 'N°', 'Nro', '#', 'ITEM', 'N');
    const nExcel = rawNExcel != null ? (parseInt(String(rawNExcel), 10) || null) : null;

    panelesValidos.push({
      n_excel: nExcel,
      codigo: codigoStr,
      latitud: latNum,
      longitud: lonNum,
      utm_este: parsearNumero(leerColumna(row, 'UTM-ESTE', 'UTM ESTE', 'ESTE')),
      utm_norte: parsearNumero(leerColumna(row, 'UTM-NORTE', 'UTM NORTE', 'NORTE')),
      direccion: leerColumna(row, 'DIRECCION', 'DIRECCIÓN', 'UBICACIÓN', 'UBICACION') || null,
      distrito_id: distritoId!,
      empresa_id: empresaId || null,
      tipo_epe_id: tipoEpeId || null,
      caracteristica_id: caractId || null,
      material_id: materialId || null,
      tipo_via_id: tipoViaId || null,
      espacio_pub_id: espacioPubId || null,
      nro_registro_frap: leerColumna(row,
        'N° REGISTRO FRAP', 'FRAP', 'NRO FRAP', 'REGISTRO FRAP',
        'N REGISTRO FRAP') || null,
      area_ocupacion: parsearNumero(
        leerColumna(row, 'AREA DE OCUPACION', 'AREA OCUPACION', 'A. OCUPACION')),
      area_exhibicion: parsearNumero(
        leerColumna(row, 'AREA DE EXIBICION', 'AREA EXHIBICION',
          'AREA DE EXHIBICION', 'A. EXHIBICION', 'A. EXIBICION')),
      altura_poste: parsearNumero(
        leerColumna(row, 'ALTURA DE POSTE', 'ALTURA POSTE', 'ALT. POSTE')),
      alto: parsearNumero(leerColumna(row, 'ALTO')),
      largo: parsearNumero(leerColumna(row, 'LARGO', 'ANCHO')),
      espesor: parsearNumero(leerColumna(row, 'ESPESOR', 'GROSOR', 'PROFUNDIDAD')),
      // Campo temporal — se resuelve en el paso 4
      _contratoKey: contratoKey,
    });
  }

  // ── Mostrar resumen de validación ──

  const erroresGraves = errores.filter(e => e.nivel === 'error');
  const advertencias  = errores.filter(e => e.nivel === 'warn');

  console.log(`   ✅ ${panelesValidos.length} paneles válidos de ${data.length} filas.`);
  if (erroresGraves.length > 0) {
    console.log(`   ❌ ${erroresGraves.length} filas rechazadas (datos críticos faltantes).`);
  }
  if (advertencias.length > 0) {
    console.log(`   ⚠️  ${advertencias.length} advertencias (datos parciales, se importan igual).`);
  }

  // Mostrar hasta 25 errores graves
  if (erroresGraves.length > 0) {
    console.log('\n   ── Errores críticos (filas rechazadas) ──');
    for (const e of erroresGraves.slice(0, 25)) {
      console.log(`   ❌ Fila ${e.fila} [${e.codigo}] ${e.campo}: ${e.mensaje}`);
    }
    if (erroresGraves.length > 25) {
      console.log(`   ... y ${erroresGraves.length - 25} errores más.`);
    }
  }

  // Mostrar hasta 15 advertencias
  if (advertencias.length > 0) {
    console.log('\n   ── Advertencias (se importan con datos parciales) ──');
    for (const e of advertencias.slice(0, 15)) {
      console.log(`   ⚠️  Fila ${e.fila} [${e.codigo}] ${e.campo}: ${e.mensaje}`);
    }
    if (advertencias.length > 15) {
      console.log(`   ... y ${advertencias.length - 15} advertencias más.`);
    }
  }

  if (panelesValidos.length === 0) {
    console.log('\n❌ No hay paneles válidos para importar. Revisa los errores.');
    return;
  }

  // ── Si es dry-run, mostrar resumen y salir ──

  if (DRY_RUN) {
    console.log('\n' + '─'.repeat(62));
    console.log('  🧪 SIMULACIÓN COMPLETADA — No se escribió nada en la BD.');
    console.log(`  Se habrían procesado:`);
    console.log(`     ${panelesValidos.length} paneles`);
    console.log(`     ${contratosUnicos.size} contratos únicos`);
    console.log('  Para importar de verdad, ejecuta SIN --dry-run.');
    console.log('─'.repeat(62) + '\n');
    return;
  }

  // ═════════════════════════════════════════════════════════
  // PASO 4: CONTRATOS (buscar existentes o crear nuevos)
  // ═════════════════════════════════════════════════════════

  console.log(`\n📝 Paso 4/6 — Procesando ${contratosUnicos.size} contratos únicos...`);

  const mapContratoIdReal = new Map<string, string>();
  let contratosCreados = 0;
  let contratosReutilizados = 0;

  for (const [key, contrato] of contratosUnicos) {
    // Primero buscar si ya existe en la BD
    const { data: existentes, error: errBuscar } = await supabase
      .from('contratos')
      .select('id')
      .eq('numero_contrato', contrato.numero_contrato)
      .eq('empresa_id', contrato.empresa_id)
      .limit(1);

    if (errBuscar) {
      console.error(`   ❌ Error buscando contrato "${contrato.numero_contrato}": ${errBuscar.message}`);
      continue;
    }

    if (existentes && existentes.length > 0) {
      // Ya existe → reutilizar
      mapContratoIdReal.set(key, existentes[0].id);
      contratosReutilizados++;
      console.log(`   ♻️  "${contrato.numero_contrato}" ya existe → reutilizado.`);
    } else {
      // No existe → crear
      const { data: nuevo, error: errCrear } = await supabase
        .from('contratos')
        .insert(contrato)
        .select('id')
        .single();

      if (errCrear) {
        console.error(`   ❌ Error creando contrato "${contrato.numero_contrato}": ${errCrear.message}`);
      } else if (nuevo) {
        mapContratoIdReal.set(key, nuevo.id);
        contratosCreados++;
        console.log(`   ✅ "${contrato.numero_contrato}" creado.`);
      }
    }
  }

  // Asignar el ID real del contrato a cada panel y limpiar campo temporal
  for (const panel of panelesValidos) {
    if (panel._contratoKey) {
      panel.contrato_id = mapContratoIdReal.get(panel._contratoKey) || null;
    }
    delete panel._contratoKey;
  }

  // ═════════════════════════════════════════════════════════
  // PASO 5: UPSERT PANELES EN LOTES
  // ═════════════════════════════════════════════════════════

  console.log(`\n🚀 Paso 5/6 — Subiendo ${panelesValidos.length} paneles en bloques de ${BATCH_SIZE}...`);

  let panelesOk = 0;
  let panelesFail = 0;
  const totalBloques = Math.ceil(panelesValidos.length / BATCH_SIZE);

  for (let i = 0; i < panelesValidos.length; i += BATCH_SIZE) {
    const batch = panelesValidos.slice(i, i + BATCH_SIZE);
    const numBloque = Math.floor(i / BATCH_SIZE) + 1;
    const desde = i + 1;
    const hasta = Math.min(i + BATCH_SIZE, panelesValidos.length);

    process.stdout.write(
      `   📦 Bloque ${numBloque}/${totalBloques} (paneles ${desde}–${hasta})... `
    );

    // UPSERT por CODIGO: si ya existe, actualiza; si no, inserta.
    // Esto hace que re-importar el mismo Excel sea seguro.
    const { error: errUpsert } = await supabase
      .from('paneles')
      .upsert(batch, { onConflict: 'codigo' });

    if (errUpsert) {
      console.log('❌');
      console.error(`      Error: ${errUpsert.message}`);
      panelesFail += batch.length;
    } else {
      console.log('✅');
      panelesOk += batch.length;
    }
  }

  // ═════════════════════════════════════════════════════════
  // PASO 6: REGISTRAR EN TABLA importaciones
  // ═════════════════════════════════════════════════════════

  console.log('\n📋 Paso 6/6 — Registrando importación en el historial...');

  const estadoFinal = panelesFail === 0 ? 'completada' : 'fallida';

  const { error: errLog } = await supabase
    .from('importaciones')
    .insert({
      nombre_archivo: EXCEL_FILE,
      total_filas: data.length,
      insertadas: panelesOk,
      actualizadas: 0, // upsert no distingue insert de update
      rechazadas: (data.length - panelesValidos.length) + panelesFail,
      errores: errores.slice(0, 100), // máximo 100 errores en el JSON
      estado: estadoFinal,
    });

  if (errLog) {
    console.log(`   ⚠️  No se pudo registrar: ${errLog.message}`);
    console.log('   (La importación de paneles SÍ se completó, solo el log falló.)');
  } else {
    console.log(`   ✅ Importación registrada (estado: ${estadoFinal}).`);
  }

  // ═════════════════════════════════════════════════════════
  // RESUMEN FINAL
  // ═════════════════════════════════════════════════════════

  imprimirResumen({
    archivo: EXCEL_FILE,
    totalFilasExcel: data.length,
    filasValidas: panelesValidos.length,
    filasRechazadas: data.length - panelesValidos.length,
    contratosCreados,
    contratosReutilizados,
    panelesSubidos: panelesOk,
    panelesFallidos: panelesFail,
    errores,
    dryRun: false,
  });
}

// ─────────────────────────────────────────────────────────────
// RESUMEN DE IMPORTACIÓN
// ─────────────────────────────────────────────────────────────

function imprimirResumen(r: ResumenImportacion): void {
  console.log('\n' + '═'.repeat(62));
  console.log('  📊 RESUMEN DE IMPORTACIÓN');
  console.log('═'.repeat(62));
  console.log(`  📂 Archivo:              ${r.archivo}`);
  console.log(`  📄 Total filas Excel:    ${r.totalFilasExcel}`);
  console.log(`  ✅ Filas válidas:        ${r.filasValidas}`);
  console.log(`  ❌ Filas rechazadas:     ${r.filasRechazadas}`);
  console.log('  ──────────────────────────────────────');
  console.log(`  📝 Contratos creados:    ${r.contratosCreados}`);
  console.log(`  ♻️  Contratos existentes: ${r.contratosReutilizados}`);
  console.log(`  🏗️  Paneles subidos:      ${r.panelesSubidos}`);
  console.log(`  💥 Paneles fallidos:     ${r.panelesFallidos}`);
  console.log('═'.repeat(62));

  if (r.dryRun) {
    console.log('  🧪 SIMULACIÓN — No se guardó nada en la BD.');
    console.log('  Ejecuta SIN --dry-run para importar de verdad.\n');
  } else if (r.panelesFallidos === 0 && r.filasRechazadas === 0) {
    console.log('  🎉 ¡IMPORTACIÓN PERFECTA! Todos los datos subieron sin errores.\n');
  } else if (r.panelesFallidos === 0) {
    console.log('  ✅ Importación completada. Revisa advertencias arriba.\n');
  } else {
    console.log('  ⚠️  Importación parcial. Algunos paneles fallaron.\n');
  }
}

// ─────────────────────────────────────────────────────────────
// EJECUTAR
// ─────────────────────────────────────────────────────────────

importarExcel().catch(err => {
  console.error('\n💥 Error fatal inesperado:', err);
  process.exit(1);
});
