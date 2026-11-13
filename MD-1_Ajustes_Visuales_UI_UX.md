# MD-1: Ajustes Visuales, Lenguaje Comercial y Experiencia de Usuario (UI/UX)

**Proyecto:** Geoportal de Publicidad Exterior (SIGPE) — MML  
**Fecha:** Noviembre 2026  
**Documento:** MD-1 de 5 (Fase de Planificación Maestra)  
**Estado:** Aprobado y Consensuado con el Usuario  

---

## 1. Visión General del Documento

Este documento consolida y especifica las correcciones de diseño visual, interfaz y experiencia de usuario para el Geoportal. El objetivo es transformar una interfaz con tecnicismos internos en una herramienta con **lenguaje comercial limpio, sobrio y accesible** tanto para el administrador municipal como para empresas de marketing y concesionarias, manteniendo la seriedad institucional de la Municipalidad Metropolitana de Lima.

---

## 2. Diagnóstico de Elementos a Corregir

```
[INTERFAZ ACTUAL (Problemas)]             [NUEVA INTERFAZ REFINADA]
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│ [🟢 400 paneles] (Verde claro)  │  ──>  │ [🟢 400 paneles] (#0D9488 Teal) │
│ [+ [+ Nuevo Panel]] (Duplicado) │  ──>  │ [+ Nuevo Panel] (SVG único)     │
│ [Drawer: Esquinas cuadradas]    │  ──>  │ [Drawer: Esquinas curveadas 8px]│
│ Subtítulo: "Directo en BD..."   │  ──>  │ Subtítulo: "Gestión Técnica"    │
│ "Código Oficial *" (Asterisco)  │  ──>  │ "Código del Panel" (Limpio)     │
│ "Ej: 401_NAP" (Placeholder)     │  ──>  │ Campo vacío, sin texto sombra   │
│ "Coord. Geodésicas WGS84"       │  ──>  │ "Coordenadas"                   │
│ "Precisión Ilimitada"           │  ──>  │ (Eliminado por completo)        │
│ [📍 Marcar en Mapa] (Emoji)     │  ──>  │ [🎯 / Pin SVG Vectorial]        │
│ Distrito: [Ancón por defecto]   │  ──>  │ [-- Selecciona un distrito --]  │
│ Empresa: [PROBIEN por defecto]  │  ──>  │ [-- Selecciona una empresa --]  │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

---

## 3. Especificaciones Detalladas de Cambios

### A. Encabezado Institucional (`InstitutionalHeader`)
1. **Unificación Cromática del Estado:**
   * El punto pulsante (*pulse dot*) al lado de "400 paneles" actualmente usa un verde brillante genérico (`#22c55e`). Se cambia al tono verde marino/petróleo oficial **Teal `#0D9488`**, armonizando con el botón de nuevo panel.
2. **Corrección de Ícono Duplicado:**
   * Se elimina la redundancia visual donde aparecía un ícono `+` gráfico junto al texto con otro `+`. Se implementa un ícono SVG minimalista de trazo fino junto al texto limpio *"Nuevo Panel"*.

---

### B. Estructura y Estética del Drawer Lateral (`PanelDrawer`)
1. **Acoplamiento Visual y Curvatura:**
   * El borde lateral del drawer que colinda con el mapa se dota de un radio de curvatura sutil (`border-top-left-radius: 12px; border-bottom-left-radius: 12px;`) para que no se sienta como un bloque cortado abruptamente, logrando un acoplamiento orgánico con el mapa.
2. **Sombra y Transición:**
   * Se mantiene una elevación suave con sombra difusa (`box-shadow: -4px 0 24px rgba(0,0,0,0.12)`), permitiendo leer el contenido sin tapar bruscamente la operativa cartográfica.

---

### C. Depuración de Lenguaje Técnico y Textos
1. **Titulares y Subtítulos:**
   * Se retira *"Gestión técnica directo en base de datos"*.
   * Se establece únicamente:
     * **Título:** `Registrar Nuevo Panel` (o `Editar Panel` según corresponda).
     * **Subtítulo:** `Gestión Técnica`.
