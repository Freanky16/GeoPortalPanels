# INSTRUCCIONES DE TRASPASO DE CONTEXTO Y ESTADO OPERATIVO (PARA EL AGENTE ENTRANTE)

**Proyecto:** SIGPE — Geoportal de Publicidad Exterior (Municipalidad Metropolitana de Lima)  
**Ruta del Repositorio Local:** `d:\ProyectoMapsHoarding`  
**GitHub Remoto:** `https://github.com/Freanky16/GeoPortalPanels.git` (Rama: `main`)  
**Backend:** Supabase (`https://npqcwbpepadhccayqhpi.supabase.co`)  
**Despliegue:** Vercel en producción sincronizado automáticamente con GitHub `main`  
**Fecha de Traspaso:** Noviembre 2026  

---

## 1. REGLAS SAGRADAS DE TRABAJO CON EL USUARIO (OBLIGATORIAS)

Colega, estás asumiendo la coordinación y desarrollo del Geoportal de Publicidad Exterior de Lima. Sigue estrictamente estas reglas innegociables:

1. **NO HAGAS CÓDIGO AL AZAR:** Primero lee este documento, comprende la estructura y los planes aprobados.
2. **VERIFICACIÓN Y SINCRONIZACIÓN CONTINUA:**
   * Lema del proyecto: *"SINCRONIZADO Y PENSANDO EN EL FUTURO: ACTUALIZACIÓN REAL Y CONEXIÓN BACKEND-FRONTEND-BASEDEDATOS"*.
   * Cada vez que toques código: ejecuta siempre `git status` antes y después.
   * Compilación de TypeScript estricta: `npx tsc --noEmit` (no uses `npm run build` porque si el usuario tiene el dev server abierto en Windows dará error de bloqueo de archivos `.next`).
   * En Windows PowerShell **NUNCA uses `&&`**; usa punto y coma `;`.
   * En CSS solo usamos **CSS Modules**, nada de Tailwind.
3. **LENGUAJE COMERCIAL Y RESPETO AL USUARIO:**
   * Cero tecnicismos visibles en la UI (nada de "WGS84", ni "precisión ilimitada", ni asteriscos rojos innecesarios, ni emojis estilo WhatsApp).
   * Los datos de empresas con nombres duplicados o variantes del Excel original (ej: PROBIEN vs PROBIAN) **no se borran ni se fuerzan**; se respetan y conviven.
   * Al finalizar cada plan o fase, se coloca un rótulo grande de TERMINADO al final del documento `.md` correspondiente, preservando todo el texto e historial anterior.

---

## 2. ESTADO ACTUAL DETALLADO: QUÉ ESTÁ HECHO Y VERIFICADO

### A. Fase 1 y MD-1: Ajustes Visuales, UI/UX y Lenguaje Comercial (100% TERMINADO)
* Color del pulse dot y badges unificado al verde marino institucional **Teal `#0D9488`**.
* Ícono único SVG para "Nuevo Panel".
* Curvatura y sombra difusa en `PanelDrawer.tsx` (`border-top-left-radius: 12px; border-bottom-left-radius: 12px; box-shadow: -4px 0 24px rgba(0,0,0,0.12)`).
* Retiro de placeholders, asteriscos y tecnicismos.
* Validación dinámica: los campos faltantes se resaltan en rojo suave (`#FEF2F2`, borde `#EF4444`) con banner de aviso inferior.
* Interacción continua del mapa: se puede hacer zoom y pan libre con la rueda del ratón mientras el Drawer está abierto (`pointer-events: none` en backdrop).
* Centrado y vuelo automático (`flyTo` zoom 17) al hacer clic en "Marcar en Mapa".

### B. MD-2: Matriz de Distanciamiento Normativo y Sensores (100% TERMINADO)
* Matriz oficial implementada:
  * Paleta publicitaria: **50 m**
  * Panel monumental unipolar: **100 m**
  * Panel monumental: **150 m** (o **200 m** en Vías Especiales)
  * Panel monumental volumétrico: **150 m**
  * Tótem: **75 m**
  * Panel simple: **75 m**
  * Mobiliario urbano - nomenclatura de vías: **0 m** (exento de restricción espacial)
  * Otro: **0 m**
* Lector estricto de **Vías Especiales**: lee el texto del campo `direccion` (busca `PANAMERICANA SUR`, `PANAMERICANA NORTE`, `ANTIGUA PANAMERICANA SUR`, `CARRETERA CENTRAL`, `RAMIRO PRIALE`, etc.) y si es panel monumental le asigna 200 m automáticamente sin adivinar por coordenadas.
* Cálculo geodésico Haversine recíproco y dinámico en `PanelDrawer.tsx` contra paneles existentes.
* Buffer circular visual en `MapView.tsx`: se proyecta en Verde Teal (`#0D9488`) si la ubicación es apta, y en Rojo Carmín (`#EF4444`) con bloqueo del botón Guardar si hay conflicto normativo de proximidad.

