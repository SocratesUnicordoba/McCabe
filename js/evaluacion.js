/* =========================================================================
 * Evaluación del software · usabilidad ISO/IEC 25010:2011
 * Equivale a la «Evaluación Simulador» de DeltaT: 24 ítems en escala Likert
 * de 5 puntos agrupados en 7 dimensiones. Q3, Q6, Q9 y Q14 están redactados
 * en sentido negativo y se invierten (6 − x) antes de promediar.
 *   Score = (Media − 1) / 4 × 100   ·   Alto ≥ 70 % · Moderado 50–69 % · Bajo < 50 %
 * ========================================================================= */
(function () {
  'use strict';
  const McC = window.McC;
  const t = McC.t;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const DIMS = [
    { k: 'rec', es: 'Reconocimiento de la adecuación', en: 'Appropriateness recognisability' },
    { k: 'apr', es: 'Capacidad de aprendizaje', en: 'Learnability' },
    { k: 'ope', es: 'Operabilidad', en: 'Operability' },
    { k: 'err', es: 'Protección frente a errores', en: 'User error protection' },
    { k: 'est', es: 'Estética', en: 'User interface aesthetics' },
    { k: 'acc', es: 'Accesibilidad', en: 'Accessibility' },
    { k: 'sat', es: 'Satisfacción', en: 'Satisfaction' },
  ];
  // [código, dimensión, invertida, texto ES, texto EN]
  const ITEMS = [
    ['Q1', 'rec', 0, 'Comprensión del propósito del analizador', 'Understanding of the purpose of the analyzer'],
    ['Q2', 'rec', 0, 'Identificación de las funciones principales (cargar código, analizar, ver el grafo, exportar resultados)', 'Identification of the main functions (load code, analyze, view the graph, export results)'],
    ['Q3', 'apr', 1, 'Confusión en el flujo de trabajo inicial', 'Confusion in the initial workflow'],
    ['Q4', 'apr', 0, 'Facilidad para cargar el código, elegir el lenguaje y configurar las opciones', 'Ease of loading the code, choosing the language and setting the options'],
    ['Q5', 'apr', 0, 'Aprendizaje sin ayuda externa', 'Learning without external help'],
    ['Q6', 'apr', 1, 'Dificultad para recordar los pasos', 'Difficulty remembering the steps'],
    ['Q7', 'ope', 0, 'Navegación sencilla y lógica', 'Simple and logical navigation'],
    ['Q8', 'ope', 0, 'Respuesta adecuada de botones y controles', 'Adequate response of buttons and controls'],
    ['Q9', 'ope', 1, 'Necesidad de muchos intentos para lograr el objetivo', 'Need for many attempts to achieve the goal'],
    ['Q10', 'err', 0, 'Velocidad de respuesta del analizador', 'Response speed of the analyzer'],
    ['Q11', 'err', 0, 'Manejo adecuado de archivos o código no válido', 'Proper handling of invalid files or code'],
    ['Q12', 'err', 0, 'Mensajes de error comprensibles', 'Understandable error messages'],
    ['Q13', 'err', 0, 'Prevención de errores graves', 'Prevention of serious errors'],
    ['Q14', 'err', 1, 'Comportamiento inesperado del sistema', 'Unexpected system behaviour'],
    ['Q15', 'est', 0, 'Distribución de elementos en pantalla', 'Layout of elements on screen'],
    ['Q16', 'est', 0, 'El diseño visual facilita el análisis del grafo de flujo y de los resultados', 'The visual design makes it easier to analyze the flow graph and the results'],
    ['Q17', 'est', 0, 'Interfaz agradable y profesional', 'Pleasant and professional interface'],
    ['Q18', 'est', 0, 'Legibilidad de textos y etiquetas', 'Readability of texts and labels'],
    ['Q19', 'est', 0, 'Identificación de la información en el grafo, las fórmulas y los caminos', 'Identification of the information in the graph, the formulas and the paths'],
    ['Q20', 'est', 0, 'Uso sin ajustes técnicos adicionales', 'Use without additional technical setup'],
    ['Q21', 'acc', 0, 'Facilita el estudio frente a calcular la complejidad manualmente', 'Makes studying easier than computing the complexity by hand'],
    ['Q22', 'sat', 0, 'Facilita el trabajo docente o de investigación', 'Supports teaching or research work'],
    ['Q23', 'sat', 0, 'Satisfacción general de uso', 'Overall satisfaction of use'],
    ['Q24', 'sat', 0, 'Recomendaría el analizador a otros usuarios', 'I would recommend the analyzer to other users'],
  ];

  const en = () => McC.uiLang === 'en';
  const dimTxt = (k) => { const d = DIMS.find((x) => x.k === k); return en() ? d.en : d.es; };
  const itemTxt = (it) => (en() ? it[4] : it[3]);
  const scorePct = (media) => (media - 1) / 4 * 100;
  const nivelKey = (s) => (s >= 70 ? 'alto' : s >= 50 ? 'moderado' : 'bajo');
  const nivelTxt = (s) => t('ev.lvl.' + nivelKey(s));
  const semestreDe = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() < 6 ? 1 : 2}`;

  /* Cálculo idéntico al de DeltaT */
  function calcular(resp) {
    const aj = {};
    ITEMS.forEach(([q, , inv]) => { aj[q] = inv ? 6 - resp[q] : resp[q]; });
    const porDim = DIMS.map((d) => {
      const qs = ITEMS.filter((i) => i[1] === d.k).map((i) => i[0]);
      const media = qs.reduce((s, q) => s + aj[q], 0) / qs.length;
      return { dim: d.k, n: qs.length, media, score: scorePct(media) };
    });
    const todos = ITEMS.map((i) => aj[i[0]]);
    const mediaG = todos.reduce((a, b) => a + b, 0) / todos.length;
    return { aj, porDim, global: { n: todos.length, media: mediaG, score: scorePct(mediaG) } };
  }
  McC.evaluacion = { ITEMS, DIMS, calcular };
  if (typeof document === 'undefined' || !document.getElementById('evaluacion')) return;

  /* ------------------------------------------------------------ Estado */
  const leerId = () => { try { return JSON.parse(sessionStorage.getItem('mccabe-eval-id') || 'null') || {}; } catch (e) { return {}; } };
  const guardarId = (o) => { try { sessionStorage.setItem('mccabe-eval-id', JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ } };
  const st = { view: 'form', resp: {}, id: leerId(), R: null, archivo: '' };
  st.id.semestre = semestreDe();

  const dlg = $('#evaluacion'), body = $('#evBody'), btns = $('#evBtns'), err = $('#evError');

  function announce(msg) { const el = $('#sr'); if (!el) return; el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 80); }

  /* ------------------------------------------------------------ Cuestionario */
  function campo(id, key, req) {
    const v = st.id[id] || '';
    return `<div class="ev-campo"><label for="ev-${id}">${esc(t('ev.' + key))}${req ? ` <span class="ev-req" aria-hidden="true">*</span><span class="sr-only"> ${esc(t('ev.required'))}</span>` : ''}</label>
      <input id="ev-${id}" data-id="${id}" type="text" value="${esc(v)}"${t('ev.' + key + '.ph') !== 'ev.' + key + '.ph' ? ` placeholder="${esc(t('ev.' + key + '.ph'))}"` : ''}${req ? ' required aria-required="true"' : ''}${id === 'nombre' ? ' autocomplete="name"' : ' autocomplete="off"'}></div>`;
  }

  function formulario() {
    st.view = 'form';
    const answered = ITEMS.filter(([q]) => st.resp[q]).length;
    let h = `<fieldset class="ev-id"><legend>${esc(t('ev.id'))}</legend><div class="ev-grid">
      ${campo('nombre', 'nombre', true)}${campo('materia', 'materia')}${campo('carrera', 'carrera')}${campo('grupo', 'grupo')}
      <div class="ev-campo"><label for="ev-semestre">${esc(t('ev.semestre'))}</label><input id="ev-semestre" data-id="semestre" type="text" value="${esc(st.id.semestre)}" aria-describedby="ev-semnote"></div>
      </div><p id="ev-semnote" class="muted small">${esc(t('ev.semNote'))}</p></fieldset>`;
    h += `<div class="ev-sticky"><ol class="ev-leyenda" aria-label="Likert">${[1, 2, 3, 4, 5].map((n) => `<li><b>${n}</b> ${esc(t('ev.esc' + n))}</li>`).join('')}</ol>
      <div class="ev-prog"><div class="ev-prog-bar" aria-hidden="true"><span style="width:${answered / ITEMS.length * 100}%"></span></div>
      <span id="evProgTxt" class="small muted">${esc(t('ev.progress', { a: answered, b: ITEMS.length }))}</span></div></div>`;
    h += `<p class="muted small">${esc(t('ev.invNote'))}</p>`;
    DIMS.forEach((d) => {
      h += `<section class="ev-dim" aria-labelledby="evd-${d.k}"><h3 id="evd-${d.k}">${esc(dimTxt(d.k))}</h3>`;
      ITEMS.filter((i) => i[1] === d.k).forEach((it) => {
        const [q, , inv] = it;
        h += `<fieldset class="ev-item" id="ev-${q}"><legend><code>${q}</code> <span>${esc(itemTxt(it))}</span>${inv ? ` <em>${esc(t('ev.inv'))}</em>` : ''}</legend>
          <div class="ev-esc">${[1, 2, 3, 4, 5].map((v) => `<label title="${v} · ${esc(t('ev.esc' + v))}"><input type="radio" name="${q}" value="${v}"${st.resp[q] === v ? ' checked' : ''}><span aria-hidden="true">${v}</span><span class="sr-only">${esc(t('ev.esc' + v))}</span></label>`).join('')}</div>
        </fieldset>`;
      });
      h += '</section>';
    });
    body.innerHTML = h;
    btns.innerHTML = `<button type="button" class="secondary" id="ev-limpiar">${esc(t('ev.clear'))}</button>
      <span class="ev-sp"></span>
      <button type="button" class="secondary" id="ev-cancelar">${esc(t('ev.cancel'))}</button>
      <button type="button" class="primary inline" id="ev-calcular">${esc(t('ev.calc'))}</button>`;
    err.hidden = true;
  }

  function actualizarProgreso() {
    const a = ITEMS.filter(([q]) => st.resp[q]).length;
    const bar = body.querySelector('.ev-prog-bar span');
    if (bar) bar.style.width = a / ITEMS.length * 100 + '%';
    const txt = $('#evProgTxt');
    if (txt) txt.textContent = t('ev.progress', { a, b: ITEMS.length });
  }

  body.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.type === 'radio') {
      st.resp[el.name] = +el.value;
      const fs = $('#ev-' + el.name); if (fs) fs.classList.remove('ev-falta');
      actualizarProgreso();
    }
  });
  body.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.dataset && el.dataset.id) { st.id[el.dataset.id] = el.value; guardarId(st.id); }
  });

  function calcularYmostrar() {
    const nombre = (st.id.nombre || '').trim();
    const faltan = ITEMS.filter(([q]) => !st.resp[q]).map(([q]) => q);
    ITEMS.forEach(([q]) => { const fs = $('#ev-' + q); if (fs) fs.classList.toggle('ev-falta', !st.resp[q]); });
    const inpN = $('#ev-nombre');
    if (inpN) inpN.setAttribute('aria-invalid', nombre ? 'false' : 'true');
    if (!nombre || faltan.length) {
      let h = '';
      if (!nombre) h += `<p>${esc(t('ev.errNombre'))}</p>`;
      if (faltan.length) h += `<p>${esc(t('ev.faltan', { n: faltan.length }))} ${faltan.map((q) => `<a href="#ev-${q}" data-go="${q}">${q}</a>`).join(', ')}.</p>`;
      err.innerHTML = h;
      err.hidden = false;
      if (!nombre) { inpN.focus(); return; }
      const first = $('#ev-' + faltan[0]);
      first.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      first.querySelector('input').focus({ preventScroll: true });
      return;
    }
    err.hidden = true;
    st.R = calcular(st.resp);
    resultados();
    announce(t('ev.live.result', { s: st.R.global.score.toFixed(1), n: nivelTxt(st.R.global.score) }));
  }
  err.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-go]');
    if (!a) return;
    ev.preventDefault();
    const fs = $('#ev-' + a.dataset.go);
    fs.scrollIntoView({ block: 'center' });
    fs.querySelector('input').focus({ preventScroll: true });
  });

  /* ------------------------------------------------------------ Resultados */
  const pill = (s) => `<span class="pill ev-lvl-${nivelKey(s)}">${esc(nivelTxt(s))}</span>`;
  const barra = (s) => `<span class="ev-bar" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, s)).toFixed(1)}%"></span><i style="left:50%"></i><i style="left:70%"></i></span>`;

  function resultados() {
    st.view = 'result';
    const R = st.R;
    body.innerHTML = `
      <div class="ev-global">
        <div class="ev-global-v"><span class="ev-big">${R.global.score.toFixed(1)} %</span>${pill(R.global.score)}</div>
        <div class="ev-global-t"><strong>${esc(t('ev.global'))}</strong>
          <span class="muted small">${esc(t('ev.colMedia'))} ${R.global.media.toFixed(2)} · ${R.global.n} ${esc(t('ev.colItems').toLowerCase())}</span></div>
      </div>
      <div class="table-wrap">
        <table class="tabla compacta ev-tabla">
          <caption class="sr-only">${esc(t('ev.caption'))}</caption>
          <thead><tr><th scope="col">${esc(t('ev.colDim'))}</th><th scope="col" class="num">${esc(t('ev.colItems'))}</th><th scope="col" class="num">${esc(t('ev.colMedia'))}</th><th scope="col">${esc(t('ev.colScore'))}</th><th scope="col">${esc(t('ev.colNivel'))}</th></tr></thead>
          <tbody>${R.porDim.map((p) => `<tr><th scope="row">${esc(dimTxt(p.dim))}</th><td class="num">${p.n}</td><td class="num">${p.media.toFixed(2)}</td>
            <td><span class="ev-score">${barra(p.score)}<span class="ev-pct">${p.score.toFixed(1)} %</span></span></td><td>${pill(p.score)}</td></tr>`).join('')}</tbody>
          <tfoot><tr><th scope="row">GLOBAL</th><td class="num"><b>${R.global.n}</b></td><td class="num"><b>${R.global.media.toFixed(2)}</b></td>
            <td><span class="ev-score">${barra(R.global.score)}<span class="ev-pct"><b>${R.global.score.toFixed(1)} %</b></span></span></td><td>${pill(R.global.score)}</td></tr></tfoot>
        </table>
      </div>
      <p class="muted small">${esc(t('ev.nota'))}</p>`;
    btns.innerHTML = `<button type="button" class="secondary" id="ev-volver">${esc(t('ev.back'))}</button>
      <span class="ev-sp"></span>
      <button type="button" class="primary inline" id="ev-bajar">${esc(t('ev.download'))}</button>`;
    body.scrollTop = 0;
    $('#ev-bajar').focus();
  }

  /* ------------------------------------------------------------ Informe .txt */
  function textoInforme() {
    const R = st.R, s = st.id, d = new Date(), f = (n) => String(n).padStart(2, '0');
    const fecha = `${d.getFullYear()}-${f(d.getMonth() + 1)}-${f(d.getDate())} ${f(d.getHours())}:${f(d.getMinutes())}`;
    const sep = '='.repeat(78), sub = '-'.repeat(78), L = [];
    const fila = (dim, n, media, sc, niv) =>
      '  ' + String(dim).padEnd(36) + String(n).padStart(5) + String(media).padStart(8) + String(sc).padStart(10) + '   ' + niv;
    const et = (k, v) => L.push(t(k).padEnd(15) + ' : ' + v);
    const sinReg = t('rep.sinReg');
    L.push(sep, '  ' + (en() ? 'McCABE ANALYZER' : 'ANALIZADOR McCABE') + ' — ' + t('rep.title'), '  ' + t('rep.sub'), sep, '');
    et('rep.fecha', fecha);
    et('rep.estudiante', (s.nombre || '').trim() || sinReg);
    et('rep.materia', (s.materia || '').trim() || sinReg);
    et('rep.carrera', (s.carrera || '').trim() || sinReg);
    et('rep.grupo', (s.grupo || '').trim() || sinReg);
    et('rep.semestre', (s.semestre || '').trim() || sinReg);
    const A = McC.resumenAnalisis ? McC.resumenAnalisis() : null;
    if (A) {
      et('rep.archivos', A.archivos.length ? `${A.archivos.length}  [${A.archivos.join(', ')}]` : '—');
      et('rep.funciones', A.funciones ? `${A.funciones}  ·  ${t('rep.vmax')} ${A.vmax} (${A.vmaxNombre})` : '—');
    }
    L.push('', t('rep.sInstr'), sub);
    L.push('  ' + t('rep.escala'), '  ' + t('rep.agrup'), '  ' + t('rep.inv'));
    L.push('  Score (%) = (' + t('ev.colMedia') + ' - 1) / 4 x 100', '  ' + t('rep.niveles'));
    L.push('', t('rep.sResp'), sub);
    L.push('  ' + t('rep.hItem').padEnd(6) + t('ev.colDim').padEnd(38) + t('rep.hResp').padStart(5) + t('rep.hAjust').padStart(8) + '  ' + t('rep.hDescr'));
    ITEMS.forEach((it) => {
      const [q, dim, inv] = it;
      L.push('  ' + q.padEnd(6) + dimTxt(dim).padEnd(38) + String(st.resp[q]).padStart(5) + String(R.aj[q]).padStart(8) +
        (inv ? '  (inv.) ' : '  ') + itemTxt(it));
    });
    L.push('', t('rep.sDim'), sub);
    L.push(fila(t('ev.colDim'), t('ev.colItems'), t('ev.colMedia'), t('ev.colScore'), t('ev.colNivel')));
    R.porDim.forEach((p) => L.push(fila(dimTxt(p.dim), p.n, p.media.toFixed(2), p.score.toFixed(1) + ' %', nivelTxt(p.score))));
    L.push('  ' + '-'.repeat(74));
    L.push(fila('GLOBAL', R.global.n, R.global.media.toFixed(2), R.global.score.toFixed(1) + ' %', nivelTxt(R.global.score)));
    L.push('', sep, '  ' + t('rep.generado'), '  ' + t('authors'), sep, '');
    return L.join('\r\n');
  }

  function descargar() {
    const d = new Date(), f = (n) => String(n).padStart(2, '0');
    const limpio = ((st.id.nombre || '').trim() || 'anonimo').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
    st.archivo = `${t('rep.file')}-${limpio}-${d.getFullYear()}${f(d.getMonth() + 1)}${f(d.getDate())}.txt`;
    const blob = new Blob(['﻿' + textoInforme()], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = st.archivo;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    despedida();
  }

  function despedida() {
    st.view = 'thanks';
    body.innerHTML = `<div class="ev-adios" role="status">
      <div class="ev-adios-ico" aria-hidden="true">✓</div>
      <h3>${esc(t('ev.done'))}</h3>
      <p><code>${esc(st.archivo)}</code></p>
      <p class="muted">${esc(t('ev.thanks'))}</p></div>`;
    btns.innerHTML = `<span class="ev-sp"></span>
      <button type="button" class="secondary" id="ev-cerrar-pest">${esc(t('ev.closeTab'))}</button>
      <button type="button" class="primary inline" id="ev-volver-app">${esc(t('ev.backApp'))}</button>`;
    $('#ev-volver-app').focus();
  }

  /* ------------------------------------------------------------ Botones */
  btns.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    switch (b.id) {
      case 'ev-cancelar': dlg.close(); break;
      case 'ev-limpiar': st.resp = {}; formulario(); break;
      case 'ev-calcular': calcularYmostrar(); break;
      case 'ev-volver': formulario(); break;
      case 'ev-bajar': descargar(); break;
      case 'ev-volver-app': dlg.close(); formulario(); break;
      case 'ev-cerrar-pest': window.close(); break;
    }
  });

  function render() {
    if (st.view === 'result' && st.R) resultados();
    else if (st.view === 'thanks') despedida();
    else formulario();
  }

  $('#btnEval').addEventListener('click', () => {
    if (st.view === 'thanks') st.view = 'form';
    render();
    dlg.showModal();
    body.scrollTop = 0;
  });
  dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });

  // Re-traduce el cuestionario abierto al cambiar de idioma
  const prev = McC.onLangChange;
  McC.onLangChange = () => { if (prev) prev(); if (dlg.open) render(); };
})();
