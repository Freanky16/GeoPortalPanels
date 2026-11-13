# INSTRUCCIONES DE TRASPASO DE CONTEXTO Y METODOLOGÍA DE TRABAJO (PARA EL AGENTE ENTRANTE)

**Proyecto:** SIGPE — Geoportal de Publicidad Exterior (Municipalidad Metropolitana de Lima)  
**Ruta del Repositorio Local:** `d:\ProyectoMapsHoarding`  
**GitHub Remoto:** `https://github.com/Freanky16/GeoPortalPanels.git` (Rama: `main`)  
**Backend:** Supabase (`https://npqcwbpepadhccayqhpi.supabase.co`)  
**Despliegue:** Vercel en producción sincronizado con GitHub  

---

## 1. MISIÓN PRINCIPAL Y REGLAS DE TRABAJO (OBLIGATORIAS)

Hola colega. Estás asumiendo la coordinación y desarrollo del Geoportal de Publicidad Exterior de Lima. Antes de escribir una sola línea de código, **tu primera tarea innegociable es entender el proyecto a profundidad**.

### Reglas Sagradas de Trabajo con el Usuario:
1. **NO HAGAS CÓDIGO AL AZAR:** Primero entiende la estructura, lee este documento y los planes aprobados.
2. **VERIFICACIÓN Y SINCRONIZACIÓN CONTINUA:**
   * Lema del proyecto: *"SINCRONIZADO Y PENSANDO EN EL FUTURO: ACTUALIZACIÓN REAL Y CONEXIÓN BACKEND-FRONTEND-BASEDEDATOS"*.
   * Cada vez que toques código: ejecuta siempre `git status` antes y después.
   * Verifica compilación estricta de TypeScript con `npx tsc --noEmit` (no uses `npm run build` porque si el usuario tiene el dev server abierto en Windows dará error de bloqueo de archivos `.next`).
   * En Windows PowerShell **NUNCA uses `&&`**; usa punto y coma `;`.
   * En CSS solo usamos **CSS Modules**, nada de Tailwind.
3. **LENGUAJE COMERCIAL Y RESPETO AL USUARIO:**
   * El sistema será usado por administradores municipales y empresas de marketing. Cero tecnicismos visibles (nada de "WGS84", ni "precisión ilimitada", ni asteriscos rojos innecesarios, ni emojis estilo WhatsApp).
   * Los datos de empresas con nombres duplicados o ligeros errores del Excel original (ej: PROBIEN vs PROBIAN) **no se borran ni se fuerzan**; se respetan.

---

## 2. ESTADO ACTUAL DEL PROYECTO (QUÉ ESTÁ FUNCIONANDO)

* **Stack:** Next.js 16 (App Router), React 19, TypeScript, Zustand (`usePanelStore.ts`, `useUIStore.ts`), MapLibre GL JS v6, Supabase (PostgreSQL + PostGIS).
* **Fase 1 (Completada):** Geoportal público con 400 paneles, clusterizado dinámico, filtros por distrito, empresa, tipo de publicidad y buscador.
* **Fase 2 (Completada y Subida a Git):** Módulo de **Acceso Técnico** con doble llave (PIN 6 dígitos + Clave institucional) y **Slide-Over Drawer** lateral derecho para registrar y editar paneles en vivo contra Supabase.
* **Fase 3 (Completada y Subida a Git):** Sensor inteligente de proximidad vial con cálculo de distancias Haversine y proyección de círculos de protección en tiempo real sobre el mapa al capturar coordenadas.

---

## 3. PLAN MAESTRO DE 6 DOCUMENTOS `.MD` (APROBADOS EN DISCO)

En la raíz del proyecto (`d:\ProyectoMapsHoarding\`) se encuentran los 6 documentos de especificación técnica consensuados con el usuario:

1. 📄 `MD-1_Ajustes_Visuales_UI_UX.md`: Eliminación de asteriscos rojos y placeholders; curvatura en Drawer; unificación al verde marino/petróleo (`#0D9488`); selectores de distrito/empresa vacíos por defecto; íconos SVG vectoriales.
2. 📄 `MD-2_Matriz_Distanciamiento_Normativo_Sensores.md`: Matriz oficial de radios dada por el ingeniero (Paleta 50m, Unipolar 100m, Monumental 150m, Vía Especial 200m, Tótem 75m, Simple 75m, Mobiliario 0m, Otro 0m). La regla de 200m lee estrictamente el texto del campo `direccion` (ej. Panamericana Norte/Sur, Carretera Central, Ramiro Prialé), sin adivinar por coordenadas.
3. 📄 `MD-3_Rediseno_Base_Datos_Supabase.md`: Estructura unificada de la tabla `paneles` para soportar paneles con y sin contrato. Los 6 estados contractuales oficiales, 4 tipos de vía, 8 espacios publicitarios y dimensiones físicas. Vaciado limpio y seguro (`TRUNCATE CASCADE`) sin romper vistas ni APIs.
4. 📄 `MD-4_Plan_Importacion_Masiva_Excel.md`: Pipeline de 23 columnas con plantilla maestra (`plantilla_estandar_paneles.xlsx`). Dependencias de N° Contrato y Ficha según estado legal. Tolerancia para convertir comas decimales a puntos. Modo `--dry-run`.
5. 📄 `MD-5_Búsqueda_Libre_y_Geocodificación.md`: Búsqueda estilo Google Earth por cualquier coordenada con vuelo `flyTo` suave y chip sutil no invasivo. Geocodificación inversa para sugerir nombre de calle al hacer clic.
6. 📄 `MD-6_Integracion_Capas_MML_ArcGIS.md`: Conexión de servicios WMS / ArcGIS REST públicos y gratuitos del IMP/MML (Plan Metropolitano y Red Vial) como capas extra conmutables sin alterar las capas base actuales.

---

## 4. PRÓXIMO PASO CUANDO EL USUARIO TE HABLE

Tu punto de partida es preguntarle al usuario por cuál de los documentos desea comenzar la ejecución en código (se recomienda iniciar aplicando los ajustes visuales del **MD-1** o la preparación de base de datos del **MD-3**), manteniendo siempre la disciplina de commits atómicos y verificación continua de compilación.

