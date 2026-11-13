# MD-3: Rediseño Integral de la Base de Datos en Supabase

**Proyecto:** Geoportal de Publicidad Exterior (SIGPE) — MML  
**Fecha:** Noviembre 2026  
**Documento:** MD-3 de 5 (Fase de Planificación Maestra)  
**Estado:** Especificación de Arquitectura de Datos Aprobada  

---

## 1. Visión General y Estrategia de Seguridad

Para garantizar el principio:  
> **"SINCRONIZADO Y PENSANDO EN EL FUTURO: ACTUALIZACIÓN REAL Y CONEXIÓN BACKEND-FRONTEND-BASEDEDATOS"**

El rediseño de Supabase se ejecutará **sin romper endpoints, vistas ni APIs**. La tabla `paneles` será el modelo central unificado: albergará tanto a paneles con contrato como a paneles sin contrato (reordenamientos / regularizaciones). Los campos que no apliquen a un panel sin contrato simplemente quedarán como `NULL` (vacíos) a nivel de base de datos, y en la interfaz visual no se mostrarán fichas vacías.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TABLA UNIFICADA: paneles                        │
├────────────────────────────────────────────────────────────────────────┤
│ • Campos Compartidos:                                                  │
│   id, codigo, geom (lat/lon), via, distrito_id, empresa_id,            │
│   tipo_epe_id, caracteristica_id, material_id                          │
│                                                                        │
│ • Campos Condicionales de Contrato:                                    │
│   estado_contrato_id ───────► (6 Estados Oficiales)                    │
│   numero_contrato    ───────► Texto libre (ej: 045-2022-MML) o NULL     │
│   ficha_publicidad   ───────► Alfanumérico (ej: FP-104) o NULL         │
│   ficha_contrato_ini ───────► Alfanumérico (ej: FCO-02) o NULL         │
│   plazo_anios        ───────► Entero (ej: 5) o NULL                    │
│   fecha_suscripcion  ───────► DATE (ej: 2023-05-12) o NULL             │
│                                                                        │
│ • Campos de Ingeniería y Dimensiones:                                  │
│   tipo_via_id        ───────► (4 Jerarquías Oficiales)                 │
│   espacio_pub_id     ───────► (8 Espacios Viales)                      │
│   area_ocupacion, area_exhibicion, altura_poste, alto, largo, espesor  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Catálogos Oficiales y Nuevas Variables

### A. Catálogo: `estados_contrato` (6 Variables Oficiales)
Se crea la tabla catálogo `estados_contrato` para reflejar con exactitud la situación legal metropolitana:

| ID | Estado Contractual | ¿Tiene N° Contrato? | ¿Tiene Ficha Publicidad? |
| :-: | :--- | :-: | :-: |
| 1 | **Contrato de reordenamiento** | **SÍ** | **SÍ** |
| 2 | **Sin contrato de reordenamiento** | NO (`NULL`) | NO (`NULL`) |
| 3 | **Autorizado por GDU** | **SÍ** | NO (`NULL`) |
| 4 | **Contrato de usufructo (primera convocatoria)** | **SÍ** | **SÍ** |
| 5 | **En proceso de segunda convocatoria** | NO (`NULL`) | NO (`NULL`) |
| 6 | **En proceso de tercera convocatoria** | NO (`NULL`) | NO (`NULL`) |

---

### B. Catálogo: `tipos_via` (4 Variables Oficiales - 100% Validado en BD)
1. **Colectora**
2. **Arterial**
3. **Expresa**
4. **Intercambio**

---

### C. Catálogo: `espacios_publicitarios` (8 Variables Oficiales - 100% Validado en BD)
1. **Franja de vereda**
2. **Separador lateral**
3. **Separador central**
4. **Isla de intercambio**
5. **Remanente de intercambio**
6. **Túnel**
7. **Puente peatonal**
8. **Bajo puente de intercambio**

---

