# Plan de Arquitectura — Plataforma de Paneles de Lima

Para garantizar que el sistema sea de **nivel profesional, top y extremadamente robusto**, utilizaremos una arquitectura **Moderna Serverless (BaaS)**. Es el mismo estándar que usan hoy en día las startups más grandes para escalar de 0 a millones de usuarios sin necesidad de tener un "backend monolítico" de la vieja escuela.

---

## 1. La Base de Datos (Fase 1 - Completada estructuralmente)
- **Carpeta:** `database/` (Donde están tus scripts `.sql`).
- **Tecnología:** PostgreSQL 15 + PostGIS (alojada en Supabase).
- **Por qué:** PostgreSQL es el estándar de oro corporativo. PostGIS es el motor de mapas más avanzado del mundo. Supabase te da la escala de Amazon AWS (nube real) con una capa de seguridad (RLS) brutal.
- **Estado:** Estructura lista ✅. Faltan los datos masivos reales.

## 2. El Frontend (Fase 2 - En Progreso)
- **Carpeta:** `src/` (Todo lo que es React, Componentes, Store).
- **Tecnología:** Next.js 14 (App Router) + React + TailwindCSS + MapLibre GL + Zustand.
- **Por qué:** 
  - **Next.js:** Es el framework top #1.
  - **MapLibre:** Porque los mapas normales (Google Maps/Leaflet) se traban con miles de pines. MapLibre usa WebGL (tarjeta gráfica) para mover 10,000 pines a 60 fps sin sudar.
  - **Zustand:** Manejo de estados global, más rápido y moderno que Redux.

## 3. El Backend (API & Lógica de Servidor)
¿Tenemos Backend? **Sí, tenemos dos niveles de Backend:**

1. **Backend Automático (PostgREST):** Supabase automáticamente lee tu base de datos y crea un API súper rápida y segura. Cuando el Frontend quiere paneles, se los pide directo a este API. Es lo que ya estamos usando. No hay que programar miles de rutas CRUD aburridas a mano.
2. **Backend Personalizado (Serverless Functions):** Para lógicas complejas de la municipalidad (ej: procesar excels gigantes, emitir PDFs, enviar alertas de vencimiento por correo), usaremos el backend integrado de Next.js.
   - **Carpeta:** `src/app/api/` (Aún no la creamos porque no hemos necesitado lógica pesada, todo lo hace Postgres por ahora).
   - **Por qué:** No necesitas pagar un servidor separado (como Node/Express, PHP o Django) encendido 24/7. Las funciones Serverless (Next.js) solo cobran cuando se ejecutan (y tienen un plan gratuito gigante). Todo en TypeScript, el mismo lenguaje del front.

## 4. Scripts de Importación (Fase 3 - Siguiente)
- **Carpeta:** `scripts/`
- **Tecnología:** Node.js + TypeScript.
- **Por qué:** Para procesar el Excel masivo de la municipalidad, limpiarlo, validar errores y mandarlo a la base de datos de manera segura y controlada (en lotes), sin saturar el sistema.

---

### Lo que sigue

Para mantener el orden, **¡ya he borrado los datos estáticos (`mockPanels.ts`)!** De ahora en adelante, nuestro código solo hablará con la base de datos real.

**Sobre los errores que te salieron en la terminal:**
1. **El error de `@supabase/auth-js`:** A veces pasa por cachés en las dependencias. Ya tiré el comando para forzar su instalación y que deje de molestar.
2. **El error `{}` (objeto vacío) de Supabase:** Esto pasa **estrictamente** porque la aplicación no encontró tus claves de conexión.

**Tu turno:**
Para que deje de salir error, asegúrate de que el archivo `.env.local` en la raíz de tu proyecto (`d:\ProyectoMapsHoarding\.env.local`) esté creado **y tenga tus claves reales** adentro, así:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[tu-codigo].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...[tu-clave-anon]...
```
*(Y recuerda apagar y prender el `npm run dev` para que las lea).*
