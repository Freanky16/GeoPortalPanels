# MD-6: Integración de Capas Oficiales MML (Zonificación y Sistema Vial Metropolitano)

**Proyecto:** Geoportal de Publicidad Exterior (SIGPE) — MML  
**Fecha:** Noviembre 2026  
**Documento:** MD-6 de 6 (Fase de Planificación Maestra)  
**Estado:** Diagnóstico Técnico de Enlaces ArcGIS y Solución Arquitectónica  

---

## 1. Respuesta Inmediata a tus Preguntas Cruciales

### A. ¿Tenemos que cambiar o botar el mapa que ya tenemos?
**¡NO, ROTUNDAMENTE NO!**  
No tienes que borrar MapLibre ni cambiar de mapa. MapLibre GL JS es el estándar abierto más potente de la industria GIS: soporta de forma nativa capas raster, capas vectoriales, GeoJSON, servidores WMS y servidores **ArcGIS REST** del Estado Peruano. Tus mapas actuales (Satélite ESRI, Calles Carto, etc.) seguirán funcionando exactamente igual. Las capas de la Municipalidad simplemente se montan encima como capas adicionales.

---

### B. ¿De dónde sacamos el dato? ¿Tienen contraseña o son públicos?
**Son 100% PÚBLICOS y GRATUITOS (Open Data del Estado Peruano / IDEP).**  
Por mandato de la Ley de Transparencia y la Infraestructura de Datos Espaciales del Perú (IDEP), las capas de Zonificación de Lima y el Sistema Vial Metropolitano son datos abiertos.
* **No requieren contraseñas ni tokens de pago.**
* Cuando el visor oficial web carga en tu navegador, tu computadora ya está recibiendo los datos libremente.
* Lo único que se hace es inspeccionar la petición HTTP y enlazar ese mismo endpoint público directo a tu mapa.

---

### C. ¿Cómo sabemos qué pintar y qué colores usar? (Más de 20 texturas)
**No tenemos que dibujar ni pintar nada a mano.**  
El Instituto Metropolitano de Planificación (IMP) y la Municipalidad Metropolitana de Lima (MML) ya tienen todo dibujado y parametrizado en sus servidores oficiales de mapas. Ellos emiten la información en dos formatos compatibles:
1. **Tiles WMS / MapServer Raster:** El servidor de la MML nos entrega las imágenes transparentes con los colores oficiales de zonificación (RDM, RDA, CZ, etc.) listas para proyectarse sobre tus calles.
2. **FeatureServer GeoJSON:** Entrega los polígonos vectoriales con sus atributos exactos (tipo de zonificación, norma, ordenanza).

---

### D. Estrategia Gradual: Agregar como Capas Extra Seguras
Para darte **100% de tranquilidad de que tu mapa no se malogrará**:
* Mantendremos tus capas base actuales funcionando sin tocar.
* Zonificación y Sistema Vial se agregarán como **capas extra conmutables (botones independientes de encendido/apagado)**.
* Si la capa está apagada, el mapa se ve exactamente igual que hoy. Si se enciende, se proyecta suavemente encima con opacidad translúcida.

---

## 2. Análisis de los Enlaces Oficiales que Proporcionaste

Revisando los dos visores de la Municipalidad de Lima que compartiste:

```
Enlace 1: https://experience.arcgis.com/experience/28c48a63e1df49d6958d51984db1043e/page/P%C3%A1gina/
➔ Visor Oficial del Plan Metropolitano de Desarrollo Urbano (IMP / MML) - Capa de Zonificación.

Enlace 2: https://experience.arcgis.com/experience/9bf8fbedd99c4b2daae0d421caa33583
➔ Visor del Sistema Vial Metropolitano (GPIP / MML) - Clasificación de Vías (Expresas, Arteriales, Colectoras).
```

### ¿Qué hay detrás de estos visores "Experience ArcGIS"?
Estos visores web son solo una fachada bonita desarrollada por Esri Perú para la MML. Por debajo, ambos visores consumen servicios públicos alojados en:
* Servidor ArcGIS Online de la Municipalidad de Lima / IMP.
* Capas de entidades denominadas `FeatureServer` o `MapServer`.

---

## 3. Arquitectura de Integración en el Geoportal (Selector de Capas)

Para que entiendas perfectamente lo que te explicaba antes:  
En la esquina superior o flotante de tu mapa, actualmente tienes botones para alternar el mapa base:
* `[ Calles ]`
* `[ Satélite ]`

Lo que haremos es convertirlo en un selector profesional con dos secciones: **Mapa Base** y **Capas Temáticas Superpuestas (Overlays)**:

