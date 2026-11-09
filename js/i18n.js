/* =========================================================================
 * Internacionalización (español / inglés)
 * ========================================================================= */
(function () {
  'use strict';
  const McC = (window.McC = window.McC || {});

  const ES = {
    'doc.title': 'Analizador McCabe',
    'skip': 'Saltar al contenido principal',
    'app.title': 'Analizador de Complejidad Ciclomática',
    'app.subtitle': 'Métrica de McCabe · grafo de flujo · caminos independientes',
    'btn.theory': 'Teoría',
    'btn.langs': 'Lenguajes',
    'btn.theme': 'Cambiar entre tema claro y oscuro',
    'btn.lang': 'EN',
    'btn.lang.aria': 'Switch to English',
    'close': 'Cerrar',

    'in.title': 'Cargar programa',
    'in.drop': 'Arrastra archivos aquí o haz clic para elegirlos',
    'in.dropHint': 'Con teclado: Tab hasta aquí y pulsa Enter',
    'in.examples': 'Cargar un ejemplo…',
    'in.examples.aria': 'Programas de ejemplo',
    'in.paste': 'Pegar código',
    'in.files': 'Archivos cargados',
    'in.remove': 'Quitar {name}',
    'in.lang': 'Lenguaje',
    'in.auto': 'Detectar automáticamente',
    'in.detected': 'Detectado: {lang}',
    'in.editor': 'Código fuente',
    'in.editor.ph': 'Pega aquí tu código fuente…',
    'in.editor.help': 'El análisis se actualiza solo mientras escribes.',
    'in.logical': 'Contar condiciones compuestas (&&, ||, and, or, ??) como decisiones',
    'in.logical.help': 'McCabe extendido: cada condición simple dentro de una compuesta es un nodo predicado.',
    'in.practice': 'Modo práctica: ocultar los resultados para calcularlos yo',
    'in.practice.help': 'Ideal para estudiar: intenta calcular V(G) antes de ver la solución.',
    'in.analyze': 'Analizar complejidad',
    'in.supported': 'Lenguajes soportados',
    'in.supported.more': 'ver detalles',

    'res.title': 'Resultados',
    'res.csv': 'Exportar CSV',
    'res.empty': 'Carga un archivo, pega código o elige un ejemplo para comenzar.',
    'res.none': 'No se encontraron funciones para analizar.',
    'res.error': 'Error en {file}: {msg}',
    'res.functions': 'funciones en {n} archivo(s)',
    'res.total': 'V(G) total',
    'res.avg': 'V(G) promedio',
    'res.max': 'máximo · {name}',
    'res.dist': 'Distribución de funciones por nivel de riesgo',
    'res.caption': 'Complejidad por función. Elige una función para ver su detalle.',
    'res.practice': 'Modo práctica activo: resuelve cada función para ver sus resultados.',
    'res.solved': '{a} de {b} resueltas',
    'res.sortBy': 'Ordenar por {col}',
    'res.hidden': 'Oculto',
    'th.file': 'Archivo',
    'th.fn': 'Función / módulo',
    'th.lines': 'Líneas',
    'th.N': 'N', 'th.N.t': 'Nodos',
    'th.E': 'E', 'th.E.t': 'Aristas',
    'th.P': 'P', 'th.P.t': 'Nodos predicado',
    'th.V': 'V(G)', 'th.V.t': 'Complejidad ciclomática',
    'th.risk': 'Riesgo',

    'risk.bajo': 'Bajo', 'risk.moderado': 'Moderado', 'risk.alto': 'Alto', 'risk.muyalto': 'Muy alto',
    'risk.bajo.d': 'Programa simple, sin mucho riesgo',
    'risk.moderado.d': 'Más complejo, riesgo moderado',
    'risk.alto.d': 'Complejo, alto riesgo',
    'risk.muyalto.d': 'Programa no testeable, riesgo muy alto',
    'risk.bajo.r': '1–10 bajo', 'risk.moderado.r': '11–20 moderado', 'risk.alto.r': '21–50 alto', 'risk.muyalto.r': '>50 muy alto',

    'det.meta': '{file} · {lang} · líneas {a}–{b}',
    'f.edges': 'Por aristas y nodos',
    'f.preds': 'Por nodos predicado',
    'f.regions': 'Por regiones',
    'f.regionsTxt': '{c} región(es) cerrada(s) + 1 exterior',
    'det.interp': '{desc}. Se necesitan como mínimo <strong>{v}</strong> caso(s) de prueba para recorrer todos los caminos independientes.',
    'det.warn': 'Atención: las fórmulas no coinciden (hay código inalcanzable o un bucle sin salida).',

    'tour.title': 'Recorrido guiado: ¿cómo se calcula V(G)?',
    'tour.step': 'Paso {i} de {n}',
    'tour.prev': 'Anterior', 'tour.next': 'Siguiente', 'tour.restart': 'Reiniciar',
    'tour.s0.t': 'El grafo de flujo',
    'tour.s0.d': 'El código de <code>{name}</code> se ha convertido en un grafo dirigido. Cada <b>nodo</b> es un bloque de sentencias que se ejecutan seguidas, o una condición. Cada <b>arista</b> (flecha) es un posible salto del control. Avanza para calcular la complejidad paso a paso.',
    'tour.s1.t': '1. Contar los nodos (N)',
    'tour.s1.d': 'Hay <b>N = {N}</b> nodos: {blocks} bloque(s) de sentencias, {preds} nodo(s) predicado (rombos) y los nodos de inicio y fin. Están resaltados en el grafo.',
    'tour.s2.t': '2. Contar las aristas (E)',
    'tour.s2.d': 'Hay <b>E = {E}</b> aristas. Las azules discontinuas vuelven al comienzo de un bucle: también cuentan.',
    'tour.s3.t': '3. Encontrar los nodos predicado (P)',
    'tour.s3.d': 'Un nodo predicado tiene dos o más salidas: <code>if</code>, <code>while</code>, <code>for</code>, <code>case</code>, <code>catch</code>, <code>?:</code> y cada parte de una condición compuesta con <code>&&</code> / <code>||</code>. Un nodo con <i>k</i> salidas aporta <i>k − 1</i>. Aquí <b>P = {P}</b>.',
    'tour.s4.t': '4. Primera fórmula: E − N + 2',
    'tour.s4.d': 'V(G) = E − N + 2 = {E} − {N} + 2 = <b>{V}</b>',
    'tour.s5.t': '5. Segunda fórmula: P + 1',
    'tour.s5.d': 'V(G) = P + 1 = {P} + 1 = <b>{VP}</b>. Da lo mismo que la anterior: las dos miden la misma propiedad del grafo.',
    'tour.s6.t': '6. Tercera fórmula: regiones (R)',
    'tour.s6.d': 'Si dibujas el grafo en un plano sin cruzar aristas, cada decisión encierra una región. Hay {c} región(es) cerrada(s) y la región exterior: <b>R = {V}</b>.',
    'tour.s7.t': '7. Caminos independientes',
    'tour.s7.d': 'V(G) = {V} es el número de caminos linealmente independientes, es decir, el <b>mínimo de casos de prueba</b> para ejecutar todas las decisiones. Resaltado: el camino base. Pulsa ▶ en la lista de caminos para ver cada uno recorriendo el grafo.',
    'tour.s8.t': '8. Interpretación',
    'tour.s8.d': 'Con V(G) = {V} el riesgo es <b>{risk}</b>: {desc}. Si V(G) pasa de 10, conviene dividir la función en funciones más pequeñas.',

    'g.title': 'Grafo de flujo de control',
    'g.zoomOut': 'Alejar', 'g.fit': 'Ajustar al ancho', 'g.zoomIn': 'Acercar',
    'g.svg': 'Descargar el grafo como SVG',
    'g.aria': 'Grafo de flujo de {name}: {N} nodos y {E} aristas. Usa las flechas para recorrer los nodos en orden.',
    'g.help': 'Pasa el cursor o usa Tab y las flechas sobre los nodos.',
    'lg.term': 'Inicio / fin', 'lg.block': 'Bloque de sentencias', 'lg.dec': 'Nodo predicado (decisión)', 'lg.back': 'Retorno de bucle',
    'node.aria': 'Nodo {num}, {kind}{line}: {label}. {out} salida(s).',
    'node.line': ', línea {line}',
    'node.start': 'Inicio', 'node.end': 'Fin', 'node.branch': 'rama de {op}',
    'edge.other': 'otro',
    'kind.start': 'Inicio', 'kind.end': 'Fin', 'kind.block': 'Bloque', 'kind.decision': 'Predicado', 'kind.join': 'Unión',
    'cap.start': 'inicio', 'cap.end': 'fin',

    'code.title': 'Código fuente',
    'code.hint': 'Resaltadas: líneas con decisiones',
    'pred.title': 'Nodos predicado',
    'pred.info': 'línea {line} · {out} salidas · aporta +{w}',
    'pred.none': 'Sin decisiones: un único camino secuencial.',
    'path.title': 'Caminos independientes (casos de prueba)',
    'path.count': '{n} de V(G) = {v}',
    'path.base': 'camino base',
    'path.flip': 'invierte la decisión del nodo {n}{lab}',
    'path.play': 'Reproducir el camino {i}',
    'path.playing': 'Camino {i}: {seq}',
    'nodes.title': 'Tabla de nodos (alternativa textual del grafo)',
    'nodes.num': '#', 'nodes.kind': 'Tipo', 'nodes.line': 'Línea', 'nodes.content': 'Contenido', 'nodes.out': 'Salidas',
    'locked': 'Resuelve el ejercicio de arriba para ver esta sección.',

    'q.title': 'Ponte a prueba',
    'q.ask': 'Mira el código y el grafo de <code>{name}</code>. ¿Cuál es su complejidad ciclomática V(G)?',
    'q.label': 'Tu respuesta para V(G)',
    'q.check': 'Comprobar',
    'q.reveal': 'Ver la solución',
    'q.ok': '¡Correcto! V(G) = {v}.',
    'q.invalid': 'Escribe un número entero mayor o igual que 1.',
    'q.low': 'Te quedaste corto.',
    'q.high': 'Te pasaste.',
    'q.hint1': 'Pista: cuenta los puntos de decisión (if, while, for, case, catch, ?:, &&, ||) y suma 1.',
    'q.hint2': 'Otra pista: en el grafo cuenta las aristas (E) y los nodos (N) y aplica E − N + 2.',
    'q.hint3': 'Última pista: el grafo tiene {N} nodos y {E} aristas.',

    'live.done': 'Análisis completado: {n} funciones. V(G) máximo {max}, en {name}.',
    'live.donePractice': 'Análisis completado: {n} funciones. Modo práctica activo.',
    'live.select': '{name}: V(G) = {v}, riesgo {risk}.',
    'live.selectHidden': '{name} seleccionada. Calcula su V(G).',
    'live.lang': 'Idioma cambiado a español.',
    'live.loaded': 'Archivo cargado: {name}.',

    'unit.main': '(código principal)', 'unit.anon': '(anónima)', 'unit.arrow': '(flecha)',
    'paste.name': 'codigo-{n}',

    'langs.title': 'Lenguajes soportados',
    'langs.intro': 'El analizador reconoce estos 7 lenguajes (11 dialectos y variantes). Se detectan por la extensión del archivo o, si pegas código, por su contenido. También puedes elegir el lenguaje a mano en el selector.',
    'langs.ext': 'Extensiones',
    'langs.units': 'Qué se analiza',
    'langs.dec': 'Decisiones reconocidas',
    'langs.notes': 'Observaciones',
    'langs.common': 'En todos: cada función se mide por separado (las funciones anidadas y lambdas con cuerpo tienen su propio V(G)). Los comentarios, las cadenas y las directivas de preprocesador se ignoran.',
    'langs.not': '<b>Sin soporte por ahora:</b> Ruby, Kotlin, Swift, Rust, Scala, Visual Basic, Pascal/Delphi, COBOL y SQL/PL-SQL. Los lenguajes con sintaxis parecida a C (Kotlin, Dart, Swift) pueden analizarse de forma aproximada eligiendo Java o JavaScript a mano.',

    'theory.title': 'Complejidad ciclomática de McCabe',
    'theory.html': `
      <p>La propuso Thomas McCabe en 1976. Mide el número de <strong>caminos linealmente independientes</strong> que hay en el código
      de un programa. Se calcula sobre su <strong>grafo de flujo de control</strong>: los nodos son bloques de sentencias o condiciones,
      y las aristas son los saltos posibles del control entre ellos.</p>
      <h3>Tres formas equivalentes de calcularla</h3>
      <ul>
        <li><strong>V(G) = E − N + 2</strong>: E aristas y N nodos del grafo.</li>
        <li><strong>V(G) = P + 1</strong>: P nodos predicado (condiciones). Un <code>switch</code> con <em>k</em> salidas aporta <em>k − 1</em>.</li>
        <li><strong>V(G) = R</strong>: número de regiones del grafo dibujado en un plano (incluida la exterior).</li>
      </ul>
      <h3>¿Qué cuenta como decisión?</h3>
      <p><code>if</code>, <code>else if</code>/<code>elif</code>, <code>while</code>, <code>for</code>/<code>foreach</code>, <code>do…while</code>,
      cada <code>case</code>, <code>catch</code>/<code>except</code> y el ternario <code>?:</code>. Si la opción está activa, también cada
      <code>&amp;&amp;</code>, <code>||</code>, <code>and</code>, <code>or</code> y <code>??</code>: en una condición compuesta, cada condición simple es un nodo predicado.
      <code>else</code>, <code>default</code> y <code>finally</code> no suman.</p>
      <h3>Ejemplo</h3>
      <pre><code>if (a &gt; 0 &amp;&amp; b &gt; 0) { x = 1; }   // if + &amp;&amp;  → 2 decisiones
while (i &lt; n) { i++; }            // while     → 1 decisión
                                  // V(G) = 3 + 1 = 4</code></pre>
      <h3>Interpretación</h3>
      <table class="tabla compacta riesgo-tabla">
        <caption class="sr-only">Niveles de riesgo según V(G)</caption>
        <thead><tr><th scope="col">V(G)</th><th scope="col">Evaluación del riesgo</th></tr></thead>
        <tbody>
          <tr><td>1 – 10</td><td><span class="pill r-bajo">Bajo</span> Programa simple, sin mucho riesgo</td></tr>
          <tr><td>11 – 20</td><td><span class="pill r-moderado">Moderado</span> Más complejo, riesgo moderado</td></tr>
          <tr><td>21 – 50</td><td><span class="pill r-alto">Alto</span> Complejo, alto riesgo</td></tr>
          <tr><td>&gt; 50</td><td><span class="pill r-muyalto">Muy alto</span> Programa no testeable, riesgo muy alto</td></tr>
        </tbody>
      </table>
      <h3>Para qué sirve</h3>
      <p>V(G) es el <strong>número mínimo de casos de prueba</strong> que necesitas para recorrer todos los caminos independientes
      (técnica de prueba del camino básico). Esta herramienta los genera con el método de la línea base: parte de un camino
      y va invirtiendo una decisión cada vez.</p>
      <p class="muted small">Nota: es un análisis estático y heurístico (no ejecuta el código). No se modelan los saltos <code>goto</code>
      ni las excepciones implícitas; un <code>throw</code> se dirige al nodo final.</p>`,
  };

  const EN = {
    'doc.title': 'McCabe Analyzer',
    'skip': 'Skip to main content',
    'app.title': 'Cyclomatic Complexity Analyzer',
    'app.subtitle': 'McCabe metric · control-flow graph · independent paths',
    'btn.theory': 'Theory',
    'btn.langs': 'Languages',
    'btn.theme': 'Toggle light / dark theme',
    'btn.lang': 'ES',
    'btn.lang.aria': 'Cambiar a español',
    'close': 'Close',

    'in.title': 'Load a program',
    'in.drop': 'Drop files here or click to choose them',
    'in.dropHint': 'Keyboard: Tab here and press Enter',
    'in.examples': 'Load an example…',
    'in.examples.aria': 'Example programs',
    'in.paste': 'Paste code',
    'in.files': 'Loaded files',
    'in.remove': 'Remove {name}',
    'in.lang': 'Language',
    'in.auto': 'Detect automatically',
    'in.detected': 'Detected: {lang}',
    'in.editor': 'Source code',
    'in.editor.ph': 'Paste your source code here…',
    'in.editor.help': 'The analysis updates as you type.',
    'in.logical': 'Count compound conditions (&&, ||, and, or, ??) as decisions',
    'in.logical.help': 'Extended McCabe: every simple condition inside a compound one is a predicate node.',
    'in.practice': 'Practice mode: hide the results so I can work them out',
    'in.practice.help': 'Great for studying: try to compute V(G) before seeing the answer.',
    'in.analyze': 'Analyze complexity',
    'in.supported': 'Supported languages',
    'in.supported.more': 'see details',

    'res.title': 'Results',
    'res.csv': 'Export CSV',
    'res.empty': 'Load a file, paste code or pick an example to start.',
    'res.none': 'No functions were found to analyze.',
    'res.error': 'Error in {file}: {msg}',
    'res.functions': 'functions in {n} file(s)',
    'res.total': 'Total V(G)',
    'res.avg': 'Average V(G)',
    'res.max': 'maximum · {name}',
    'res.dist': 'Functions by risk level',
    'res.caption': 'Complexity per function. Pick a function to see its details.',
    'res.practice': 'Practice mode on: solve each function to see its results.',
    'res.solved': '{a} of {b} solved',
    'res.sortBy': 'Sort by {col}',
    'res.hidden': 'Hidden',
    'th.file': 'File',
    'th.fn': 'Function / module',
    'th.lines': 'Lines',
    'th.N': 'N', 'th.N.t': 'Nodes',
    'th.E': 'E', 'th.E.t': 'Edges',
    'th.P': 'P', 'th.P.t': 'Predicate nodes',
    'th.V': 'V(G)', 'th.V.t': 'Cyclomatic complexity',
    'th.risk': 'Risk',

    'risk.bajo': 'Low', 'risk.moderado': 'Moderate', 'risk.alto': 'High', 'risk.muyalto': 'Very high',
    'risk.bajo.d': 'Simple program, little risk',
    'risk.moderado.d': 'More complex, moderate risk',
    'risk.alto.d': 'Complex, high risk',
    'risk.muyalto.d': 'Untestable program, very high risk',
    'risk.bajo.r': '1–10 low', 'risk.moderado.r': '11–20 moderate', 'risk.alto.r': '21–50 high', 'risk.muyalto.r': '>50 very high',

    'det.meta': '{file} · {lang} · lines {a}–{b}',
    'f.edges': 'From edges and nodes',
    'f.preds': 'From predicate nodes',
    'f.regions': 'From regions',
    'f.regionsTxt': '{c} closed region(s) + 1 outer',
    'det.interp': '{desc}. At least <strong>{v}</strong> test case(s) are needed to cover every independent path.',
    'det.warn': 'Warning: the formulas disagree (there is unreachable code or a loop with no exit).',

    'tour.title': 'Guided walkthrough: how is V(G) computed?',
    'tour.step': 'Step {i} of {n}',
    'tour.prev': 'Previous', 'tour.next': 'Next', 'tour.restart': 'Restart',
    'tour.s0.t': 'The control-flow graph',
    'tour.s0.d': 'The code of <code>{name}</code> has been turned into a directed graph. Each <b>node</b> is a block of statements that run one after another, or a condition. Each <b>edge</b> (arrow) is a possible jump of control. Move forward to compute the complexity step by step.',
    'tour.s1.t': '1. Count the nodes (N)',
    'tour.s1.d': 'There are <b>N = {N}</b> nodes: {blocks} statement block(s), {preds} predicate node(s) (diamonds), plus the start and end nodes. They are highlighted in the graph.',
    'tour.s2.t': '2. Count the edges (E)',
    'tour.s2.d': 'There are <b>E = {E}</b> edges. The dashed blue ones go back to the start of a loop: they count too.',
    'tour.s3.t': '3. Find the predicate nodes (P)',
    'tour.s3.d': 'A predicate node has two or more exits: <code>if</code>, <code>while</code>, <code>for</code>, <code>case</code>, <code>catch</code>, <code>?:</code> and each part of a compound condition with <code>&&</code> / <code>||</code>. A node with <i>k</i> exits adds <i>k − 1</i>. Here <b>P = {P}</b>.',
    'tour.s4.t': '4. First formula: E − N + 2',
    'tour.s4.d': 'V(G) = E − N + 2 = {E} − {N} + 2 = <b>{V}</b>',
    'tour.s5.t': '5. Second formula: P + 1',
    'tour.s5.d': 'V(G) = P + 1 = {P} + 1 = <b>{VP}</b>. Same result as before: both measure the same property of the graph.',
    'tour.s6.t': '6. Third formula: regions (R)',
    'tour.s6.d': 'If you draw the graph on a plane without crossing edges, each decision encloses a region. There are {c} closed region(s) plus the outer one: <b>R = {V}</b>.',
    'tour.s7.t': '7. Independent paths',
    'tour.s7.d': 'V(G) = {V} is the number of linearly independent paths, that is, the <b>minimum number of test cases</b> needed to exercise every decision. Highlighted: the baseline path. Press ▶ in the path list to watch each one travel through the graph.',
    'tour.s8.t': '8. Interpretation',
    'tour.s8.d': 'With V(G) = {V} the risk is <b>{risk}</b>: {desc}. If V(G) goes above 10, consider splitting the function into smaller ones.',

    'g.title': 'Control-flow graph',
    'g.zoomOut': 'Zoom out', 'g.fit': 'Fit to width', 'g.zoomIn': 'Zoom in',
    'g.svg': 'Download the graph as SVG',
    'g.aria': 'Control-flow graph of {name}: {N} nodes and {E} edges. Use the arrow keys to move through the nodes in order.',
    'g.help': 'Hover, or use Tab and the arrow keys on the nodes.',
    'lg.term': 'Start / end', 'lg.block': 'Statement block', 'lg.dec': 'Predicate node (decision)', 'lg.back': 'Loop back edge',
    'node.aria': 'Node {num}, {kind}{line}: {label}. {out} exit(s).',
    'node.line': ', line {line}',
    'node.start': 'Start', 'node.end': 'End', 'node.branch': '{op} branch',
    'edge.other': 'other',
    'kind.start': 'Start', 'kind.end': 'End', 'kind.block': 'Block', 'kind.decision': 'Predicate', 'kind.join': 'Join',
    'cap.start': 'start', 'cap.end': 'end',

    'code.title': 'Source code',
    'code.hint': 'Highlighted: lines with decisions',
    'pred.title': 'Predicate nodes',
    'pred.info': 'line {line} · {out} exits · adds +{w}',
    'pred.none': 'No decisions: a single sequential path.',
    'path.title': 'Independent paths (test cases)',
    'path.count': '{n} of V(G) = {v}',
    'path.base': 'baseline path',
    'path.flip': 'flips the decision at node {n}{lab}',
    'path.play': 'Play path {i}',
    'path.playing': 'Path {i}: {seq}',
    'nodes.title': 'Node table (text alternative to the graph)',
    'nodes.num': '#', 'nodes.kind': 'Type', 'nodes.line': 'Line', 'nodes.content': 'Content', 'nodes.out': 'Exits',
    'locked': 'Solve the exercise above to see this section.',

    'q.title': 'Test yourself',
    'q.ask': 'Look at the code and the graph of <code>{name}</code>. What is its cyclomatic complexity V(G)?',
    'q.label': 'Your answer for V(G)',
    'q.check': 'Check',
    'q.reveal': 'Show the answer',
    'q.ok': 'Correct! V(G) = {v}.',
    'q.invalid': 'Type a whole number greater than or equal to 1.',
    'q.low': 'Too low.',
    'q.high': 'Too high.',
    'q.hint1': 'Hint: count the decision points (if, while, for, case, catch, ?:, &&, ||) and add 1.',
    'q.hint2': 'Another hint: in the graph, count the edges (E) and nodes (N) and apply E − N + 2.',
    'q.hint3': 'Last hint: the graph has {N} nodes and {E} edges.',

    'live.done': 'Analysis complete: {n} functions. Highest V(G) is {max}, in {name}.',
    'live.donePractice': 'Analysis complete: {n} functions. Practice mode is on.',
    'live.select': '{name}: V(G) = {v}, {risk} risk.',
    'live.selectHidden': '{name} selected. Work out its V(G).',
    'live.lang': 'Language changed to English.',
    'live.loaded': 'File loaded: {name}.',

    'unit.main': '(main code)', 'unit.anon': '(anonymous)', 'unit.arrow': '(arrow)',
    'paste.name': 'code-{n}',

    'langs.title': 'Supported languages',
    'langs.intro': 'The analyzer understands these 7 languages (11 dialects and variants). They are detected from the file extension or, for pasted code, from the content. You can also pick the language by hand.',
    'langs.ext': 'Extensions',
    'langs.units': 'What is analyzed',
    'langs.dec': 'Recognized decisions',
    'langs.notes': 'Notes',
    'langs.common': 'In every language each function is measured separately (nested functions and lambdas with a body get their own V(G)). Comments, strings and preprocessor directives are ignored.',
    'langs.not': '<b>Not supported yet:</b> Ruby, Kotlin, Swift, Rust, Scala, Visual Basic, Pascal/Delphi, COBOL and SQL/PL-SQL. C-like languages (Kotlin, Dart, Swift) can be analyzed roughly by picking Java or JavaScript by hand.',

    'theory.title': 'McCabe cyclomatic complexity',
    'theory.html': `
      <p>Proposed by Thomas McCabe in 1976, it measures the number of <strong>linearly independent paths</strong> through a program's
      source code. It is computed on the <strong>control-flow graph</strong>: nodes are statement blocks or conditions, and edges are the
      possible transfers of control between them.</p>
      <h3>Three equivalent ways to compute it</h3>
      <ul>
        <li><strong>V(G) = E − N + 2</strong>: E edges and N nodes of the graph.</li>
        <li><strong>V(G) = P + 1</strong>: P predicate nodes (conditions). A <code>switch</code> with <em>k</em> exits adds <em>k − 1</em>.</li>
        <li><strong>V(G) = R</strong>: number of regions of the planar graph (including the outer one).</li>
      </ul>
      <h3>What counts as a decision?</h3>
      <p><code>if</code>, <code>else if</code>/<code>elif</code>, <code>while</code>, <code>for</code>/<code>foreach</code>, <code>do…while</code>,
      each <code>case</code>, <code>catch</code>/<code>except</code> and the ternary <code>?:</code>. With the option on, also every
      <code>&amp;&amp;</code>, <code>||</code>, <code>and</code>, <code>or</code> and <code>??</code>: in a compound condition each simple condition is a predicate node.
      <code>else</code>, <code>default</code> and <code>finally</code> do not add anything.</p>
      <h3>Example</h3>
      <pre><code>if (a &gt; 0 &amp;&amp; b &gt; 0) { x = 1; }   // if + &amp;&amp;  → 2 decisions
while (i &lt; n) { i++; }            // while     → 1 decision
                                  // V(G) = 3 + 1 = 4</code></pre>
      <h3>Interpretation</h3>
      <table class="tabla compacta riesgo-tabla">
        <caption class="sr-only">Risk levels by V(G)</caption>
        <thead><tr><th scope="col">V(G)</th><th scope="col">Risk evaluation</th></tr></thead>
        <tbody>
          <tr><td>1 – 10</td><td><span class="pill r-bajo">Low</span> Simple program, little risk</td></tr>
          <tr><td>11 – 20</td><td><span class="pill r-moderado">Moderate</span> More complex, moderate risk</td></tr>
          <tr><td>21 – 50</td><td><span class="pill r-alto">High</span> Complex, high risk</td></tr>
          <tr><td>&gt; 50</td><td><span class="pill r-muyalto">Very high</span> Untestable program, very high risk</td></tr>
        </tbody>
      </table>
      <h3>What it is for</h3>
      <p>V(G) is the <strong>minimum number of test cases</strong> needed to cover every independent path (basis path testing).
      This tool builds them with the baseline method: it starts from one path and flips one decision at a time.</p>
      <p class="muted small">Note: this is a static, heuristic analysis (the code is never run). <code>goto</code> jumps and implicit
      exceptions are not modeled; a <code>throw</code> goes straight to the end node.</p>`,
  };

  /* Descripción de cada lenguaje soportado */
  const LANG_INFO = {
    es: {
      js: { units: 'Funciones declaradas y anónimas, funciones flecha con cuerpo, métodos de clase y de objeto, getters/setters y el código de nivel superior del script.',
        dec: 'if / else if, for, for…of, for…in, while, do…while, case, catch, ?:, &&, ||, ??',
        notes: 'Incluye TypeScript, JSX y TSX. Admite código sin punto y coma.' },
      java: { units: 'Métodos, constructores, métodos genéricos y lambdas con cuerpo { }.',
        dec: 'if / else if, for, for mejorado, while, do…while, case (clásico y con ->), catch (incluido multi-catch), ?:, &&, ||',
        notes: 'Las clases anónimas e internas se recorren para encontrar sus métodos.' },
      c: { units: 'Funciones, métodos Clase::metodo, constructores con lista de inicialización, destructores, sobrecarga de operadores y lambdas.',
        dec: 'if / else if, for, while, do…while, case, catch (C++), ?:, &&, ||',
        notes: 'Las directivas #include, #define, etc. se ignoran. No se modela goto.' },
      cs: { units: 'Métodos, constructores (incluido : base(…)), funciones locales y lambdas con cuerpo.',
        dec: 'if / else if, for, foreach, while, do…while, case, catch (y catch … when), ?:, ??, &&, ||',
        notes: 'Los tipos anulables (int?) no se confunden con el ternario.' },
      php: { units: 'Funciones, métodos, closures con use (…) y el código de nivel superior.',
        dec: 'if / elseif / else if, for, foreach, while, do…while, case, catch, ?:, ??, &&, ||, and, or',
        notes: 'Se ignoran las etiquetas <?php ?>. No se soporta la sintaxis alternativa (if: … endif;) y el operador ?: abreviado no cuenta.' },
      go: { units: 'Funciones, métodos con receptor y funciones anónimas (go func, defer func).',
        dec: 'if (con inicialización), for (sus tres formas y range), case de switch, switch de tipos y select, &&, ||',
        notes: 'Los case no continúan al siguiente salvo con fallthrough explícito, como en Go.' },
      py: { units: 'def y async def, métodos (Clase.metodo), funciones anidadas y el código del módulo.',
        dec: 'if / elif, for, while (también con else), except, case de match, expresión condicional (x if c else y), for e if de las comprensiones, and, or',
        notes: 'Se basa en la indentación y admite continuación con \\ y paréntesis.' },
    },
    en: {
      js: { units: 'Function declarations and expressions, arrow functions with a body, class and object methods, getters/setters and top-level script code.',
        dec: 'if / else if, for, for…of, for…in, while, do…while, case, catch, ?:, &&, ||, ??',
        notes: 'Covers TypeScript, JSX and TSX. Code without semicolons is supported.' },
      java: { units: 'Methods, constructors, generic methods and lambdas with a { } body.',
        dec: 'if / else if, for, enhanced for, while, do…while, case (classic and ->), catch (including multi-catch), ?:, &&, ||',
        notes: 'Anonymous and inner classes are scanned for their methods.' },
      c: { units: 'Functions, Class::method methods, constructors with initializer lists, destructors, operator overloads and lambdas.',
        dec: 'if / else if, for, while, do…while, case, catch (C++), ?:, &&, ||',
        notes: 'Directives such as #include and #define are ignored. goto is not modeled.' },
      cs: { units: 'Methods, constructors (including : base(…)), local functions and lambdas with a body.',
        dec: 'if / else if, for, foreach, while, do…while, case, catch (and catch … when), ?:, ??, &&, ||',
        notes: 'Nullable types (int?) are not mistaken for the ternary operator.' },
      php: { units: 'Functions, methods, closures with use (…) and top-level code.',
        dec: 'if / elseif / else if, for, foreach, while, do…while, case, catch, ?:, ??, &&, ||, and, or',
        notes: '<?php ?> tags are ignored. The alternative syntax (if: … endif;) is not supported, and the short ?: operator is not counted.' },
      go: { units: 'Functions, methods with receivers and anonymous functions (go func, defer func).',
        dec: 'if (with init statement), for (all three forms and range), switch case, type switch and select, &&, ||',
        notes: 'Cases do not fall through unless there is an explicit fallthrough, just like Go.' },
      py: { units: 'def and async def, methods (Class.method), nested functions and module-level code.',
        dec: 'if / elif, for, while (also with else), except, match case, conditional expression (x if c else y), for and if in comprehensions, and, or',
        notes: 'Based on indentation; supports \\ and bracket line continuation.' },
    },
  };

  McC.I18N = { es: ES, en: EN };
  McC.LANG_INFO = LANG_INFO;
  McC.uiLang = 'es';
  try {
    const qs = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('lang') : null;
    const saved = qs || localStorage.getItem('mccabe-idioma');
    if (saved === 'es' || saved === 'en') McC.uiLang = saved;
    else if (typeof navigator !== 'undefined' && /^en\b/i.test(navigator.language || '')) McC.uiLang = 'en';
  } catch (e) { /* sin almacenamiento */ }

  McC.t = function (key, vars) {
    const dict = McC.I18N[McC.uiLang] || ES;
    let s = dict[key];
    if (s === undefined) s = ES[key];
    if (s === undefined) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return s;
  };

  /* Aplica las traducciones a los elementos con atributos data-i18n* */
  McC.applyI18n = function (root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = McC.t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = McC.t(el.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', McC.t(el.dataset.i18nAria)); });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.setAttribute('title', McC.t(el.dataset.i18nTitle)); });
    root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.setAttribute('placeholder', McC.t(el.dataset.i18nPh)); });
  };
})();
