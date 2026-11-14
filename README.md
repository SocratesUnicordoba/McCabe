# Analizador de Complejidad Ciclomática (McCabe)

Aplicación web, hecha solo con HTML, CSS y JavaScript, que mide la **complejidad ciclomática de McCabe** de un programa. Construye el **grafo de flujo de control** de cada función, calcula V(G) de tres formas equivalentes y genera los **caminos independientes** (el número mínimo de casos de prueba). Está pensada para enseñar y aprender: incluye un recorrido guiado y un modo práctica.

No necesita servidor, instalación ni conexión a internet.

---

## Cómo usarla

1. Abre `index.html` en un navegador moderno (Chrome, Edge, Firefox o Safari).
2. Carga el código de alguna de estas formas:
   - arrastra uno o varios archivos a la zona de carga (o haz clic en ella);
   - pulsa **Pegar código** y escríbelo o pégalo en el editor;
   - elige un programa del menú **Cargar un ejemplo…**.
3. Revisa la tabla de resultados y selecciona una función para ver su detalle.

El análisis se actualiza solo mientras escribes. El lenguaje se detecta por la extensión del archivo o por el contenido, y también se puede elegir a mano.

**Idioma:** el botón 🌐 cambia entre español e inglés. Para abrir directamente en inglés, agrega `?lang=en` a la dirección:

```
index.html?lang=en
```

---

## Funcionalidades

### Resultados
- Resumen con el número de funciones y el V(G) total, promedio y máximo.
- Distribución de las funciones por nivel de riesgo.
- Tabla ordenable con el archivo, la función, las líneas, N (nodos), E (aristas), P (nodos predicado), V(G) y el riesgo.
- Exportación a CSV (separador `;`, compatible con Excel).

### Detalle de cada función
- **Las tres fórmulas**, con los valores reales de la función:
  - `V(G) = E − N + 2`
  - `V(G) = P + 1`
  - `V(G) = R` (regiones)
- **Grafo de flujo** con los nodos numerados: los círculos son bloques de sentencias, los rombos son decisiones, las aristas llevan las etiquetas V/F y las líneas discontinuas son los retornos de bucle. Tiene zoom y se puede descargar como SVG.
- **Código fuente** con las líneas de decisión resaltadas y el número de nodo correspondiente.
- **Nodos predicado**: lista de las decisiones, con lo que aporta cada una.
- **Caminos independientes**: un conjunto básico de caminos, obtenido con el método de la línea base de McCabe. El botón ▶ anima cada camino sobre el grafo.
- **Tabla de nodos**: alternativa en texto al grafo.

### Herramientas didácticas
- **Recorrido guiado** de 9 pasos: grafo → N → E → P → E − N + 2 → P + 1 → regiones → caminos → interpretación. Cada paso resalta en el grafo lo que explica.
- **Modo práctica**: oculta los resultados para que el estudiante calcule V(G). Da pistas progresivas cuando la respuesta es incorrecta y lleva la cuenta de las funciones resueltas.
- Ventana **Teoría**, con las fórmulas, qué cuenta como decisión, un ejemplo y la tabla de riesgo.
- Ventana **Lenguajes**, con lo que se reconoce en cada lenguaje.

