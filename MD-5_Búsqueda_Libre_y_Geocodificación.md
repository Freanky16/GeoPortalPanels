# MD-5: Búsqueda Libre por Coordenadas y Geocodificación Inversa

**Proyecto:** Geoportal de Publicidad Exterior (SIGPE) — MML  
**Fecha:** Noviembre 2026  
**Documento:** MD-5 de 6 (Fase de Planificación Maestra)  
**Estado:** Especificación Técnica Aprobada  

---

## 1. Visión General del Módulo

Este documento aborda dos capacidades operativas clave solicitadas para el trabajo en campo y oficina:
1. **Búsqueda Cartográfica Libre (Estilo Google Earth):** Permitir a los ingenieros y fiscalizadores ingresar cualquier coordenada geográfica del mundo (específicamente del ámbito de Lima Metropolitana), logrando que el mapa vuele a esa posición con animación fluida, aun cuando no exista ningún panel registrado en ese punto.
2. **Geocodificación Inversa Asistida:** Deducir automáticamente el nombre de la vía/calle y el distrito al hacer clic sobre el mapa para capturar coordenadas, reduciendo errores de tipeo manual.

### Aclaración Técnica: Cobertura Global del Mapa (¿Puede volar a China?)
* **Respuesta: SÍ, el mapa puede volar a cualquier parte del planeta (incluso a China).**
* Los mapas base configurados en MapLibre (tanto ESRI Satellite como Carto Streets) son **tilesets de escala mundial**. Tienen cobertura satelital y vectorial de toda la Tierra.
* Si en el buscador ingresas coordenadas de París, Nueva York o Beijing, la cámara volará sin problemas a esa parte del mundo. Sin embargo, para efectos prácticos y de usabilidad del Geoportal de Lima, se configurará una **advertencia sutil** si la coordenada buscada cae fuera de los límites de Lima y Calles Metropolitanas (ej: *"Ubicación fuera del ámbito de Lima Metropolitana"*), evitando extravíos accidentales del fiscalizador.

---

## 2. Motor de Búsqueda Libre por Coordenadas

### A. Reconocimiento de Patrones (Expresiones Regulares)
El buscador principal en el encabezado (`InstitutionalHeader`) actualmente solo filtra sobre el array de paneles existentes en memoria. Se extenderá con un analizador de coordenadas:

```typescript
// Detector de coordenadas WGS84 (Latitud, Longitud)
// Soporta formatos comunes: "-12.045, -77.031" o "-12.045 -77.031"
const PATRON_COORDENADAS = /^\s*(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)\s*$/;
```

### B. Flujo de Vuelo Cartográfico (`flyTo`)

```
Usuario escribe: "-12.06535, -77.03906"
                   │
                   ▼
       ¿Existe panel en esa coord.?
        ├── SÍ ──► Abre la ficha del panel normalmente
        └── NO ──► MAPA VUELA (flyTo zoom 17)
                   │
                   ▼
     Coloca Pin de Retícula Temporal
     + Tarjeta Sutil Flotante (Toast No Invasivo)
```

### C. Experiencia Visual Sutil (Cero Modales Molestos)
Tal como solicitaste, **no habrá ventanas bloqueantes ni modales invasivos**. Se implementará un chip flotante sobrio en la esquina inferior del mapa:

```
┌────────────────────────────────────────────────────────────────┐
│ 📍 Ubicación en coordenadas [-12.06535, -77.03906]            │
│ Sin paneles registrados en este punto.                         │
│                                                                │
│ [ Registrar panel aquí ]  (Solo visible si Acceso Técnico ON)  │
│ [ ✕ Cerrar ]                                                  │
└────────────────────────────────────────────────────────────────┘
```
* Si el usuario hace clic en **"Registrar panel aquí"**, se abre el Drawer lateral deslizante con la latitud y longitud ya cargadas.
* Si el usuario hace clic en cualquier otra parte del mapa o en la `✕`, el chip y el marcador temporal desaparecen sin interrumpir la navegación.

---

## 3. Geocodificación Inversa (Dirección Automática al Clic)

### ¿Cómo funciona técnicamente?
Cuando el usuario activa el modo *"Marcar en Mapa"* y hace clic sobre una calle:
1. MapLibre obtiene las coordenadas exactas `[lat, lng]`.
2. Se ejecuta una micro-consulta HTTP asíncrona hacia el motor libre de OpenStreetMap (Nominatim) o servicio local:
   ```
   GET https://nominatim.openstreetmap.org/reverse?lat=-12.06535&lon=-77.03906&format=json
   ```
3. La respuesta devuelve un objeto JSON estructurado con la vía (`road`), el distrito (`suburb`/`city_district`) y el código postal.
4. **Comportamiento en la Interfaz:**
   * El campo **"Dirección / Vía"** del Drawer se rellena automáticamente con el nombre detectado (ej: *"Avenida Salaverry"*).
   * El usuario siempre mantiene el control total: si el nombre automático no le convence o quiere agregar un detalle (ej: *"Av. Salaverry cdra 14 frente al parque"*), puede editar el texto libremente.

---

## 4. Archivos Involucrados en la Implementación

* [InstitutionalHeader.tsx](file:///d:/ProyectoMapsHoarding/src/components/Header/InstitutionalHeader.tsx): Incorporación del validador de coordenadas libres y animación `map.flyTo()`.
* [MapView.tsx](file:///d:/ProyectoMapsHoarding/src/components/Map/MapView.tsx): Renderizado del marcador libre temporal y el microchip de acción sutil.
* [PanelDrawer.tsx](file:///d:/ProyectoMapsHoarding/src/components/Panel/PanelDrawer.tsx): Recepción de dirección autocompletada por geocodificación inversa.

---

## 5. Estado y Próximos Pasos

* **Documento MD-5:** Concluido y guardado en disco.
* **Documento MD-6:** Se creará a continuación para abordar a profundidad los enlaces ArcGIS de la Municipalidad de Lima y la integración de las capas de Zonificación y Vías.