```
┌──────────────────────────────────────────────────────────────┐
│  MAPAS BASE (Elige uno):                                     │
│  (•) Satélite Híbrido     ( ) Calles Claras                  │
├──────────────────────────────────────────────────────────────┤
│  CAPAS OFICIALES MML (Activa o desactiva con un clic):       │
│  [☑] Zonificación Metropolitana (IMP)                         │
│      Leyenda: ■ Residencial  ■ Comercial  ■ Industrial       │
│  [☑] Red Vial Metropolitana (Vías Expresas / Arteriales)     │
└──────────────────────────────────────────────────────────────┘
```

```
       CAPAS SUPERPUESTAS
┌──────────────────────────────────────────┐
│  [ Paneles Publicitarios (Puntos) ]      │  ◄── Tu capa de paneles y radios
├──────────────────────────────────────────┤
│  [ Red Vial Metropolitana (Líneas) ]     │  ◄── Capa oficial MML (Enlace 2)
├──────────────────────────────────────────┤
│  [ Zonificación IMP (Polígonos Colores) ]│  ◄── Capa oficial IMP (Enlace 1)
├──────────────────────────────────────────┤
│  [ Mapa Satelital ESRI (Fondo) ]         │  ◄── Tu mapa base actual
└──────────────────────────────────────────┘
```

---

## 4. Cómo se Inspecciona y Conecta el Servicio Oficial

Cuando pasemos a la fase de implementación de estas capas, el procedimiento técnico será:

1. **Extracción del Endpoint REST:**
   Inspeccionaremos las llamadas de red del visor ArcGIS de la MML para capturar la URL del servicio, que luce similar a:
   `https://servicesX.arcgis.com/.../arcgis/rest/services/Zonificacion_Lima/MapServer/tile/{z}/{y}/{x}`
2. **Incorporación en `src/lib/mapConfig.ts`:**
   Se añade como una fuente estándar de MapLibre:
   ```typescript
   export const CAPAS_MML = {
     zonificacion: {
       id: 'mml-zonificacion',
       type: 'raster',
       tiles: ['https://servicios-gis.imp.gob.pe/.../{z}/{y}/{x}'],
       tileSize: 256,
       opacity: 0.65 // Translúcido para ver las calles y paneles debajo
     },
     viasMetropolitanas: {
       id: 'mml-vias',
       type: 'line',
       sourceUrl: 'https://servicios-gis.imp.gob.pe/.../Vias/FeatureServer/0'
     }
   };
   ```
3. **Opacidad Ajustable:**
   La capa de zonificación se renderiza con un `65%` de opacidad. Esto permite ver claramente los colores de las zonas urbanas de Lima sin tapar los nombres de las calles satelitales ni los círculos de distanciamiento de tus paneles.

---

## 5. Resumen del Plan Maestro Completo (6 Documentos `.md`)

Con este documento cerramos la arquitectura teórica completa del Geoportal:

1. 📄 [MD-1_Ajustes_Visuales_UI_UX.md](file:///d:/ProyectoMapsHoarding/MD-1_Ajustes_Visuales_UI_UX.md): Interfaz comercial limpia, adiós asteriscos, nuevo Teal `#0D9488`.
2. 📄 [MD-2_Matriz_Distanciamiento_Normativo_Sensores.md](file:///d:/ProyectoMapsHoarding/MD-2_Matriz_Distanciamiento_Normativo_Sensores.md): Radios oficiales por Tipo EPE y regla de 200m en Vías Especiales.
3. 📄 [MD-3_Rediseno_Base_Datos_Supabase.md](file:///d:/ProyectoMapsHoarding/MD-3_Rediseno_Base_Datos_Supabase.md): 6 estados contractuales, dimensiones y script seguro sin romper nada.
4. 📄 [MD-4_Plan_Importacion_Masiva_Excel.md](file:///d:/ProyectoMapsHoarding/MD-4_Plan_Importacion_Masiva_Excel.md): Pipeline unificado de 23 columnas, tolerancia a comas y modo `--dry-run`.
5. 📄 [MD-5_Búsqueda_Libre_y_Geocodificación.md](file:///d:/ProyectoMapsHoarding/MD-5_B%C3%BAsqueda_Libre_y_Geocodificaci%C3%B3n.md): Vuelo a coordenadas libres no invasivo y autocompletado de calles.
6. 📄 [MD-6_Integracion_Capas_MML_ArcGIS.md](file:///d:/ProyectoMapsHoarding/MD-6_Integracion_Capas_MML_ArcGIS.md): Conexión de Zonificación y Vías del IMP sobre MapLibre.