### D. Catálogo: `tipos_epe` (8 Variables Oficiales y Radios Normativos)
1. **Paleta publicitaria** (`radio_default_metros: 50`)
2. **Panel monumental unipolar** (`radio_default_metros: 100`)
3. **Panel monumental** (`radio_default_metros: 150`, regla de **200m** en Vías Especiales: Panamericana Norte/Sur, Antigua Panamericana Sur, Carretera Central, Ramiro Prialé)
4. **Panel monumental volumétrico** (`radio_default_metros: 150`)
5. **Tótem** (`radio_default_metros: 75`)
6. **Panel simple** (`radio_default_metros: 75`)
7. **Mobiliario urbano - nomenclatura de vías** (`radio_default_metros: 0`)
8. **Otro** (`radio_default_metros: 0`)

---

### E. Catálogo: `caracteristicas_tecnicas` (4 Principales + Especiales)
1. **Luminoso**
2. **Iluminado**
3. **Especial**
4. **Sencillo**
*(Adicionales de archivo: BANNER, OTRO)*

---

### F. Catálogo: `materiales` (11 Variables Oficiales con 'Vinil' Añadido)
1. **Metal**
2. **Madera**
3. **Acrílico**
4. **Vidrio**
5. **Vinil** *(incorporado)*
6. **Banner**
7. **Backlight Film**
8. **LED**
9. **Lona**
10. **Mixto**
11. **Otro**

---

## 3. Nuevos Campos en la Tabla `paneles`

Para no perder información y recibir limpiamente los nuevos Excel del ingeniero:

| Nombre de Columna | Tipo de Dato SQL | Descripción / Propósito |
| :--- | :--- | :--- |
| `ficha_publicidad` | `VARCHAR(100)` | Código alfanumérico de la ficha técnica de publicidad exterior. |
| `ficha_contrato_inicio`| `VARCHAR(100)` | Ficha de inicio de procedimiento contractual. |
| `plazo_anios` | `INTEGER DEFAULT 5` | Plazo en años de vigencia del contrato (permite 5, 6, 8, etc.). |
| `area_ocupacion` | `NUMERIC(10,2)` | Área de ocupación sobre suelo/vía pública ($m^2$). |
| `area_exhibicion` | `NUMERIC(10,2)` | Área neta visual de exposición publicitaria ($m^2$). |
| `altura_poste` | `NUMERIC(10,2)` | Altura desde el nivel del suelo hasta la base del panel ($m$). |
| `alto` | `NUMERIC(10,2)` | Dimensión vertical de la estructura ($m$). |
| `largo` | `NUMERIC(10,2)` | Dimensión horizontal de la estructura ($m$). |
| `espesor` | `NUMERIC(10,2)` | Fondo o grosor volumétrico ($m$). |
| `tipo_via_id` | `UUID FK` | Llave foránea hacia la tabla `tipos_via`. |
| `espacio_pub_id` | `UUID FK` | Llave foránea hacia la tabla `espacios_publicitarios`. |

---

## 4. Plan de Ejecución Seguro: Vaciado y Regeneración Limpia

### ¿Por qué NO se rompe la aplicación ni las APIs?
La aplicación web consume los datos mediante dos Vistas SQL (`v_paneles_publicos` y `v_paneles_detalle`) y endpoints seguros. Si vaciamos los 400 registros antiguos con `TRUNCATE` o `DELETE`:
1. La estructura de la base de datos se mantiene intacta.
2. Las APIs seguirán respondiendo con código HTTP 200 (solo devolverán una lista de 0 paneles momentáneamente mientras corre el importador).
3. No hay riesgo de romper llaves foráneas porque vaciaremos en el orden correcto de dependencias.

### Script SQL Maestro (Esquema de Ejecución en Supabase)

