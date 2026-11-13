// ============================================================
// importar-excel.ts
// Script de importación robusto y profesional — Municipalidad de Lima
// ============================================================
// USO:
//   npx tsx scripts/importar-excel.ts                    → importa scripts/PlantillaEstandarBD.xlsx
//   npx tsx scripts/importar-excel.ts --dry-run          → simula sin escribir en la BD
//   npx tsx scripts/importar-excel.ts --file=mi_archivo.xlsx
//
// CARACTERÍSTICAS PROFESIONALES:
//   ✅ Tolerancia total de encabezados (lee por nombres textuales o variantes)
//   ✅ Auto-creación dinámica de empresas nuevas sin bloquear filas
//   ✅ Upsert idempotente por CODIGO (actualiza sin duplicar)
//   ✅ Soporte integral para paneles con y sin contrato (6 estados oficiales)
//   ✅ Parseo robusto de coordenadas WGS84 preservando todos los decimales
//   ✅ Conversión de fechas (DD/MM/YYYY, YYYY-MM-DD o número serial de Excel)
//   ✅ Procesamiento en lotes (batches de 100) para soportar miles de registros
//   ✅ Reporte claro en terminal con resumen detallado
// ============================================================

import * as xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN Y PARÁMETROS
// ─────────────────────────────────────────────────────────────

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const FILE_FLAG = ARGS.find(a => a.startsWith('--file='));

let EXCEL_FILE = 'PlantillaEstandarBD.xlsx';
if (FILE_FLAG) {
  EXCEL_FILE = FILE_FLAG.split('=')[1];
} else if (fs.existsSync(path.join(process.cwd(), 'scripts', 'PlantillaEstandarBD.xlsx'))) {
  EXCEL_FILE = 'PlantillaEstandarBD.xlsx';
} else if (fs.existsSync(path.join(process.cwd(), 'scripts', 'datos_reales.xlsx'))) {
  EXCEL_FILE = 'datos_reales.xlsx';
}

const BATCH_SIZE = 100;