2. **Eliminación de Tecnicismos Innecesarios:**
   * En lugar de *"Coordenadas Geodésicas WGS84"*, el rótulo será simplemente: **"Coordenadas"**.
   * Se retira la etiqueta *"Precisión Ilimitada"*, evitando promesas técnicas confusas para usuarios comerciales.

---

### D. Formulario, Validación y Textos Sombra (Placeholders)
1. **Eliminación de Asteriscos Rojos y Textos Sombra:**
   * Se eliminan los asteriscos rojos `*` de los títulos de campo.
   * Se eliminan todos los textos sombra de ejemplo (`placeholder="Ej: 401_NAP"`, `placeholder="Ej: Av. Salaverry"`), entregando campos completamente limpios para que el usuario no se confunda pensando que ya contienen un dato ingresado.
2. **Comportamiento de Validación Dinámica (Respuesta a tu requerimiento):**
   * Los campos obligatorios requeridos para el cálculo normativo y cartográfico son:
     * Código del Panel.
     * Coordenadas (Latitud / Longitud).
     * Vía / Dirección.
     * Distrito.
     * Empresa Concesionaria.
     * Tipo de Publicidad (EPE).
   * **Flujo de validación al presionar "Guardar":**
     1. Si falta alguno de estos campos, **no se permite guardar**.
     2. Se muestra un aviso al pie del drawer: *"Faltan campos obligatorios por completar"*.
     3. Automáticamente, los campos faltantes se resaltan con un borde sutil en tono carmín suave (`border: 1.5px solid #EF4444; background: #FEF2F2;`).
     4. Al empezar a escribir en el campo resaltado, el borde recupera su color neutro natural.

---

### E. Selectores por Defecto (Distrito y Empresa)
1. En lugar de auto-seleccionar el primer elemento del abecedario (ej. "Ancón" o "PROBIEN"), los selectores inician en estado neutro:
   * **Distrito:** `-- Selecciona un distrito --` (valor vacío `""`).
   * **Empresa:** `-- Selecciona una empresa --` (valor vacío `""`).
2. Esto previene que un usuario guarde accidentalmente un panel asignado a un distrito o empresa errónea por descuido.

---

### F. Reemplazo de Emojis por Íconos Vectoriales
1. **Botón "Marcar en Mapa":**
   * Se remueve el emoji de alfiler `📍` (estilo mensajería móvil).
   * Se reemplaza por un ícono vectorial SVG limpio de retícula/puntero cartográfico (`Crosshair / Target Pin`), brindando una apariencia profesional de software GIS corporativo.

---

## 4. Archivos Involucrados en la Implementación de este Documento

* [InstitutionalHeader.tsx](file:///d:/ProyectoMapsHoarding/src/components/Header/InstitutionalHeader.tsx): Unificación del color del pulso `#0D9488` y corrección de ícono único de suma.
* [InstitutionalHeader.module.css](file:///d:/ProyectoMapsHoarding/src/components/Header/InstitutionalHeader.module.css): Ajuste de estilos de badges y botones.
* [PanelDrawer.tsx](file:///d:/ProyectoMapsHoarding/src/components/Panel/PanelDrawer.tsx): Limpieza de títulos, eliminación de placeholders, implementación del ícono SVG para captura de coordenadas, selectores neutros y lógica de bordeado de error.
* [PanelDrawer.module.css](file:///d:/ProyectoMapsHoarding/src/components/Panel/PanelDrawer.module.css): Curvatura de bordes hacia el mapa, estados de borde de error para campos obligatorios y tipografías comerciales.

---

## 5. Estado de Aprobación

* **Documento MD-1:** Completado y archivado en disco local.
* **Próximo paso:** Pasar a la revisión y preguntas para el **Documento MD-2: Matriz de Distanciamiento Normativo y Sensores por Tipo de Publicidad**.