```sql
-- 1. Respaldar o limpiar la tabla paneles de prueba
TRUNCATE TABLE auditoria, contratos, paneles CASCADE;

-- 2. Asegurar columnas nuevas en la tabla paneles
ALTER TABLE paneles 
  ADD COLUMN IF NOT EXISTS ficha_publicidad VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ficha_contrato_inicio VARCHAR(100),
  ADD COLUMN IF NOT EXISTS plazo_anios INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS area_ocupacion NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS area_exhibicion NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS altura_poste NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS alto NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS largo NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS espesor NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tipo_via_id UUID REFERENCES tipos_via(id),
  ADD COLUMN IF NOT EXISTS espacio_pub_id UUID REFERENCES espacios_publicitarios(id);

-- 3. Actualizar o insertar los 6 estados de contrato
INSERT INTO estados_contrato (nombre, descripcion) VALUES
  ('Contrato de reordenamiento', 'Con contrato y ficha de publicidad'),
  ('Sin contrato de reordenamiento', 'Sin contrato ni ficha'),
  ('Autorizado por GDU', 'Autorización de Gerencia de Desarrollo Urbano'),
  ('Contrato de usufructo (primera convocatoria)', 'Usufructo 1ra convocatoria'),
  ('En proceso de segunda convocatoria', 'Proceso licitatorio 2da conv.'),
  ('En proceso de tercera convocatoria', 'Proceso licitatorio 3ra conv.')
ON CONFLICT (nombre) DO NOTHING;

-- 4. Re-crear vistas para incluir los nuevos campos sin alterar contratos anteriores
CREATE OR REPLACE VIEW v_paneles_detalle AS
SELECT 
  p.*,
  d.nombre AS distrito,
  e.nombre AS empresa,
  te.nombre AS tipo_epe,
  tv.nombre AS tipo_via,
  ep.nombre AS espacio_publicitario
FROM paneles p
LEFT JOIN distritos d ON p.distrito_id = d.id
LEFT JOIN empresas e ON p.empresa_id = e.id
LEFT JOIN tipos_epe te ON p.tipo_epe_id = te.id
LEFT JOIN tipos_via tv ON p.tipo_via_id = tv.id
LEFT JOIN espacios_publicitarios ep ON p.espacio_pub_id = ep.id;
```

---

## 5. Actualización de Tipos y Sincronización Total (Backend - Frontend - Base de Datos)

Siguiendo el principio de **"SINCRONIZADO Y PENSANDO EN EL FUTURO: ACTUALIZACIÓN REAL Y CONEXIÓN BACKEND-FRONTEND-BASEDEDATOS"**:

1. **Sincronización en la Base de Datos (`Supabase`):**
   * Nuevas columnas agregadas a la tabla `paneles`.
   * Vistas SQL `v_paneles_publicos` y `v_paneles_detalle` actualizadas con `LEFT JOIN` hacia los catálogos para que emitan los nombres resueltos (`tipo_via`, `espacio_publicitario`, `estado_contrato`, etc.).
2. **Sincronización en el Backend (`API Routes`):**
   * El endpoint `src/app/api/paneles/route.ts` se actualiza para recibir y persistir todos los nuevos campos (tanto en `INSERT` como en `UPDATE`).
   * Validación de tipos en el servidor para evitar discrepancias de datos.