### Evaluación del software (usabilidad ISO/IEC 25010:2011)
El botón **📝 Evaluación del software** de la cabecera equivale a la «Evaluación Simulador» de [DeltaT](https://socratesunicordoba.github.io/DeltaT/). Usa el mismo instrumento y el mismo cálculo:

- **24 ítems en escala Likert de 5 puntos**: 1 = Totalmente en desacuerdo … 5 = Totalmente de acuerdo.
- **7 dimensiones de usabilidad**:

  | Dimensión | Ítems |
  |---|---|
  | Reconocimiento de la adecuación | Q1–Q2 |
  | Capacidad de aprendizaje | Q3–Q6 |
  | Operabilidad | Q7–Q9 |
  | Protección frente a errores | Q10–Q14 |
  | Estética | Q15–Q20 |
  | Accesibilidad | Q21 |
  | Satisfacción | Q22–Q24 |

- **Ítems invertidos**: Q3, Q6, Q9 y Q14 están redactados en sentido negativo y se invierten (6 − x) antes de promediar.
- **Score** = (Media − 1) / 4 × 100, por dimensión y global. Niveles: **Alto ≥ 70 %**, **Moderado 50–69 %** y **Bajo < 50 %**.
- **Identificación del evaluador**: nombre (obligatorio), materia, carrera, grupo y semestre. El semestre se calcula a partir de la fecha. Los datos se conservan mientras la pestaña siga abierta.
- **Validaciones**: indica qué ítems faltan, con enlaces a cada uno, y los resalta.
- **Informe .txt descargable** (`informe-usabilidad-<nombre>-<fecha>.txt`). Incluye la fecha, los datos del evaluador, el resumen del análisis (archivos, funciones y V(G) máximo), el instrumento, las respuestas originales y ajustadas, y los resultados por dimensión y globales.

Los ítems y el cálculo están en `js/evaluacion.js`.

### Opción de conteo
La casilla **Contar condiciones compuestas** decide cómo se tratan `&&`, `||`, `and`, `or` y `??`:
- **Activada (McCabe extendido)**: cada condición simple es un nodo predicado, así que `if (a && b)` suma 2.
- **Desactivada (McCabe clásico)**: cada sentencia de control cuenta 1.

---

## Interpretación del riesgo

| V(G)    | Riesgo   | Evaluación                              |
|---------|----------|-----------------------------------------|
| 1 – 10  | Bajo     | Programa simple, sin mucho riesgo       |
| 11 – 20 | Moderado | Más complejo, riesgo moderado           |
| 21 – 50 | Alto     | Complejo, alto riesgo                   |
| > 50    | Muy alto | Programa no testeable, riesgo muy alto  |

---

## Lenguajes soportados

| Lenguaje | Extensiones | Qué se analiza | Decisiones reconocidas |
|---|---|---|---|
| **JavaScript / TypeScript** (incluye JSX y TSX) | `.js .mjs .cjs .jsx .ts .tsx` | Funciones declaradas y anónimas, funciones flecha con cuerpo, métodos, getters/setters y código de nivel superior | `if`, `else if`, `for`, `for…of`, `for…in`, `while`, `do…while`, `case`, `catch`, `?:`, `&&`, `\|\|`, `??` |
| **Java** | `.java` | Métodos, constructores, métodos genéricos y lambdas con cuerpo | `if`, `for`, for mejorado, `while`, `do…while`, `case` (clásico y `->`), `catch`, `?:`, `&&`, `\|\|` |
| **C / C++** | `.c .h .cpp .cc .cxx .hpp .hh` | Funciones, `Clase::metodo`, constructores con lista de inicialización, destructores, operadores y lambdas | `if`, `for`, `while`, `do…while`, `case`, `catch`, `?:`, `&&`, `\|\|` |
| **C#** | `.cs` | Métodos, constructores, funciones locales y lambdas con cuerpo | `if`, `for`, `foreach`, `while`, `do…while`, `case`, `catch` (y `when`), `?:`, `??`, `&&`, `\|\|` |
| **PHP** | `.php` | Funciones, métodos, closures con `use` y código de nivel superior | `if`, `elseif`, `for`, `foreach`, `while`, `do…while`, `case`, `catch`, `?:`, `??`, `and`, `or`, `&&`, `\|\|` |
| **Go** | `.go` | Funciones, métodos con receptor y funciones anónimas | `if` (con inicialización), `for` (todas sus formas y `range`), `case` de `switch`, type switch y `select`, `&&`, `\|\|` |
| **Python** | `.py .pyw` | `def`, `async def`, métodos (`Clase.metodo`), funciones anidadas y código del módulo | `if`, `elif`, `for`, `while` (también con `else`), `except`, `case` de `match`, `x if c else y`, `for` e `if` de comprensiones, `and`, `or` |

En todos los lenguajes:
- cada función se mide por separado, y las funciones anidadas y las lambdas con cuerpo tienen su propio V(G);
- los comentarios, las cadenas y las directivas de preprocesador se ignoran;
- `else`, `default` y `finally` no suman.

**Sin soporte por ahora:** Ruby, Kotlin, Swift, Rust, Scala, Visual Basic, Pascal/Delphi, COBOL y SQL/PL-SQL. Los lenguajes con sintaxis parecida a C (Kotlin, Dart, Swift) pueden analizarse de forma aproximada eligiendo Java o JavaScript a mano.

---

## Cómo funciona por dentro

```
código fuente
   │  lexer.js     → tokens (sin comentarios ni cadenas)
   ▼
tokens
   │  parsers.js   → detecta funciones y construye el árbol de sentencias
   ▼
árbol (if, while, for, switch, try, return, …)
   │  cfg.js       → grafo de flujo de control + métricas + caminos
   ▼
grafo  N, E, P, V(G)
   │  grafo.js     → disposición por capas y dibujo SVG
   ▼
app.js             → interfaz, recorrido guiado, modo práctica
```

- **Grafo de flujo**: las sentencias secuenciales se agrupan en un solo nodo. Cada condición es un nodo predicado. Una condición compuesta se divide en una cadena de nodos (evaluación en cortocircuito). Un `switch` con *k* salidas aporta *k − 1*.
- **Métricas**: `V(G) = E − N + 2`, y se verifica con `P + 1`, donde P suma (salidas − 1) de cada nodo de decisión. Si las dos fórmulas no coinciden, la interfaz lo advierte (por ejemplo, cuando hay código inalcanzable).
- **Caminos independientes**: se parte del camino más corto entre el inicio y el fin (la línea base) y, para cada decisión, se invierte una salida a la vez.
- **Dibujo**: disposición en capas tipo Sugiyama, implementada sin librerías: capas por camino más largo, ordenamiento por baricentro y nodos virtuales para las aristas largas. Las aristas de retorno se trazan por la derecha.

---

## Estructura del proyecto

```
McCabe/
├── index.html         Página principal
├── README.md          Este documento
├── css/
│   └── estilos.css    Estilos, tema claro/oscuro y diseño responsivo
└── js/
    ├── i18n.js        Textos en español e inglés y descripción de lenguajes
    ├── lexer.js       Analizador léxico y detección de lenguaje
    ├── parsers.js     Parsers de la familia C y de Python
    ├── cfg.js         Grafo de flujo, métricas, caminos y riesgo
    ├── grafo.js       Disposición y dibujo SVG del grafo
    ├── ejemplos.js    Programas de ejemplo (JS, Python, Java, C)
    ├── app.js         Interfaz de usuario
    └── evaluacion.js  Evaluación del software (ISO/IEC 25010:2011, 24 ítems Likert)
```

Los scripts son archivos JavaScript clásicos, no módulos, y comparten el espacio de nombres global `window.McC`. Por eso la aplicación funciona abriendo el archivo directamente (`file://`).

---

## Accesibilidad

- Enlace «Saltar al contenido principal» y estructura de puntos de referencia (`header`, `main`, secciones con título).
- Región `aria-live` que anuncia los resultados del análisis, la función seleccionada, el camino reproducido y el cambio de idioma.
- **Grafo navegable con teclado**: Tab entra en el grafo, las flechas recorren los nodos en orden, Inicio/Fin saltan al primero o al último, Enter lee el nodo y Escape sale. Cada nodo tiene una descripción completa (número, tipo, línea, contenido y salidas).
- Tabla de nodos como alternativa en texto al grafo.
- Ordenación de la tabla con botones y estado `aria-sort`.
- Etiquetas en todos los controles, foco visible y diálogos nativos (`<dialog>`) con su botón de cierre.
- Colores de riesgo con contraste AA sobre texto blanco. El riesgo siempre aparece también como texto.
- Respeta `prefers-reduced-motion`, que desactiva las animaciones, y el modo de alto contraste de Windows (`forced-colors`).
- Atributo `lang` del documento actualizado al cambiar de idioma.

---

## Diseño responsivo

- **Escritorio**: panel de entrada y resultados lado a lado, y el detalle a todo el ancho.
- **Tableta (< 1100 px)**: el detalle pasa a una sola columna.
- **Móvil (< 640 px)**: cabecera compacta con iconos, columnas secundarias ocultas en la tabla, botones más grandes para el tacto y sin desplazamiento horizontal.
- Tema claro y oscuro (sigue al sistema; el botón ◐ lo cambia y la elección se recuerda).

### Colores institucionales · Universidad de Córdoba
Tomados del *Manual de Identidad Visual Corporativa Unicórdoba 2018*:

| Color | RGB | Hex | Uso en la aplicación |
|---|---|---|---|
| Verde institucional | 88, 145, 81 | `#589151` | Franja superior, logo, barras de progreso y de score, nodo activo del recorrido |
| Café (bandera) | 118, 72, 61 | `#76483D` | Botón «Evaluación del software», línea bajo la franja y resaltado de nodos |
| Negro | 32, 30, 30 | `#201E1E` | Color del texto |

El texto blanco sobre el verde oficial tiene un contraste de 3,8:1, inferior al 4,5:1 que exige WCAG AA. Por eso los botones y los textos verdes usan un tono más oscuro del mismo verde (`#477C43`, contraste 5:1). En el tema oscuro se usa un verde claro (`#8CC683`). Los tokens están al inicio de `css/estilos.css` (`--brand`, `--brand-cafe`, `--brand-negro`).

---

## Limitaciones

- Es un análisis **estático y heurístico**: no compila ni ejecuta el código, así que construcciones muy poco comunes pueden interpretarse mal.
- No se modela `goto`.
- Un `throw` se dirige al nodo final (no al `catch`). Esto no cambia el valor de V(G).
- PHP: no se soporta la sintaxis alternativa (`if: … endif;`), y el operador abreviado `?:` (Elvis) no se cuenta.
- Las lambdas sin llaves (por ejemplo `x => x > 0 ? 1 : 2`) cuentan dentro de la función que las contiene.

---

## Personalización

**Agregar un ejemplo**: añade un objeto `{ name, lang, src }` al arreglo `McC.EJEMPLOS` en `js/ejemplos.js`.

**Agregar o modificar textos**: edita los diccionarios `ES` y `EN` en `js/i18n.js`. En el HTML, los textos se vinculan con estos atributos:
- `data-i18n` (texto)
- `data-i18n-html` (HTML)
- `data-i18n-aria` (`aria-label`)
- `data-i18n-title` (`title`)
- `data-i18n-ph` (`placeholder`)

**Agregar un lenguaje con sintaxis tipo C**:
1. Regístralo en `McC.LANGS` y en `McC.EXT` (`js/lexer.js`), con sus opciones:
   - `line`: comentarios de línea;
   - `asi`: punto y coma opcional;
   - `parenless`: condiciones sin paréntesis;
   - `noFall`: `case` sin continuación implícita;
   - `wordOps`: operadores `and`/`or`.
2. Añade su descripción en `McC.LANG_INFO` (`js/i18n.js`).

---

## Autores

- Daniel José Salas Álvarez M. Sc.
- Pierre Augusto Peña salgado M. Sc.

Universidad de Córdoba · Montería, Colombia

---

## Referencias

- McCabe, T. J. (1976). *A Complexity Measure*. IEEE Transactions on Software Engineering, SE-2(4), 308–320.
- Juncotic. *Complejidad ciclomática*. https://juncotic.com/complejidad-ciclomatica/
