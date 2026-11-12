import * as xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const client = createClient(supabaseUrl, supabaseKey);

function parseCoord(val: any): number {
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(/,/g, '.').trim());
}

async function verificar() {
  console.log('\n🔍 INICIANDO AUDITORÍA CRUZADA: EXCEL vs SUPABASE...\n');

  // 1. Leer Excel
  const excelPath = path.join(process.cwd(), 'scripts', 'PlantillaEstandarBD.xlsx');
  const wb = xlsx.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet);

  console.log(`📊 Filas leídas del Excel: ${rows.length}`);

  // 2. Leer Supabase
  const { data: dbPaneles, error } = await client
    .from('v_paneles_publicos')
    .select('codigo, latitud, longitud');

  if (error || !dbPaneles) {
    console.error('❌ Error leyendo Supabase:', error?.message);
    process.exit(1);
  }

  console.log(`☁️  Paneles obtenidos de Supabase: ${dbPaneles.length}`);

  // Crear mapa indexado por código para búsqueda O(1)
  const dbMap = new Map<string, { latitud: number; longitud: number }>();
  for (const p of dbPaneles) {
    dbMap.set(p.codigo.trim().toUpperCase(), {
      latitud: p.latitud,
      longitud: p.longitud,
    });
  }

  let coincidenciasExactas = 0;
  let noEncontrados = 0;
  const diferencias: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const codigo = String(row['CODIGO'] || row['COD'] || '').trim().toUpperCase();
    const excelLat = parseCoord(row['LAT'] || row['LATITUD']);
    const excelLon = parseCoord(row['LON'] || row['LONGITUD']);

    const dbPanel = dbMap.get(codigo);

    if (!dbPanel) {
      noEncontrados++;
      diferencias.push({ fila: i + 1, codigo, motivo: 'No encontrado en BD' });
      continue;
    }

    // Comparamos igualdad numérica con tolerancia infinitesimal de punto flotante de JS (1e-9)
    const diffLat = Math.abs(dbPanel.latitud - excelLat);
    const diffLon = Math.abs(dbPanel.longitud - excelLon);

    if (diffLat < 1e-7 && diffLon < 1e-7) {
      coincidenciasExactas++;
    } else {
      diferencias.push({
        fila: i + 1,
        codigo,
        excelLat,
        dbLat: dbPanel.latitud,
        excelLon,
        dbLon: dbPanel.longitud,
        diffLat,
        diffLon,
      });
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  📋 RESULTADO DE LA AUDITORÍA');
  console.log('═'.repeat(60));
  console.log(`  Total paneles en Excel:        ${rows.length}`);
  console.log(`  Coincidencias exactas en BD:   ${coincidenciasExactas}`);
  console.log(`  Paneles no encontrados:        ${noEncontrados}`);
  console.log(`  Diferencias de coordenadas:    ${diferencias.length}`);
  console.log('═'.repeat(60));

  // Mostrar muestra de 5 paneles con decimales exactos
  console.log('\n🔎 Muestra de verificación (primeros 5 paneles):');
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    const cod = String(row['CODIGO']).trim().toUpperCase();
    const p = dbMap.get(cod)!;
    console.log(`  [${cod}] Excel: (${row['LAT']}, ${row['LON']})  -->  BD: (${p.latitud}, ${p.longitud})`);
  }

  if (diferencias.length === 0 && noEncontrados === 0) {
    console.log('\n🎉 ¡VERIFICACIÓN EXITOSA! 100% de los paneles coinciden exactamente con el Excel.\n');
  } else {
    console.log('\n⚠️ Se encontraron discrepancias:', diferencias);
  }
}

verificar();

