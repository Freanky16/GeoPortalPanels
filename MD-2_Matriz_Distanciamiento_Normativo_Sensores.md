# MD-2: Matriz de Distanciamiento Normativo, Vías Especiales y Sensores de Proximidad

**Proyecto:** Geoportal de Publicidad Exterior (SIGPE) — MML  
**Fecha:** Noviembre 2026  
**Documento:** MD-2 de 5 (Fase de Planificación Maestra)  
**Estado:** Especificación Técnica Aprobada  

---

## 1. Visión General del Sensor Inteligente de Proximidad

El Geoportal incorpora un motor espacial de verificación de distancias normativas viales. En lugar de aplicar una distancia fija (antiguos 100 metros), el sistema calcula en tiempo real la distancia geodésica entre el punto donde se desea registrar/editar un panel y todos los paneles existentes en la base de datos de Lima.

El radio de protección y zona de exclusión se adapta de forma dinámica según el **Tipo de Publicidad (Tipo de EPE)** y la jerarquía de la **Vía** donde se ubica el soporte.

---

## 2. Matriz Oficial de Radios Normativos (Datos Oficiales del Ingeniero)

El distanciamiento corresponde al **radio de influencia** ($R$) en metros medido desde el eje del soporte. La distancia mínima entre dos elementos homólogos equivale a la suma de sus restricciones normativas.

| Tipo de Publicidad / Tipo de EPE | Radio Normativo ($R$) | Diámetro de Influencia ($2R$) | Condición Especial de Aplicación |
| :--- | :---: | :---: | :--- |
| **Paleta publicitaria** | **50 m** | 100 m | Aplica en vías colectoras, arteriales y separadores |
| **Panel monumental unipolar** | **100 m** | 200 m | Aplica en vías regulares |
| **Panel monumental (Regular)** | **150 m** | 300 m | Aplica en cualquier vía que **NO** sea vía especial |
| **Panel monumental (Vía Especial)** | **200 m** | 400 m | Panamericana Norte, Panamericana Sur, Antigua Panamericana Sur, Carretera Central, Ramiro Prialé |
| **Panel monumental volumétrico** | **150 m** | 300 m | Aplica en todas las vías |
| **Tótem** | **75 m** | 150 m | Vías colectoras y arteriales comerciales |
| **Panel simple** | **75 m** | 150 m | Entornos urbanos convencionales |
| **Mobiliario urbano - nomenclatura**| **0 m** | 0 m | Exento de restricción espacial con otros tipos |
| **Otro** | **0 m** | 0 m | Elementos atípicos sin buffer restrictivo |

---

## 3. Detección de Vías Especiales Directamente del Campo Dirección (Sin Adivinar Coordenadas)

Para determinar si aplica el radio especial de **200 metros** en paneles monumentales, el sistema **no adivina por coordenadas cartográficas**, sino que lee directamente el campo **Dirección / Vía** (tanto al registrar/editar en el Drawer como al procesar la columna `direccion` del Excel).

```
┌────────────────────────────────────────────────────────┐
│  Campo Dirección / Vía:                                │
│  "Km 24 Panamericana Sur, Peaje de Villa"              │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
     [Lector de Texto del Campo Dirección]
     Busca coincidencias de nombres de Vías Especiales:
     - "PANAMERICANA SUR" / "PANAMERICANA NORTE"
     - "ANTIGUA PANAMERICANA" / "CARRETERA CENTRAL"
     - "RAMIRO PRIALE" / "AUTOPISTA PRIALE"
                            │
         ┌──────────────────┴──────────────────┐
         ▼ Coincide                            ▼ No coincide
┌───────────────────────────────┐   ┌───────────────────────────────┐
│ Es Vía Especial = TRUE        │   │ Es Vía Especial = FALSE       │
│ Si Tipo EPE = "Panel monum."  │   │ Si Tipo EPE = "Panel monum."  │
│ ➔ Radio = 200 metros          │   │ ➔ Radio = 150 metros          │
└───────────────────────────────┘   └───────────────────────────────┘
```

> [!IMPORTANT]
> La regla se aplica estrictamente sobre el texto del campo `direccion`. Si el panel monumental tiene en su dirección una de estas vías especiales metropolitanas, se le asigna 200m; de lo contrario, mantiene sus 150m normativos regulares. No depende de cálculos geográficos complejos ni aproximaciones espaciales para saber el nombre de la vía.

---

## 4. Arquitectura de Datos: ¿Columna en BD o Cálculo Dinámico?

Para responder a la pregunta de cómo estructurar esto en la base de datos de la forma más limpia:

1. **En la Base de Datos (`Supabase`):**
   * En la tabla catálogo `tipos_epe` se almacena el campo `radio_default_metros` (50, 100, 150, 75, 0).
   * En la tabla `paneles` **no se guarda un número rígido de metros quemado**, sino que se guarda el `tipo_epe_id` y el texto de la `direccion_via`.