// ─────────────────────────────────────────────────────────────
// CLIENTE DE SUPABASE
// ─────────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ ERROR: Faltan credenciales de Supabase en .env.local');
  console.error('   Se requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─────────────────────────────────────────────────────────────
// FUNCIONES DE NORMALIZACIÓN Y PARSEO
// ─────────────────────────────────────────────────────────────

function normalizar(texto: any): string {
  if (texto == null || texto === '') return '';
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // Quitar tildes/diacríticos
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ');             // Colapsar espacios múltiples
}

function normalizarAgresivo(texto: any): string {
  return normalizar(texto).replace(/[.\-_,]/g, '');
}

function parsearFecha(valor: any): string | null {
  if (valor == null || valor === '') return null;

  // Número de fecha serial en Excel
  if (typeof valor === 'number') {
    const fecha = new Date((valor - 25569) * 86400000);
    if (isNaN(fecha.getTime())) return null;
    return fecha.toISOString().split('T')[0];
  }

  const str = String(valor).trim();

  // Formatos DD/MM/YYYY o DD-MM-YYYY
  const partes = str.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (partes) {
    const [, dia, mes, anio] = partes;
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  return null;
}

function parsearNumero(valor: any): number | null {
  if (valor == null || valor === '') return null;
  if (typeof valor === 'number') return isNaN(valor) ? null : valor;

  const limpio = String(valor)
    .replace(/m²|m2|m|metros|año|años/gi, '')
    .replace(/,/g, '.')
    .replace(/\s/g, '')
    .trim();

  const num = parseFloat(limpio);
  if (isNaN(num)) return null;
  return num;
}

function parsearCoordenada(valor: any): number | null {
  if (valor == null || valor === '') return null;
  if (typeof valor === 'number') return isNaN(valor) ? null : valor;

  const limpio = String(valor)
    .replace(/,/g, '.')
    .replace(/\s/g, '')
    .trim();

  const num = parseFloat(limpio);
  return isNaN(num) ? null : num;
}

/**
 * Busca de forma ultra-flexible en una fila de Excel probando múltiples variantes de nombre.
 */
function leerColumna(row: Record<string, any>, ...nombres: string[]): any {
  // 1. Intento por coincidencia exacta
  for (const n of nombres) {
    if (row[n] !== undefined && row[n] !== null && String(row[n]).trim() !== '') {
      return row[n];
    }
  }

  // 2. Intento por coincidencia normalizada (sin tildes, sin espacios, sin mayúsculas/minúsculas)
  const llavesNormalizadas = new Map<string, string>();
  for (const k of Object.keys(row)) {
    llavesNormalizadas.set(normalizarAgresivo(k), k);
  }

  for (const n of nombres) {
    const norm = normalizarAgresivo(n);
    if (llavesNormalizadas.has(norm)) {
      const realKey = llavesNormalizadas.get(norm)!;
      const val = row[realKey];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val;
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// ESTRUCTURAS DE CATÁLOGOS CON DOBLE BÚSQUEDA
// ─────────────────────────────────────────────────────────────

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
  const id1 = mapa.normal.get(normalizar(valor));
  if (id1) return id1;
  return mapa.agresivo.get(normalizarAgresivo(valor)) || null;
}

// ─────────────────────────────────────────────────────────────
// SCRIPT PRINCIPAL
// ─────────────────────────────────────────────────────────────

async function importarExcel(): Promise<void> {
  const filePath = path.isAbsolute(EXCEL_FILE)
    ? EXCEL_FILE
    : fs.existsSync(EXCEL_FILE)
      ? path.resolve(EXCEL_FILE)
      : path.join(process.cwd(), 'scripts', EXCEL_FILE);

  console.log('\n' + '═'.repeat(66));
  console.log('  🏛️  IMPORTADOR OFICIAL DE PANELES — Municipalidad de Lima');
  console.log('═'.repeat(66));
  console.log(`  📂 Archivo destino: ${filePath}`);
  console.log(`  🔗 Endpoint:        ${supabaseUrl}`);
  console.log(`  ⚙️  Modo ejecución:  ${DRY_RUN ? '🧪 SIMULACIÓN (--dry-run)' : '🚀 ESCRITURA REAL'}\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado en: ${filePath}`);
    console.error('   Coloca tu archivo Excel en la carpeta "scripts/" o pasa --file="ruta/archivo.xlsx".\n');
    process.exit(1);
  }

  // 1. Cargar archivo Excel
  console.log('📖 Paso 1/5 — Leyendo libro Excel...');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: Record<string, any>[] = xlsx.utils.sheet_to_json(sheet, { defval: null });

  console.log(`   Hoja seleccionada: "${sheetName}" con ${rows.length} filas detectadas.`);

  if (rows.length === 0) {
    console.log('❌ El archivo no contiene filas con datos.');
    return;
  }

  // 2. Cargar catálogos desde Supabase
  console.log('\n🔄 Paso 2/5 — Sincronizando catálogos maestros desde Supabase...');

  const [
    { data: distritos },
    { data: empresasExistentes },
    { data: tiposVia },
    { data: espaciosPub },
    { data: tiposEpe },
    { data: caracts },
    { data: materiales },
    { data: estadosContrato },
    { data: tiposContrato }
  ] = await Promise.all([
    supabase.from('distritos').select('id, nombre'),
    supabase.from('empresas').select('id, nombre'),
    supabase.from('tipos_via').select('id, nombre'),
    supabase.from('espacios_publicitarios').select('id, nombre'),
    supabase.from('tipos_epe').select('id, nombre'),
    supabase.from('caracteristicas_tecnicas').select('id, nombre'),
    supabase.from('materiales').select('id, nombre'),
    supabase.from('estados_contrato').select('id, nombre'),
    supabase.from('tipos_contrato').select('id, nombre')
  ]);

  const mapDistritos = crearMapa(distritos || []);
  const mapEmpresas = crearMapa(empresasExistentes || []);
  const mapTiposVia = crearMapa(tiposVia || []);
  const mapEspaciosPub = crearMapa(espaciosPub || []);
  const mapTiposEpe = crearMapa(tiposEpe || []);
  const mapCaracts = crearMapa(caracts || []);
  const mapMateriales = crearMapa(materiales || []);
  const mapEstadosContrato = crearMapa(estadosContrato || []);
  const mapTiposContrato = crearMapa(tiposContrato || []);

  console.log(`   • Distritos:              ${distritos?.length || 0}`);
  console.log(`   • Empresas registradas:   ${empresasExistentes?.length || 0}`);
  console.log(`   • Tipos de Vía:           ${tiposVia?.length || 0}`);
  console.log(`   • Espacios Publicitarios: ${espaciosPub?.length || 0}`);
  console.log(`   • Tipos de EPE:           ${tiposEpe?.length || 0}`);
  console.log(`   • Características:        ${caracts?.length || 0}`);
  console.log(`   • Materiales:             ${materiales?.length || 0}`);
  console.log(`   • Estados de Contrato:    ${estadosContrato?.length || 0}`);

  // 3. Procesar y validar filas
  console.log('\n🔍 Paso 3/5 — Validando y mapeando columnas del Excel...');

  const panelesValidos: any[] = [];
  const empresasNuevasPorCrear = new Map<string, string>(); // normalizado -> nombre original
  const contratosUnicos = new Map<string, any>();
  const errores: any[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const numFila = idx + 2; // Fila Excel 1-based (fila 1 = encabezados)

    // A. Código
    const rawCodigo = leerColumna(r, 'CODIGO', 'CÓDIGO', 'COD', 'NAME', 'ID');
    const codigo = rawCodigo ? String(rawCodigo).trim().toUpperCase() : '';

    if (!codigo) {
      errores.push({ fila: numFila, campo: 'CODIGO', mensaje: 'Código vacío o ausente' });
      continue;
    }

    // B. Coordenadas
    const rawLat = leerColumna(r, 'LATITUD', 'LAT', 'Y');
    const rawLon = leerColumna(r, 'LONGITUD', 'LON', 'LNG', 'X');
    const lat = parsearCoordenada(rawLat);
    const lon = parsearCoordenada(rawLon);

    if (lat == null || lon == null) {
      errores.push({ fila: numFila, campo: 'COORDENADAS', mensaje: `Coordenadas inválidas: lat="${rawLat}", lon="${rawLon}"` });
      continue;
    }

    // C. Distrito
    const rawDistrito = leerColumna(r, 'DISTRITO', 'DIST');
    let distritoId = buscarEnMapa(mapDistritos, rawDistrito);

    // Variaciones comunes
    if (!distritoId && rawDistrito) {
      const normD = normalizar(rawDistrito);
      if (normD === 'ATE VITARTE') distritoId = buscarEnMapa(mapDistritos, 'ATE');
      else if (normD === 'MAGDALENA') distritoId = buscarEnMapa(mapDistritos, 'MAGDALENA DEL MAR');
      else if (normD === 'SANTA MARIA') distritoId = buscarEnMapa(mapDistritos, 'SANTA MARIA DEL MAR');
    }

    if (!distritoId) {
      errores.push({ fila: numFila, campo: 'DISTRITO', mensaje: `Distrito no reconocido: "${rawDistrito}"` });
      continue;
    }

    // D. Empresa (Auto-detección y preparación para auto-creación)
    const rawEmpresa = leerColumna(r, 'EMPRESA', 'RAZON SOCIAL', 'CONCESIONARIO');
    let empresaId: string | null = null;
    if (rawEmpresa) {
      empresaId = buscarEnMapa(mapEmpresas, rawEmpresa);
      if (!empresaId) {
        const normEmp = normalizar(rawEmpresa);
        if (!empresasNuevasPorCrear.has(normEmp)) {
          empresasNuevasPorCrear.set(normEmp, String(rawEmpresa).trim());
        }
      }
    }

    // E. Estado Contractual
    const rawEstado = leerColumna(r, 'ESTADO CONTRACTUAL', 'ESTADO_CONTRACTUAL', 'ESTADO', 'SITUACION LEGAL');
    const estadoContratoId = buscarEnMapa(mapEstadosContrato, rawEstado);

    // F. Tipos y clasificaciones
    const rawTipoVia = leerColumna(r, 'TIPO DE VIA', 'TIPO_DE_VIA', 'TIPO VIA', 'JERARQUIA VIAL');
    const tipoViaId = buscarEnMapa(mapTiposVia, rawTipoVia);

    const rawEspacioPub = leerColumna(r, 'ESPACIO PUBLICITARIO', 'ESPACIO_PUBLICITARIO', 'UBICACION VIAL');
    const espacioPubId = buscarEnMapa(mapEspaciosPub, rawEspacioPub);

    const rawTipoEpe = leerColumna(r, 'TIPO EPE', 'TIPO_EPE', 'TIPO DE EPE', 'SOPORTE');
    const tipoEpeId = buscarEnMapa(mapTiposEpe, rawTipoEpe);

    const rawCaract = leerColumna(r, 'CARACTERISTICAS TECNICAS', 'CARACTERISTICAS TÉCNICAS', 'ILUMINACION');
    const caracteristicaId = buscarEnMapa(mapCaracts, rawCaract);

    const rawMaterial = leerColumna(r, 'MATERIAL PREDOMINANTE', 'MATERIAL_PREDOMINANTE', 'MATERIAL');
    const materialId = buscarEnMapa(mapMateriales, rawMaterial);

    // G. Dirección
    const direccion = leerColumna(r, 'DIRECCION', 'DIRECCIÓN', 'UBICACION') || null;

    // H. Campos de Contrato y Fichas
    const numeroContrato = leerColumna(r, 'N° CONTRATO', 'NRO CONTRATO', 'NUMERO CONTRATO', 'CONTRATO') || null;
    const fichaPublicidad = leerColumna(r, 'FICHA DE CADA PUBLICIDAD', 'FICHA DE PUBLICIDAD', 'FICHA PUBLICIDAD', 'FICHA_PUBLICIDAD') || null;
    const fechaContrato = parsearFecha(leerColumna(r, 'FECHA DE CONTRATO O INICIO DE PROCEDIMIENTO', 'FECHA DE SUSCRIPCION', 'FECHA SUSCRIPCION', 'FECHA'));
    const plazoAnios = parsearNumero(leerColumna(r, 'PLAZO', 'PLAZO_ANIOS', 'PLAZO (AÑOS)')) || 5;

    // I. Dimensiones físicas
    const areaOcupacion = parsearNumero(leerColumna(r, 'AREA DE OCUPACION', 'AREA_OCUPACION', 'A. OCUPACION'));
    const areaExhibicion = parsearNumero(leerColumna(r, 'AREA DE EXIBICION', 'AREA DE EXHIBICION', 'AREA_EXHIBICION', 'A. EXHIBICION'));
    const alturaPoste = parsearNumero(leerColumna(r, 'ALTURA DE POSTE', 'ALTURA_POSTE', 'ALTURA'));
    const alto = parsearNumero(leerColumna(r, 'ALTO'));
    const largo = parsearNumero(leerColumna(r, 'LARGO', 'ANCHO'));
    const espesor = parsearNumero(leerColumna(r, 'ESPESOR', 'GROSOR', 'PROFUNDIDAD'));

    // Objeto panel
    panelesValidos.push({
      codigo,
      latitud: lat,
      longitud: lon,
      direccion,
      distrito_id: distritoId,
      tipo_via_id: tipoViaId,
      espacio_pub_id: espacioPubId,
      tipo_epe_id: tipoEpeId,
      caracteristica_id: caracteristicaId,
      material_id: materialId,
      estado_contrato_id: estadoContratoId,
      area_ocupacion: areaOcupacion,
      area_exhibicion: areaExhibicion,
      altura_poste: alturaPoste,
      alto,
      largo,
      espesor,
      ficha_publicidad: fichaPublicidad ? String(fichaPublicidad).trim() : null,
      plazo_anios: plazoAnios,
      _rawEmpresa: rawEmpresa ? String(rawEmpresa).trim() : null,
      _numeroContrato: numeroContrato ? String(numeroContrato).trim() : null,
      _fechaSuscripcion: fechaContrato,
    });
  }

  console.log(`   Filas analizadas:  ${rows.length}`);
  console.log(`   Paneles válidos:   ${panelesValidos.length}`);
  console.log(`   Filas rechazadas:  ${errores.length}`);
  if (errores.length > 0) {
    console.log(`   Ejemplo de errores detectados (primeros 5):`);
    errores.slice(0, 5).forEach(e => console.log(`     • Fila ${e.fila} [${e.campo}]: ${e.mensaje}`));
  }

  if (panelesValidos.length === 0) {
    console.error('\n❌ No hay paneles válidos para procesar.');
    return;
  }

  // 4. Auto-crear empresas nuevas en Supabase si aparecieron en el Excel
  if (empresasNuevasPorCrear.size > 0) {
    console.log(`\n🏢 Se detectaron ${empresasNuevasPorCrear.size} empresas NUEVAS en el Excel.`);
    if (!DRY_RUN) {
      for (const [norm, nombreReal] of empresasNuevasPorCrear.entries()) {
        const { data: nuevaEmp, error: errEmp } = await supabase
          .from('empresas')
          .insert({ nombre: nombreReal, nombre_norm: norm })
          .select('id, nombre')
          .single();

        if (errEmp) {
          console.error(`   ⚠️  No se pudo auto-crear empresa "${nombreReal}": ${errEmp.message}`);
        } else if (nuevaEmp) {
          mapEmpresas.normal.set(norm, nuevaEmp.id);
          mapEmpresas.agresivo.set(normalizarAgresivo(nombreReal), nuevaEmp.id);
          console.log(`   ✨ Empresa auto-creada exitosamente: "${nombreReal}"`);
        }
      }
    } else {
      console.log(`   [Simulación] Se auto-crearían: ${Array.from(empresasNuevasPorCrear.values()).join(', ')}`);
    }
  }

  // Resolver ID de empresa definitivo y contratos
  for (const p of panelesValidos) {
    if (p._rawEmpresa) {
      p.empresa_id = buscarEnMapa(mapEmpresas, p._rawEmpresa) || null;
    }

    // Si tiene contrato y empresa, registrar contrato
    if (p._numeroContrato && p.empresa_id) {
      const cKey = `${p.empresa_id}||${normalizar(p._numeroContrato)}`;
      if (!contratosUnicos.has(cKey)) {
        contratosUnicos.set(cKey, {
          numero_contrato: normalizar(p._numeroContrato),
          empresa_id: p.empresa_id,
          fecha_suscripcion: p._fechaSuscripcion,
          plazo_anios: p.plazo_anios || 5,
        });
      }
      p._contratoKey = cKey;
    }

    delete p._rawEmpresa;
    delete p._numeroContrato;
    delete p._fechaSuscripcion;
  }

  if (DRY_RUN) {
    console.log('\n' + '─'.repeat(66));
    console.log('  🧪 SIMULACIÓN (--dry-run) FINALIZADA CON ÉXITO');
    console.log(`  Se habrían procesado ${panelesValidos.length} paneles y ${contratosUnicos.size} contratos.`);
    console.log('  Ningún dato fue modificado en Supabase.');
    console.log('─'.repeat(66) + '\n');
    return;
  }

  // 5. Procesar e insertar Contratos
  console.log(`\n📄 Paso 4/5 — Procesando ${contratosUnicos.size} contratos asociados...`);
  const mapContratoId = new Map<string, string>();

  for (const [key, cData] of contratosUnicos.entries()) {
    const { data: exist } = await supabase
      .from('contratos')
      .select('id')
      .eq('numero_contrato', cData.numero_contrato)
      .eq('empresa_id', cData.empresa_id)
      .limit(1);

    if (exist && exist.length > 0) {
      mapContratoId.set(key, exist[0].id);
    } else {
      const { data: newC, error: errC } = await supabase
        .from('contratos')
        .insert(cData)
        .select('id')
        .single();

      if (!errC && newC) {
        mapContratoId.set(key, newC.id);
      }
    }
  }

  // Asignar ID de contrato a los paneles
  for (const p of panelesValidos) {
    if (p._contratoKey) {
      p.contrato_id = mapContratoId.get(p._contratoKey) || null;
      delete p._contratoKey;
    }
  }

  // 6. Subir paneles en Lotes (Batches)
  console.log(`\n🚀 Paso 5/5 — Subiendo ${panelesValidos.length} paneles en bloques de ${BATCH_SIZE}...`);

  let subidos = 0;
  let fallidos = 0;
  const totalLotes = Math.ceil(panelesValidos.length / BATCH_SIZE);

  for (let b = 0; b < totalLotes; b++) {
    const inicio = b * BATCH_SIZE;
    const fin = Math.min(inicio + BATCH_SIZE, panelesValidos.length);
    const lote = panelesValidos.slice(inicio, fin);

    process.stdout.write(`   📦 Bloque ${b + 1}/${totalLotes} (${inicio + 1}–${fin})... `);

    const { error: errBatch } = await supabase
      .from('paneles')
      .upsert(lote, { onConflict: 'codigo' });

    if (errBatch) {
      console.log('❌');
      console.error(`      Fallo en bloque: ${errBatch.message}`);
      fallidos += lote.length;
    } else {
      console.log('✅');
      subidos += lote.length;
    }

    // Pequeña pausa de cortesía para no saturar la conexión
    await new Promise(r => setTimeout(r, 60));
  }

  // Resumen final
  console.log('\n' + '═'.repeat(66));
  console.log('  🎉 IMPORTACIÓN FINALIZADA');
  console.log('═'.repeat(66));
  console.log(`  📊 Total filas analizadas: ${rows.length}`);
  console.log(`  ✅ Paneles guardados en BD: ${subidos}`);
  console.log(`  ❌ Paneles con error:      ${fallidos}`);
  console.log(`  🏢 Empresas nuevas creadas: ${empresasNuevasPorCrear.size}`);
  console.log(`  📝 Contratos procesados:    ${contratosUnicos.size}`);
  console.log('═'.repeat(66) + '\n');
}

importarExcel().catch(err => {
  console.error('\n💥 Error fatal:', err);
  process.exit(1);
});