### C. MD-3: Rediseño de Base de Datos en Supabase (EJECUTADO Y VERIFICADO EN BD)
* **Vaciado Limpio:** Se ejecutó el borrado de los 400 paneles de prueba anteriores. La tabla `paneles` está en **0 registros**, limpia y lista para los datos nuevos.
* **Tabla `estados_contrato`:** Creada con permisos `GRANT ALL ON TABLE estados_contrato TO anon, authenticated, service_role;` verificado.
* **DATO CLAVE DEL USUARIO (NUEVO):** El usuario confirmó que todos los paneles sin contrato tienen en su campo `ESTADO CONTRACTUAL` el texto exacto: **`NO TERMINO REORDENAMIENTO`**. Ya se insertó este estado en Supabase y está vinculado como equivalente de "Sin contrato de reordenamiento".
* **Tabla `tipos_epe`:** Columna `radio_default_metros` creada y actualizada con los radios normativos oficiales (50, 100, 150, 75, 0).
* **Tabla `materiales`:** Se añadió **`Vinil`** (ahora son 11 materiales oficiales).
* **Tabla `paneles`:** Nuevas columnas confirmadas y operativas: `ficha_publicidad`, `ficha_contrato_inicio`, `plazo_anios`, `estado_contrato_id`.

---

## 3. DÓNDE ESTAMOS EXACTAMENTE (EL PUNTO DE PARTIDA PARA TI)

El usuario tiene listo un archivo Excel maestro con aproximadamente **1,300 paneles** (alrededor de 800 con contrato y más de 400 sin contrato con estado `NO TERMINO REORDENAMIENTO`).

El usuario colocará su archivo en la carpeta `scripts/` (normalmente como `PlantillaEstandarBD.xlsx` o con el nombre que él elija).

### El Script de Importación (`scripts/importar-excel.ts`):
Se encuentra totalmente programado y compilando con 0 errores de TypeScript (`npx tsc --noEmit`). Sus características principales:
1. **Tolerancia Ultra-Flexible de Encabezados:** No le importan guiones bajos, tildes ni mayúsculas. Reconoce las 22 columnas en el orden exacto que el usuario formateó:
   `CODIGO`, `LATITUD`, `LONGITUD`, `DIRECCION`, `DISTRITO`, `EMPRESA`, `ESTADO CONTRACTUAL`, `N° CONTRATO`, `FICHA DE CADA PUBLICIDAD`, `FECHA DE CONTRATO O INICIO DE PROCEDIMIENTO`, `PLAZO`, `TIPO DE VIA`, `ESPACIO PUBLICITARIO`, `TIPO EPE`, `CARACTERISTICAS TÉCNICAS`, `MATERIAL PREDOMINANTE`, `AREA DE OCUPACION`, `AREA DE EXIBICION`, `ALTURA DE POSTE`, `ALTO`, `LARGO`, `ESPESOR`.
2. **Auto-creación Dinámica de Empresas:** Si en los 1,300 paneles aparecen empresas nuevas que no estaban en la base de datos, el script las crea automáticamente en Supabase sobre la marcha y asocia el panel. **Ninguna fila es rechazada por empresa nueva**.
3. **Conversión de comas a puntos en coordenadas:** Tolera decimales con comas (`-12,06...` ➔ `-12.06...`).
4. **Manejo de Paneles con y sin Contrato:**
   * Si es `NO TERMINO REORDENAMIENTO` o sin contrato, asigna el estado, deja `contrato_id`, `numero_contrato` y `ficha_publicidad` como `NULL`.
   * Si tiene contrato, crea o reutiliza el contrato en la tabla `contratos` y lo vincula.
5. **Subida en Lotes (Batches de 100):** Procesa los 1,300 paneles fluidamente en 15 segundos sin saturar la red.

---

## 4. TUS TAREAS INMEDIATAS AL INICIAR

1. **Revisar el Script:** Inspecciona `scripts/importar-excel.ts` y asegúrate de que comprendes su flujo. Verifica que el mapeo reconozca `NO TERMINO REORDENAMIENTO`.
2. **Preguntar al Usuario el Nombre del Archivo:** Pregúntale al usuario si ya colocó el archivo Excel en la carpeta `scripts/` y cómo lo nombró (por ejemplo `PlantillaEstandarBD.xlsx` o `paneles_1300.xlsx`).
3. **Ejecutar Primero en Modo Simulación (`--dry-run`):**
   ```powershell
   npx tsx scripts/importar-excel.ts --dry-run
   ```
   *(o con `--file=nombre_archivo.xlsx --dry-run`)*.
   Analiza el reporte: cuántas filas válidas detectó, cuántas empresas nuevas creará y si hay filas rechazadas por coordenadas vacías para avisarle al usuario.
4. **Ejecutar la Importación Definitiva:**
   Una vez validado el dry-run con el usuario, corre la importación real:
   ```powershell
   npx tsx scripts/importar-excel.ts
   ```
5. **Verificar el Mapa:** Comprobar que el Geoportal cargue los 1,300 paneles en el mapa, que los clusters funcionen, que los filtros de distritos/empresas respondan y que los paneles sin contrato se muestren adecuadamente.
6. **Cierre de MD-4:** Actualizar `MD-4_Plan_Importacion_Masiva_Excel.md` marcándolo como 100% TERMINADO, hacer `git status`, commit atómico y push a `main`.