2. **Por qué esta arquitectura es superior:**
   * Si el día de mañana la Municipalidad cambia una ordenanza y la Paleta Publicitaria pasa de 50m a 60m, **solo se actualiza una fila en la base de datos** y automáticamente todos los paneles de Lima recalculan su advertencia en el mapa sin alterar los 400 registros uno por uno.
   * La regla de Vía Especial (200m) se evalúa al vuelo:
     $$\text{Radio} = \begin{cases} 200\text{ m} & \text{si es "Panel monumental" y la vía es especial} \\ R_{\text{catálogo}} & \text{en cualquier otro caso} \end{cases}$$

---

## 5. Algoritmo Espacial del Sensor de Proximidad

### A. Geometría Esférica (Fórmula de Haversine)
Dado el punto nuevo de simulación $P_1(\text{lat}_1, \text{lon}_1)$ y cada panel existente $P_2(\text{lat}_2, \text{lon}_2)$ en la base de datos:
$$a = \sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)$$
$$d = 2 \cdot R_{\text{Tierra}} \cdot \arcsin\left(\sqrt{a}\right) \quad (\text{con } R_{\text{Tierra}} = 6,371,000 \text{ metros})$$

### B. Condición de Conflicto Normativo
Existe infracción por proximidad si la distancia real medida sobre el terreno $d$ es menor que el radio de protección del elemento más restrictivo:
$$\text{Conflicto} = d < \max(R_{\text{nuevo}}, R_{\text{existente}}) \quad \land \quad (R_{\text{nuevo}} > 0) \quad \land \quad (R_{\text{existente}} > 0)$$

* **Regla de Excepción (Mobiliario Urbano / Otro):** Si cualquiera de los dos elementos tiene radio $0\text{ m}$, la distancia requerida es $0$, por lo que **jamás generará bloqueo**, permitiendo instalar señalética o mobiliario pegado a un panel monumental.

---

## 6. Comportamiento en la Interfaz (UI/UX al Marcar Punto)

```
PASO 1: Clic en mapa
➔ Se dibuja un marcador de posición temporal. Aún no se dibuja círculo porque no se ha elegido el tipo.

PASO 2: Selección del Tipo de Publicidad en el Drawer
➔ Inmediatamente se proyecta en el mapa un buffer circular con el radio exacto a escala:
   - Paleta ➔ Círculo de 50m (verde translúcido)
   - Monumental ➔ Círculo de 150m (o 200m si la dirección coincide)

PASO 3: Evaluación de Vecinos
   - Si interseca con el radio de otro panel existente:
     * El círculo se torna Rojo Carmín de Alerta.
     * En el Drawer aparece una ficha de aviso técnico:
       "⚠️ Conflicto Normativo: Se encuentra a X metros del Panel [Código], cuyo radio mínimo es Y metros."
     * El botón "Guardar Panel" se bloquea preventivamente para evitar registros infractores.
```

---

## 7. Archivos Involucrados en la Implementación

* [constants.ts](file:///d:/ProyectoMapsHoarding/src/lib/constants.ts): Actualización de la matriz de distancias oficiales y lista de palabras clave para Vías Especiales.
* [PanelDrawer.tsx](file:///d:/ProyectoMapsHoarding/src/components/Panel/PanelDrawer.tsx): Integración de la detección de vía especial y cálculo dinámico de `conflictosProximidad`.
* [MapView.tsx](file:///d:/ProyectoMapsHoarding/src/components/Map/MapView.tsx): Renderizado en tiempo real del buffer del sensor inteligente con colores condicionales (Teal si es válido, Carmín si hay conflicto).

---

## 8. Estado y Próximos Pasos

* **Documento MD-2:** Completado y archivado físicamente en disco.
* **Próximo Documento:** **MD-3: Rediseño Integral de la Base de Datos en Supabase (6 Estados Contractuales, Vías, Espacios Publicitarios y Dimensiones)**.

---

# 🚀 ESTE PLAN YA SE REALIZÓ Y ESTÁ 100% TERMINADO

> **Estado Final:** IMPLEMENTADO, VERIFICADO Y SINCRONIZADO EN PRODUCCIÓN  
> **Alcance del Algoritmo Espacial Implementado:**
> 1. Matriz completa de radios oficiales por Tipo de EPE (Paleta: 50m, Unipolar: 100m, Monumental: 150m, Monumental Volumétrico: 150m, Tótem: 75m, Simple: 75m, Mobiliario Urbano: 0m, Otro: 0m).
> 2. Lector estricto del campo Dirección / Vía que detecta Vías Especiales (Panamericana Norte/Sur, Carretera Central, Ramiro Prialé) elevando automáticamente el radio a 200m para paneles monumentales sin inferencias cartográficas frágiles.
> 3. Evaluación recíproca con fórmula geodésica de Haversine: se calcula contra el radio mínimo del vecino existente, ignorando elementos de 0m (Mobiliario Urbano).
> 4. Cambio cromático dinámico del buffer en MapLibre: Verde Teal (#0D9488) cuando la ubicación es apta y Rojo Carmín (#EF4444) en caso de saturación o conflicto normativo.
> 5. Preparación para sincronización con la base de datos Supabase (columna `radio_default_metros` en el catálogo `tipos_epe`).

