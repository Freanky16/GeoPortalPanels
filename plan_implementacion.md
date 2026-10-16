# Plan de Implementación: Plataforma de Paneles Publicitarios (Lima Metropolitana)

Este documento define la arquitectura, el diseño y las fases de desarrollo para la plataforma interactiva de visualización y gestión de paneles publicitarios.

## 1. Arquitectura Técnica (El Stack)

El proyecto prioriza el rendimiento, la estética premium y un costo inicial cero, utilizando tecnologías modernas y escalables.

*   **Frontend (La Web):** `Next.js` (React). Permite renderizado rápido, manejo nativo de rutas (para URLs compartibles con filtros) y fácil despliegue.
*   **Estilos:** `CSS Modules` / `Vanilla CSS`. Diseño 100% a medida (sin plantillas rígidas). Uso de variables CSS para el soporte nativo de Modo Oscuro/Claro.
*   **Mapa Base y Motor:** `MapLibre GL JS` (motor WebGL ultra rápido, soporta clustering) + `MapTiler` (proveedor de los mapas de calles/satélite, 100k cargas/mes gratis).
*   **Gráficos:** `Recharts`. Librería nativa de React, fácil de personalizar para lograr el aspecto redondeado y estético requerido.
*   **Gestión de Estado (Cross-filtering):** `Zustand`. Un gestor de estado ligero para conectar filtros, mapa y gráficos en tiempo real.
*   **Backend / Base de Datos:** `Supabase` (PostgreSQL). Proporciona base de datos relacional, API instantánea y autenticación de usuarios de forma gratuita.

## 2. Modelo de Datos (BBDD)

Diseño relacional sólido para evitar redundancias y facilitar la actualización.

*   **Tabla Principal:** `Paneles` (Código Interno, Código 1_NAP, Latitud, Longitud, Dirección, Medidas, ID_Contrato, etc.).
*   **Catálogos (Tablas Maestras):** `Empresas`, `Distritos`, `TiposVia`, `EspaciosPublicitarios`, `TiposEPE`, `CaracteristicasTecnicas`, `Materiales`.
*   **Tabla de Contratos:** `Contratos` (N_Contrato, ID_Empresa, Tipo_Contrato, Fecha_Suscripcion, Fecha_Vencimiento).
*   *Nota sobre Coordenadas:* El sistema trabajará exclusivamente con WGS84 (Lat/Lon). Las coordenadas UTM se pueden almacenar como referencia texto, pero no dictan la lógica del mapa.

## 3. UI/UX: Diseño Visual (Glassmorphism Analítico)

La plataforma no debe verse como un "sistema municipal", sino como una herramienta analítica moderna y premium.

*   **Distribución:**
    *   Mapa a pantalla completa (Full Screen).
    *   Buscador rápido flotante (top).
    *   Panel de Filtros flotante y plegable (izquierda), usando **Chips/Pills interactivos** en lugar de checkboxes tradicionales.
    *   Panel de Gráficos (Dashboard) desplegable desde abajo.
*   **Paleta de Colores (Modo Oscuro por defecto):**
    *   *Fondo:* Mapa en tonos oscuros (Dark Slate).
    *   *Paneles UI:* `#1E293B` con transparencia (60-80%) y efecto Blur (desenfoque de fondo).
    *   *Semáforo de Contratos:* Verde Neón (Vigente), Ámbar/Naranja (Por vencer), Rojo/Rosa (Vencido).
*   **Tipografía:** `Outfit` o `Inter`.
*   **Interacciones:** Transiciones suaves, tooltips estéticos en los gráficos, animaciones de vuelo en el mapa (*flyTo*) al seleccionar un distrito o clúster.

## 4. Lógica de Importación de Datos (Seed Script)

Se creará un script controlado (Node.js/Python) para cargar el Excel inicial.
**Reglas del Script:**
1.  Normaliza textos (espacios, mayúsculas).
2.  Cruza los datos del Excel con los catálogos existentes.
3.  **No crea catálogos ciegamente.** Si encuentra un distrito o empresa que no existe, el script se pausa y reporta el error para intervención humana (evitando duplicados por errores de tipeo como "JESUS MARIA" vs "JESÚS MARÍA").
4.  Calcula dinámicamente las fechas de vencimiento (+5 años desde suscripción).

## 5. Fases de Desarrollo (Iterativo)

### Fase 1: Esqueleto y Mapa Base (Prueba 100 paneles)
*   Configuración del proyecto Next.js y Supabase.
*   Script de importación y carga de los primeros 100 paneles reales.
*   Implementación de MapLibre y renderizado de puntos en el mapa con Clustering.

### Fase 2: Filtrado Cruzado y Estado
*   Implementación del buscador flotante.
*   Panel lateral de filtros (Chips interactivos).
*   Sincronización: Filtros <-> Mapa <-> URL.

### Fase 3: Dashboard y Analítica
*   Integración de Recharts.
*   Creación del panel inferior con barras por distrito, anillo de tipos de EPE y métricas de contratos.
*   Conexión de los gráficos para que actúen como filtros (Cross-filtering).

### Fase 4: Autenticación, Fichas y Edición
*   Pantalla de Login para el equipo.
*   Tarjetas de detalles al hacer clic en un pin.
*   Formularios para editar la información de un panel o contrato desde la interfaz web.
*   Carga del lote completo (1,249 paneles).

### Fase 5: Pulido y Vistas Rápidas
*   Estados vacíos amables ("No hay datos para esta combinación").
*   Implementación de atajos ("Contratos por vencer en 12 meses").
*   Optimización móvil (Responsive Design).