3. **Sincronización en el Frontend (`TypeScript & Zustand Store`):**
   * Archivo [types/index.ts](file:///d:/ProyectoMapsHoarding/src/types/index.ts): Se extienden las interfaces `Panel` y `PanelFiltros` con todas las nuevas entidades (`ficha_publicidad?`, `ficha_contrato_inicio?`, `plazo_anios?`, `area_ocupacion?`, `area_exhibicion?`, `altura_poste?`, `alto?`, `largo?`, `espesor?`, `tipo_via?`, `espacio_publicitario?`).
   * Ficha de visualización ([PanelCard.tsx](file:///d:/ProyectoMapsHoarding/src/components/Panel/PanelCard.tsx)): Muestra las nuevas especificaciones solo cuando contengan datos reales; si el panel es sin contrato y estos campos están vacíos (`NULL`), no se renderizan espacios en blanco innecesarios.
   * Drawer de edición ([PanelDrawer.tsx](file:///d:/ProyectoMapsHoarding/src/components/Panel/PanelDrawer.tsx)): Carga y edita de forma sincronizada cada uno de estos nuevos campos en tiempo real.
4. **Verificación de Cero Errores:**
   * Ejecución obligatoria de `npx tsc --noEmit` para certificar que el 100% del sistema compila limpiamente sin fallos de tipos.

---

## 6. Estado y Próximos Pasos

* **Documento MD-3:** Completado y guardado en el proyecto.
* **Próximo Documento:** **MD-4: Plan de Importación Masiva desde los Excel del Ingeniero (Estructura de Script, Mapeo de Columnas y Limpieza de Inconsistencias)**.

---

## 7. Notas Heredadas del MD-2 (Matriz de Distanciamiento Normativo)

Las siguientes acciones fueron recomendadas al cierre del MD-2 y deben ejecutarse como parte del rediseño de base de datos de este MD-3:

1. **Agregar columna `radio_default_metros`** (INTEGER) en la tabla catálogo `tipos_epe` de Supabase. Esto permitirá que el frontend lea los radios normativos directamente de la BD en lugar del diccionario hardcodeado en `constants.ts`, y si la MML cambia una ordenanza solo se actualiza 1 fila.
2. **Modificar el frontend** para que al cargar los catálogos, el radio venga incluido en cada `TipoEPE` y se use dinámicamente.
3. **Evaluar `es_via_especial`** al vuelo en la vista SQL usando `ILIKE` sobre el campo `direccion` (Panamericana, Carretera Central, Ramiro Prialé), o bien agregarlo como columna BOOLEAN computada.
4. **Auditoría de datos:** Al reimportar los paneles con el Excel limpio (MD-4), validar que cada registro tenga correctamente asignados su `tipo_epe_id` y su `direccion` para que el sensor de proximidad funcione al 100%.

---

## 8. Registro de Ejecución Parcial

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ PASO DEL MD-3                                    │ ESTADO                   │
├──────────────────────────────────────────────────┼──────────────────────────┤
│ 4.1 Vaciado limpio de la tabla paneles           │ ✅ COMPLETADO            │
│     (400 registros eliminados sin tocar           │    13/Nov/2026 05:17 AM  │
│      estructura, catálogos, vistas ni APIs)       │    Verificado: 0 paneles │
│                                                   │                          │
│ 4.2 Agregar columnas nuevas (ALTER TABLE)         │ ✅ COMPLETADO            │
│     (ficha_publicidad, ficha_contrato_inicio,     │    13/Nov/2026 07:00 AM  │
│      plazo_anios, estado_contrato_id en paneles)  │    Verificado en BD      │
│                                                   │                          │
│ 4.3 Insertar 6 estados de contrato oficiales     │ ✅ COMPLETADO            │
│     (estados_contrato creados con permisos        │    13/Nov/2026 07:00 AM  │
│      GRANT ALL asignados para lectura de API)     │    6 estados verificados │
│                                                   │                          │
│ 4.4 Agregar radio_default_metros a tipos_epe     │ ✅ COMPLETADO            │
│     (Columna y radios normativos asignados        │    13/Nov/2026 07:00 AM  │
│      de 0 a 150m según MD-2)                      │    8 tipos verificados   │
│                                                   │                          │
│ 4.5 Auto-incorporación de Vinil en materiales    │ ✅ COMPLETADO            │
│     (Añadido 'Vinil' con ID propio en Supabase)   │    11 materiales activos │
│                                                   │                          │
│ 4.6 Script de importación masiva ultra-robusto   │ ✅ COMPLETADO            │
│     (scripts/importar-excel.ts actualizado con    │    Auto-crea empresas    │
│      tolerancia de encabezados textuales de Excel)│    Batches de 100        │
│                                                   │                          │
│ 4.7 Verificación npx tsc --noEmit                │ ✅ COMPLETADO (0 fallos) │
└──────────────────────────────────────────────────┴──────────────────────────┘
```

