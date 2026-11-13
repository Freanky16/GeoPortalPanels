# MD-4: Plan de Ingesta Masiva y Sincronización desde Excel

**Proyecto:** Geoportal de Publicidad Exterior (SIGPE) — MML  
**Fecha:** Noviembre 2026  
**Documento:** MD-4 de 5 (Fase de Planificación Maestra)  
**Estado:** Especificación de Pipeline de Ingesta Aprobada  

---

## 1. Visión General del Pipeline de Ingesta

El proceso de carga masiva reemplazará la totalidad de los datos de prueba anteriores con la información depurada y clasificada entregada por el ingeniero.

Para evitar la complejidad de manejar scripts múltiples o fragmentados, adoptamos una **estrategia de Plantilla Maestra Unificada (`plantilla_estandar_paneles.xlsx`)**. Esta plantilla concentra tanto los registros que cuentan con contrato como aquellos en proceso de regularización o sin contrato, permitiendo una ejecución fluida, atómica y trazable hacia Supabase.

> [!IMPORTANT]
> **Recordatorio Operativo de Ejecución Segura:**
> Al llegar a esta fase de ejecución, no solo se corregirá y ampliará la cantidad de columnas de la plantilla Excel estándar:
> 1. El agente de IA accederá directamente a Supabase utilizando la llave de servicio institucional autorizada.
> 2. Se ejecutará el vaciado limpio (`TRUNCATE CASCADE`) de los 400 paneles de prueba existentes, dejando la base de datos libre y limpia sin comprometer las restricciones estructurales.
> 3. Se verificará que las nuevas entidades y catálogos en Supabase estén sincronizados antes de ejecutar la ingesta de los nuevos paneles para garantizar cero fallos de llaves foráneas.

---

## 1.1 Relación de Dependencias Críticas entre Campos

Para que el Excel y el script operen en perfecta coherencia, se define formalmente qué campos dependen estrictamente del **Estado Contractual**:

```
[ESTADO CONTRACTUAL (Situación Legal)]
  │
  ├── 1. Contrato de reordenamiento ────────► TIENE N° Contrato  | TIENE Ficha Publicidad
  ├── 2. Sin contrato de reordenamiento ────► SIN N° Contrato    | SIN Ficha Publicidad
  ├── 3. Autorizado por GDU ────────────────► TIENE N° Contrato  | SIN Ficha Publicidad
  ├── 4. Contrato de usufructo (1ra conv.) ─► TIENE N° Contrato  | TIENE Ficha Publicidad
  ├── 5. En proceso de 2da convocatoria ────► SIN N° Contrato    | SIN Ficha Publicidad
  └── 6. En proceso de 3ra convocatoria ────► SIN N° Contrato    | SIN Ficha Publicidad
```

* Si un registro es *Sin contrato de reordenamiento* o *En proceso de convocatoria*, en el Excel las celdas de `numero_contrato` y `ficha_publicidad` van vacías (`NULL` en BD).
* Si un registro es *Contrato de reordenamiento* o *Usufructo*, ambas columnas deben contener su código alfanumérico respectivo.
* Si es *Autorizado por GDU*, lleva su número correlativo/resolutivo de contrato, pero sin ficha de publicidad.

---

## 2. Solución a la Duda Central: Estados de Contrato vs. Vigencia Temporal

Para resolver de manera profesional la clasificación que mencionaste:

```
┌────────────────────────────────────────────────────────────────────────┐
│               DOS DIMENSIONES INDEPENDIENTES Y COMPLEMENTARIAS        │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. SITUACIÓN JURÍDICA             │ 2. VIGENCIA TEMPORAL               │
│    (Campo: `estado_contrato`)     │    (Calculado Automáticamente)     │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Contrato de reordenamiento      │ 🟢 VIGENTE                         │
│ • Sin contrato de reordenamiento  │    (Fecha actual < Fecha fin)      │
│ • Autorizado por GDU              │                                    │
│ • Contrato de usufructo (1ra)     │ 🟡 POR VENCER                      │
│ • En proceso de 2da convocatoria  │    (Faltan menos de 60 días)       │
│ • En proceso de 3ra convocatoria  │                                    │
│                                   │ 🔴 VENCIDO                         │
│                                   │    (Fecha actual > Fecha fin)      │
│                                   │                                    │
│                                   │ ⚪ SIN DATO                        │
│                                   │    (Sin fecha de suscripción)      │
└───────────────────────────────────┴────────────────────────────────────┘
```

### ¿Cómo funciona la arquitectura limpia?
1. **No creamos enredos de enums:** El usuario o el Excel asigna la **Situación Jurídica** oficial (uno de los 6 estados de la MML).
2. **Cálculo de Vigencia en Tiempo Real:** La base de datos o el frontend compara:
   $$\text{Fecha Fin} = \text{Fecha Suscripción} + (\text{Plazo Años} \times 365\text{ días})$$
   * Si no hay fecha de suscripción (típico en paneles *Sin contrato* o *En proceso*), la vigencia temporal resulta automáticamente en **"Sin Dato"** sin necesidad de llenar nada a mano.
   * Si tiene fecha, el sistema calcula de inmediato si está **Vigente**, **Por Vencer** o **Vencido**.

---

## 3. Tolerancia y Limpieza Automática de Coordenadas

El importador incorporará una capa de **sanitización automática de cadenas** para que nunca se caiga la importación por errores humanos de tipeo en el Excel:

