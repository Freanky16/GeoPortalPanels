# Base de Datos — Plataforma de Paneles Publicitarios de Lima

Tecnología: **Supabase** (PostgreSQL 15 + PostGIS + RLS)

---

## Cómo ejecutar los archivos SQL

Todos los archivos deben ejecutarse en el **SQL Editor de Supabase** en el orden indicado.

### Pasos

1. Entra a [supabase.com](https://supabase.com) → tu proyecto
2. En el menú lateral: **SQL Editor**
3. Haz clic en **New query**
4. Pega el contenido del archivo y haz clic en **Run**
5. Espera a que diga "Success" antes de pasar al siguiente

### Orden de ejecución

| # | Archivo | ¿Qué hace? | Tiempo est. |
|---|---|---|---|
| 01 | `01_extensions.sql` | Activa PostGIS, unaccent, pg_trgm | < 10 s |
| 02 | `02_catalogos.sql` | Crea las tablas de catálogos + función de normalización | < 10 s |
| 03 | `03_contratos.sql` | Crea la tabla de contratos | < 5 s |
| 04 | `04_paneles.sql` | Crea la tabla central de paneles + triggers | < 10 s |
| 05 | `05_apoyo.sql` | Perfiles de usuario, auditoría, importaciones, staging | < 10 s |
| 06 | `06_vistas.sql` | Las vistas que lee el frontend | < 10 s |
| 07 | `07_indices.sql` | Índices de rendimiento | < 15 s |
| 08 | `08_rls.sql` | Seguridad (Row Level Security) | < 15 s |
| 09 | `09_seed_catalogos.sql` | Carga los 43 distritos, 34 empresas y todos los catálogos | < 10 s |
| 10 | `10_seed_datos_reales.sql` | 10 paneles reales de prueba + verificación | < 10 s |

> ⚠️ **Si ves un error** en un archivo, NO continúes al siguiente. Copia el mensaje de error y consúltalo antes de seguir.

---

## Estructura de la base de datos

```
┌──────────────────────────────────────────────────────────┐
│                      CATÁLOGOS                           │
│  distritos  empresas  tipos_via  espacios_publicitarios  │
│  tipos_epe  caracteristicas_tecnicas  materiales          │
│  tipos_contrato                                          │
└─────────────────────┬────────────────────────────────────┘
                      │  (FK)
            ┌─────────▼─────────┐
            │     contratos     │
            └─────────┬─────────┘
                      │  (FK)
            ┌─────────▼─────────┐
            │      paneles      │  ← Tabla central
            └─────────┬─────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
     auditoria  importaciones  stg_paneles_import
                                (staging para Excel)

VISTAS (lo que lee el frontend):
  v_paneles_detalle    → gestores (autenticados)
  v_paneles_publicos   → público (sin login)
  v_catalogos_activos  → todos (para los filtros del mapa)
```

---

## Campos obligatorios en un panel

Solo 4:
- `codigo` — código oficial de la municipalidad (ej: `"1_NAP"`)
- `latitud` — coordenada WGS84
- `longitud` — coordenada WGS84
- `distrito_id` — FK al catálogo de distritos

Todo lo demás puede estar vacío mientras el equipo completa los datos.

---

## Cómo agregar un usuario gestor

1. En Supabase → **Authentication** → **Users** → **Invite user**
2. Ingresa el correo del gestor y envía la invitación
3. El trigger `on_auth_user_created` creará automáticamente su perfil con `rol = 'gestor'`
4. Para hacer a alguien superadmin, ejecuta en SQL Editor:
   ```sql
   UPDATE perfiles SET rol = 'superadmin' WHERE email = 'correo@ejemplo.com';
   ```

---

## Cómo desactivar un usuario (sin borrar su cuenta)

```sql
UPDATE perfiles SET activo = FALSE WHERE email = 'correo@ejemplo.com';
```

Esto niega el acceso inmediatamente. Sus datos no se pierden.

---

## Variables de entorno necesarias en el frontend

Crear el archivo `d:/ProyectoMapsHoarding/.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[tu-clave-anon-publica]
```

Donde encontrarlas: Supabase → tu proyecto → **Settings** → **API**

> ❌ La `service_role key` NUNCA va en `.env.local`. Solo en scripts de importación locales que nunca se suben a git.

---

## Cómo importar paneles desde Excel

*(Pendiente: el script de importación se crea en la siguiente fase)*

El script estará en `scripts/import/import_paneles.ts` y se ejecutará así:

```bash
# Simulación (muestra el informe sin guardar nada):
node scripts/import/import_paneles.ts --file paneles_lote_001.xlsx --dry-run

# Importar las primeras 100 filas:
node scripts/import/import_paneles.ts --file paneles_lote_001.xlsx --from 1 --to 100
```

---

## Plan gratuito de Supabase — límites reales

| Recurso | Límite | Situación actual |
|---|---|---|
| Almacenamiento BD | 500 MB | ~5 MB con 1,249 paneles ✅ |
| Ancho de banda | 5 GB/mes | OK para portal municipal pequeño ✅ |
| Pausa por inactividad | **7 días** | ⚠️ Si nadie visita, el proyecto se pausa |
| Backups automáticos | ❌ No incluidos | Exportar manualmente desde dashboard |
| Usuarios auth | Ilimitados | ✅ |

**Para evitar pausas:** el ingeniero u otro usuario debe acceder al menos 1 vez por semana. En producción real, considerar el plan Pro ($25/mes).

**Backups manuales:** Supabase dashboard → tu proyecto → **Settings** → **Database** → **Backups** → **Download**.

---

## Dudas sobre empresas (pendiente de resolución)

Consultar con el ingeniero antes de limpiar:

1. ¿Son la misma empresa?
   - `PROMOTORA TURISTICA E INMOBILIARIA TRANSOCEANICA S.A.C.` (fila 19, sin tilde)
   - `PROMOTORA TURÍSTICA E INMOBILIARIA TRANSOCEÁNICA S.A.C.` (fila 32, con tilde)

2. ¿Son la misma empresa?
   - `INPUT` (fila 34)
   - `INPUT S.A.C.` (fila 23 — llamada `INPUE S.A.C.` en otra lista, verificar)

---

*Última actualización: 2026-10-06*
