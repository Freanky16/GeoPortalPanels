# Guía Paso a Paso: Configuración de Supabase

Esta guía te llevará de la mano para crear tu base de datos en la nube, configurarla y dejarla lista para conectar con el frontend.

---

## PASO 1: Crear la cuenta y el proyecto

1. Ve a [Supabase.com](https://supabase.com/) y haz clic en **"Start your project"** (Empezar tu proyecto).
2. Regístrate con tu correo o cuenta de GitHub (te sugiero usar tu correo principal para que la cuenta quede a tu nombre, como pediste).
3. Una vez dentro del panel (Dashboard), haz clic en **"New Project"**.
4. Te pedirá crear una "Organization" (Organización). Ponle el nombre de tu proyecto o el tuyo.
5. Luego, llena el formulario del nuevo proyecto:
   - **Name:** `Paneles Lima` (o el nombre que prefieras).
   - **Database Password:** Crea una contraseña súper segura. **¡Anótala y guárdala bien!** Supabase no te la volverá a mostrar, y se necesita si alguna vez nos conectamos directo a la base de datos desde una app de escritorio (como DBeaver o pgAdmin).
   - **Region:** Selecciona `US East (N. Virginia)` o `US West (N. California)`. Si hay alguna región en Sudamérica (ej. São Paulo), elige esa, es mejor para la latencia.
   - **Pricing Plan:** Selecciona **Free** (Gratis).
6. Haz clic en **"Create new project"**. 
   > ⏳ *Nota: Supabase tardará unos minutos en configurar los servidores. Ve a tomar un café y espera a que el círculo verde termine de cargar.*

---

## PASO 2: Obtener las claves (Credentials)

Una vez que el proyecto esté listo (verás un panel con métricas verdes), necesitamos las claves para conectar tu frontend:

1. En el menú lateral izquierdo, haz clic en el ícono de engranaje ⚙️ **"Project Settings"**.
2. En el submenú que aparece, haz clic en **"API"**.
3. En la sección **Project URL**, copia la URL (se ve algo como `https://[codigo].supabase.co`).
4. En la sección **Project API keys**, copia la clave larga que dice `anon` y `public`.
5. En tu computadora, ve a la carpeta de tu proyecto (`d:\ProyectoMapsHoarding`) y crea un archivo llamado **exactamente** `.env.local` (con el punto al inicio).
6. Pega esto dentro del archivo y reemplaza los corchetes con tus valores reales:

```env
# URL de tu proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[TU-CODIGO].supabase.co

# Tu clave pública (anon key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...[TU-CLAVE-LARGA]...
```
*(Guarda el archivo y no lo compartas. Tu archivo `.gitignore` ya está configurado por Next.js para ignorar el `.env.local` y no subirlo a GitHub).*

---

## PASO 3: Ejecutar los scripts SQL (La estructura de la BD)

Ahora le daremos la estructura profesional a la base de datos usando los archivos que ya están en la carpeta `database/`.

1. En el menú lateral izquierdo de Supabase, busca y haz clic en **"SQL Editor"** (tiene un ícono de consola/terminal `>_`).
2. Haz clic en **"New Query"** (o en el botón "+").
3. Abre el archivo `database/01_extensions.sql` en tu editor de código, copia **todo el texto** y pégalo en el SQL Editor de Supabase.
4. Haz clic en el botón verde **"Run"** (o presiona `Ctrl + Enter` / `Cmd + Enter`).
5. En la parte inferior derecha, debes ver un mensaje que dice **"Success, no rows returned"**. ¡Perfecto!
6. **Repite este proceso** (borrando el texto anterior y pegando el nuevo, o creando un "New Query" distinto cada vez) para los 10 archivos, **estrictamente en este orden**:
   - `01_extensions.sql`
   - `02_catalogos.sql`
   - `03_contratos.sql`
   - `04_paneles.sql`
   - `05_apoyo.sql`
   - `06_vistas.sql`
   - `07_indices.sql`
   - `08_rls.sql`
   - `09_seed_catalogos.sql` (Este insertará los catálogos)
   - `10_seed_datos_reales.sql` (Este insertará los 10 paneles de prueba)

> ⚠️ Si en algún momento sale un texto en **rojo** (Error), **DETENTE**. No sigas con el siguiente archivo, cópialo y avísame para revisarlo.

---

## PASO 4: ¡Verificación!

Si todo salió bien, vamos a comprobarlo visualmente:

1. En el menú lateral izquierdo de Supabase, haz clic en **"Table Editor"** (ícono de una tabla).
2. Deberías ver todas las tablas creadas (`paneles`, `contratos`, `distritos`, etc.).
3. Si haces clic en la tabla `paneles`, deberías ver las **10 filas** de prueba cargadas.
4. Si cambias la vista en la barra lateral donde dice `schema public` y buscas la sección de vistas, podrás ver `v_paneles_detalle`. Al hacerle clic, deberías ver los 10 paneles ya con todos sus datos cruzados (nombres de distritos en vez de IDs, etc.), listos para que el frontend los consuma.

¡Listo! Cuando hayas llegado a este punto, avísame y pasamos a la fase de conectar tu mapa y tu dashboard directamente a esta base de datos en la nube.