```typescript
// Sanitizador Inteligente de Coordenadas:
function limpiarCoordenada(valor: string | number): number {
  if (typeof valor === 'number') return valor;
  // Reemplaza automáticamente comas por puntos si algún registro viene con formato regional
  const normalizado = valor.toString().trim().replace(',', '.');
  const num = parseFloat(normalizado);
  if (isNaN(num)) {
    throw new Error(`Coordenada inválida detectada: ${valor}`);
  }
  return num;
}
```

* Si una coordenada viene con coma (`-12,0456`), el script la convierte silenciosamente a punto (`-12.0456`) y la sube perfectamente.
* Si el campo está completamente vacío o corrupto, registra una advertencia en la consola indicando la fila exacta y continúa con los demás paneles sin detenerse.

---

## 4. Mapeo Columna por Columna: Excel Maestro ➔ Supabase

| N° | Columna en Plantilla Excel | Campo Destino en Supabase | Tipo en BD | ¿Obligatorio? | Comportamiento si está Vacío |
| :-: | :--- | :--- | :--- | :---: | :--- |
| 1 | `codigo` | `codigo` | `TEXT` | **SÍ** | Rechaza fila (código requerido) |
| 2 | `latitud` | `latitud` (y `geom`) | `FLOAT8` | **SÍ** | Rechaza fila |
| 3 | `longitud` | `longitud` (y `geom`) | `FLOAT8` | **SÍ** | Rechaza fila |
| 4 | `direccion` | `direccion_referencial` | `TEXT` | **SÍ** | Guarda vacío o "Sin dirección" |
| 5 | `distrito` | `distrito_id` | `UUID FK` | **SÍ** | Busca en tabla `distritos` |
| 6 | `empresa` | `empresa_id` | `UUID FK` | **SÍ** | Busca o crea en `empresas` |
| 7 | `tipo_epe` | `tipo_epe_id` | `UUID FK` | **SÍ** | Asigna radio según MD-2 |
| 8 | `tipo_via` | `tipo_via_id` | `UUID FK` | No | Asigna `NULL` |
| 9 | `espacio_publicitario`| `espacio_pub_id` | `UUID FK` | No | Asigna `NULL` |
| 10 | `caracteristica` | `caracteristica_id` | `UUID FK` | No | Asigna "Sin dato" |
| 11 | `material` | `material_id` | `UUID FK` | No | Asigna "Sin dato" |
| 12 | `estado_contractual`| `estado_contrato_id` | `UUID FK` | **SÍ** | Asocia a los 6 estados oficiales |
| 13 | `numero_contrato` | `numero_contrato` | `TEXT` | No | `NULL` (paneles sin contrato) |
| 14 | `ficha_publicidad` | `ficha_publicidad` | `TEXT` | No | `NULL` |
| 15 | `ficha_contrato_inicio`| `ficha_contrato_inicio` | `TEXT` | No | `NULL` |
| 16 | `fecha_suscripcion`| `fecha_suscripcion` | `DATE` | No | `NULL` (vigencia: "Sin Dato") |
| 17 | `plazo_anios` | `plazo_anios` | `INT` | No | Por defecto `5` |
| 18 | `area_ocupacion` | `area_ocupacion` | `NUMERIC` | No | `NULL` |
| 19 | `area_exhibicion` | `area_exhibicion` | `NUMERIC` | No | `NULL` |
| 20 | `altura_poste` | `altura_poste` | `NUMERIC` | No | `NULL` |
| 21 | `alto` | `alto` | `NUMERIC` | No | `NULL` |
| 22 | `largo` | `largo` | `NUMERIC` | No | `NULL` |
| 23 | `espesor` | `espesor` | `NUMERIC` | No | `NULL` |

---

## 5. Homologación de Nombres de Empresas (Aclaración a tu Pregunta)

Cuando pregunté sobre *"nombres unificados o variaciones"*, me refería a los pequeños errores de tipeo que venían en el Excel original (por ejemplo: filas con `PROBIEN` y otras con `PROBIAN`, o `ILLUMINATY` vs `ILUMINITY`).

* **Decisión Confirmada:** Tal como acordamos, **no tocaremos ni forzaremos los nombres**. Si el Excel dice `PROBIAN`, se registra como `PROBIAN`. Si dice `PROBIEN`, se registra como `PROBIEN`. El importador creará automáticamente en la tabla `empresas` cualquier nombre nuevo que aparezca en el archivo sin modificarlo.

---

## 6. Procedimiento Seguro de Ejecución del Script

Para no arriesgar la estabilidad de la plataforma, el script `scripts/importar-excel.ts` se estructurará con dos modalidades:

```bash
# Modalidad 1: Simulación preventiva (No toca la base de datos)
npx tsx scripts/importar-excel.ts --dry-run
# Resultado: Muestra cuántas filas leyó, cuántas son con contrato, cuántas sin contrato y si hay algún error de formato.

# Modalidad 2: Carga Real Definitiva
npx tsx scripts/importar-excel.ts --execute
# Resultado: Vacía las tablas previas e inserta el 100% de los paneles en lotes atómicos (batches de 50 registros) con reporte final de éxito.
```

---

## 7. Estado y Próximos Pasos

* **Documento MD-4:** Redactado, estructurado y guardado en disco local.
* **Próximo Documento:** **MD-5: Funcionalidades Geoespaciales Avanzadas (Búsqueda Libre por Coordenada Estilo Google Earth y Capas de Zonificación Oficial MML / IMP)**.

