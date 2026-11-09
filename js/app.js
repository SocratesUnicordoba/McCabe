/* =========================================================================
 * Interfaz de usuario: carga de archivos, resultados, detalle didáctico,
 * recorrido guiado, modo práctica, idioma y accesibilidad.
 * ========================================================================= */
(function () {
  'use strict';
  const McC = window.McC;
  const t = McC.t;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduceMotion = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const TOUR_N = 9;

  const state = {
    files: [],            // { name, src, lang ('auto' | clave), detected, error }
    active: -1,
    results: [],
    selected: null,
    sort: { key: 'V', dir: -1 },
    zoom: 0, zoomScale: 1,
    practice: false,
    revealed: new Set(),
    attempts: {},
    justSolved: null,
    tour: 0,
    paths: [],
    order: [],
    playTimer: null,
  };

  /* ------------------------------------------------------------ Utilidades */
  let srTimer = null;
  function announce(msg) {
    const el = $('#sr');
    el.textContent = '';
    clearTimeout(srTimer);
    srTimer = setTimeout(() => { el.textContent = msg; }, 80);
  }
  function download(name, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const isHidden = (r) => state.practice && !state.revealed.has(r.key);

  /* ------------------------------------------------------------ Tema */
  try { const th = localStorage.getItem('mccabe-tema'); if (th) document.documentElement.dataset.theme = th; } catch (e) { /* sin almacenamiento */ }
  $('#btnTema').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('mccabe-tema', root.dataset.theme); } catch (e) { /* ignorar */ }
  });

  /* ------------------------------------------------------------ Diálogos */
  $('#btnTeoria').addEventListener('click', () => $('#teoria').showModal());
  $('#btnLangs').addEventListener('click', () => $('#lenguajes').showModal());
  $('#btnLangs2').addEventListener('click', () => $('#lenguajes').showModal());
  $$('dialog').forEach((d) => d.addEventListener('click', (ev) => { if (ev.target === d) d.close(); }));

  function renderLangs() {
    const exts = {};
    Object.entries(McC.EXT).forEach(([e, k]) => { (exts[k] = exts[k] || []).push('.' + e); });
    const info = McC.LANG_INFO[McC.uiLang] || McC.LANG_INFO.es;
    $('#langsList').innerHTML = Object.entries(McC.LANGS).map(([k, L]) => `
      <article class="lang-card">
        <h3>${esc(L.name)}</h3>
        <dl>
          <dt>${esc(t('langs.ext'))}</dt><dd>${exts[k].map((e) => `<code>${e}</code>`).join(' ')}</dd>
          <dt>${esc(t('langs.units'))}</dt><dd>${esc(info[k].units)}</dd>
          <dt>${esc(t('langs.dec'))}</dt><dd><code class="dec-list">${esc(info[k].dec)}</code></dd>
          <dt>${esc(t('langs.notes'))}</dt><dd>${esc(info[k].notes)}</dd>
        </dl>
      </article>`).join('');
  }

  /* ------------------------------------------------------------ Idioma */
  const langSel = $('#lang');
  const ejSel = $('#ejemplos');
  function fillSelects() {
    const cur = langSel.value || 'auto';
    langSel.innerHTML = `<option value="auto">${esc(t('in.auto'))}</option>` +
      Object.entries(McC.LANGS).map(([k, l]) => `<option value="${k}">${esc(l.name)}</option>`).join('');
    langSel.value = cur;
    ejSel.innerHTML = `<option value="">${esc(t('in.examples'))}</option>` +
      McC.EJEMPLOS.map((e, i) => `<option value="${i}">${esc(e.name)} — ${esc(McC.LANGS[e.lang].name)}</option>`).join('');
  }
  function setUiLang(l, announceIt) {
    McC.uiLang = l;
    try { localStorage.setItem('mccabe-idioma', l); } catch (e) { /* ignorar */ }
    document.documentElement.lang = l;
    document.title = t('doc.title');
    McC.applyI18n(document);
    const it = $('#idiomaTxt');
    it.textContent = t('btn.lang');
    it.lang = l === 'es' ? 'en' : 'es';
    fillSelects();
    renderLangs();
    renderTabs();
    updateDetect();
    analyzeAll(false);
    if (announceIt) announce(t('live.lang'));
  }
  $('#btnIdioma').addEventListener('click', () => setUiLang(McC.uiLang === 'es' ? 'en' : 'es', true));

  /* ------------------------------------------------------------ Archivos */
  function addFile(name, src, lang) {
    const existing = state.files.findIndex((f) => f.name === name);
    if (existing >= 0) { state.files[existing].src = src; state.active = existing; }
    else { state.files.push({ name, src, lang: lang || 'auto' }); state.active = state.files.length - 1; }
    renderTabs(); loadEditor();
  }
  function renderTabs() {
    $('#tabs').innerHTML = state.files.map((f, i) => `
      <div class="tab${i === state.active ? ' on' : ''}" role="listitem">
        <button type="button" class="tab-sel" data-i="${i}" aria-current="${i === state.active ? 'true' : 'false'}">${esc(f.name)}</button>
        <button type="button" class="tab-x" data-x="${i}" aria-label="${esc(t('in.remove', { name: f.name }))}" title="${esc(t('in.remove', { name: f.name }))}">×</button>
      </div>`).join('');
  }
  function loadEditor() {
    const f = state.files[state.active];
    $('#editor').value = f ? f.src : '';
    langSel.value = f ? f.lang : 'auto';
    updateDetect();
  }
  function updateDetect() {
    const f = state.files[state.active];
    $('#langDetect').textContent = (!f || f.lang !== 'auto') ? '' : t('in.detected', { lang: McC.LANGS[McC.detectLang(f.name, f.src)].name });
  }

  $('#tabs').addEventListener('click', (ev) => {
    const x = ev.target.closest('[data-x]');
    if (x) {
      state.files.splice(+x.dataset.x, 1);
      state.active = Math.min(state.active, state.files.length - 1);
      renderTabs(); loadEditor(); analyzeAll(false);
      const next = $('#tabs .tab-sel') || $('#btnNuevo');
      next.focus();
      return;
    }
    const s = ev.target.closest('[data-i]');
    if (s) { state.active = +s.dataset.i; renderTabs(); loadEditor(); $(`#tabs [data-i="${state.active}"]`).focus(); }
  });

  let debounce = null;
  $('#editor').addEventListener('input', (ev) => {
    if (state.active < 0) { state.files.push({ name: t('paste.name', { n: 1 }), src: '', lang: 'auto' }); state.active = 0; renderTabs(); }
    state.files[state.active].src = ev.target.value;
    updateDetect();
    clearTimeout(debounce);
    debounce = setTimeout(() => analyzeAll(false), 700);
  });
  langSel.addEventListener('change', () => {
    const f = state.files[state.active];
    if (f) { f.lang = langSel.value; updateDetect(); analyzeAll(true); }
  });
  $('#optLogical').addEventListener('change', () => analyzeAll(true));
  $('#optPractice').addEventListener('change', (ev) => {
    state.practice = ev.target.checked;
    state.revealed.clear(); state.attempts = {};
    state.sort = state.practice ? { key: 'line', dir: 1 } : { key: 'V', dir: -1 };
    state.selected = null;
    analyzeAll(true);
  });
  $('#btnAnalizar').addEventListener('click', () => analyzeAll(true));

  $('#btnNuevo').addEventListener('click', () => {
    let n = 1;
    while (state.files.some((f) => f.name === t('paste.name', { n }))) n++;
    addFile(t('paste.name', { n }), '', 'auto');
    $('#editor').focus();
  });
  ejSel.addEventListener('change', () => {
    if (ejSel.value === '') return;
    const e = McC.EJEMPLOS[+ejSel.value];
    addFile(e.name, e.src, 'auto');
    ejSel.value = '';
    state.selected = null;
    analyzeAll(true);
  });

  function readFiles(list) {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    let pending = arr.length;
    arr.forEach((file) => {
      const r = new FileReader();
      r.onload = () => {
        addFile(file.name, String(r.result), 'auto');
        if (--pending === 0) { state.selected = null; analyzeAll(true); announce(t('live.loaded', { name: arr.map((f) => f.name).join(', ') })); }
      };
      r.onerror = () => { if (--pending === 0) analyzeAll(true); };
      r.readAsText(file);
    });
  }
  $('#fileInput').addEventListener('change', (ev) => { readFiles(ev.target.files); ev.target.value = ''; });
  const dz = $('#dropzone');
  ['dragenter', 'dragover'].forEach((ty) => dz.addEventListener(ty, (ev) => { ev.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ty) => dz.addEventListener(ty, (ev) => { ev.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', (ev) => readFiles(ev.dataTransfer.files));
  document.addEventListener('dragover', (ev) => ev.preventDefault());
  document.addEventListener('drop', (ev) => { if (!dz.contains(ev.target)) { ev.preventDefault(); readFiles(ev.dataTransfer.files); } });

  /* ------------------------------------------------------------ Análisis */
  function analyzeAll(announceIt) {
    const opts = { logical: $('#optLogical').checked };
    const prevKey = state.selected ? state.selected.key : null;
    state.results = [];
    state.files.forEach((f, fi) => {
      const lang = f.lang === 'auto' ? McC.detectLang(f.name, f.src) : f.lang;
      f.detected = lang; f.error = null;
      if (!f.src.trim()) return;
      try {
        const seen = {};
        McC.analyze(f.src, lang, opts).forEach((u) => {
          const base = `${f.name}::${u.top ? 'top' : u.line}`;
          seen[base] = (seen[base] || 0) + 1;
          state.results.push(Object.assign(u, { file: f.name, fileIdx: fi, lang, key: `${base}::${seen[base]}` }));
        });
      } catch (err) {
        console.error(err);
        f.error = err.message;
      }
    });
    renderSummary();
    renderTable();
    const R = state.results;
    const keep = R.find((r) => r.key === prevKey);
    const target = keep || (state.practice ? sorted(R)[0] : R.slice().sort((a, b) => b.m.V - a.m.V)[0]);
    if (target) select(target, { keepTour: !!keep });
    else { state.selected = null; $('#detalle').hidden = true; }
    if (announceIt && R.length) {
      const max = R.reduce((a, r) => (r.m.V > a.m.V ? r : a), R[0]);
      announce(state.practice ? t('live.donePractice', { n: R.length }) : t('live.done', { n: R.length, max: max.m.V, name: max.name }));
    }
  }

  /* ------------------------------------------------------------ Resumen */
  function renderSummary() {
    const R = state.results;
    const el = $('#resumen');
    $('#btnCSV').disabled = !R.length || state.practice;
    const errs = state.files.filter((f) => f.error).map((f) => `<p class="error" role="alert">${esc(t('res.error', { file: f.name, msg: f.error }))}</p>`).join('');
    if (!R.length) {
      el.innerHTML = `<p class="empty">${esc(state.files.some((f) => f.src.trim()) ? t('res.none') : t('res.empty'))}</p>${errs}`;
      return;
    }
    const nFiles = state.files.filter((f) => f.src.trim()).length;
    if (state.practice) {
      const solved = R.filter((r) => state.revealed.has(r.key)).length;
      el.innerHTML = `
        <div class="stats stats-2">
          <div class="stat"><span class="stat-v">${R.length}</span><span class="stat-l">${esc(t('res.functions', { n: nFiles }))}</span></div>
          <div class="stat"><span class="stat-v">${solved}/${R.length}</span><span class="stat-l">${esc(t('res.solved', { a: solved, b: R.length }))}</span></div>
        </div>
        <p class="practice-note"><span aria-hidden="true">🎯</span> ${esc(t('res.practice'))}</p>${errs}`;
      return;
    }
    const total = R.reduce((a, r) => a + r.m.V, 0);
    const max = R.reduce((a, r) => (r.m.V > a.m.V ? r : a), R[0]);
    const dist = { bajo: 0, moderado: 0, alto: 0, muyalto: 0 };
    R.forEach((r) => { dist[McC.risk(r.m.V).key]++; });
    const keys = ['bajo', 'moderado', 'alto', 'muyalto'];
    const distLabel = t('res.dist') + ': ' + keys.map((k) => `${t('risk.' + k)} ${dist[k]}`).join(', ');
    el.innerHTML = `
      <div class="stats">
        <div class="stat"><span class="stat-v">${R.length}</span><span class="stat-l">${esc(t('res.functions', { n: nFiles }))}</span></div>
        <div class="stat"><span class="stat-v">${total}</span><span class="stat-l">${esc(t('res.total'))}</span></div>
        <div class="stat"><span class="stat-v">${(total / R.length).toFixed(1)}</span><span class="stat-l">${esc(t('res.avg'))}</span></div>
        <div class="stat"><span class="stat-v r-text-${McC.risk(max.m.V).key}">${max.m.V}</span><span class="stat-l" title="${esc(max.name)}">${esc(t('res.max', { name: McC.trunc(max.name, 26) }))}</span></div>
      </div>
      <div class="dist" role="img" aria-label="${esc(distLabel)}">
        ${keys.map((k) => dist[k] ? `<span class="seg r-${k}" style="flex:${dist[k]}">${dist[k]}</span>` : '').join('')}
      </div>
      <ul class="dist-leg" aria-hidden="true">${keys.map((k) => `<li><i class="r-${k}"></i>${esc(t('risk.' + k + '.r'))}</li>`).join('')}</ul>
      ${errs}`;
  }

  /* ------------------------------------------------------------ Tabla */
  function sortVal(r, k) {
    switch (k) {
      case 'file': return r.file.toLowerCase();
      case 'name': return r.name.toLowerCase();
      case 'line': return r.fileIdx * 1e6 + r.line;
      default: return r.m[k];
    }
  }
  function sorted(R) {
    const { key, dir } = state.sort;
    return R.slice().sort((a, b) => {
      const x = sortVal(a, key), y = sortVal(b, key);
      return (x < y ? -1 : x > y ? 1 : 0) * dir || a.fileIdx - b.fileIdx || a.line - b.line;
    });
  }
  const METRIC_KEYS = ['N', 'E', 'P', 'V'];
  function renderTable() {
    const R = sorted(state.results);
    $('#tabla').hidden = !R.length;
    $$('#tabla th[data-k]').forEach((th) => {
      const k = th.dataset.k;
      const on = state.sort.key === k;
      if (on) th.setAttribute('aria-sort', state.sort.dir > 0 ? 'ascending' : 'descending'); else th.removeAttribute('aria-sort');
      th.classList.toggle('sorted', on);
      const btn = th.querySelector('button');
      btn.disabled = state.practice && METRIC_KEYS.includes(k);
      btn.dataset.dir = state.sort.dir > 0 ? '▲' : '▼';
    });
    const q = `<span aria-hidden="true">?</span><span class="sr-only">${esc(t('res.hidden'))}</span>`;
    $('#tabla tbody').innerHTML = R.map((r) => {
      const hid = isHidden(r);
      const rk = McC.risk(r.m.V);
      const sel = state.selected && state.selected.key === r.key;
      return `<tr data-key="${esc(r.key)}" class="${sel ? 'sel' : ''}">
        <td class="file col-file" title="${esc(r.file)}">${esc(McC.trunc(r.file, 22))}</td>
        <td class="fn"><button type="button" class="fn-btn" data-key="${esc(r.key)}" aria-current="${sel ? 'true' : 'false'}" title="${esc(r.name)}">${esc(McC.trunc(r.name, 40))}</button></td>
        <td class="num col-lines">${r.line}–${r.endLine}</td>
        <td class="num col-ne">${hid ? q : r.m.N}</td><td class="num col-ne">${hid ? q : r.m.E}</td><td class="num col-ne">${hid ? q : r.m.P}</td>
        <td class="num"><strong>${hid ? q : r.m.V}</strong></td>
        <td>${hid ? `<span class="pill pill-hidden">${esc(t('res.hidden'))}</span>` : `<span class="pill r-${rk.key}">${esc(rk.label)}</span>`}</td>
      </tr>`;
    }).join('');
  }
  $('#tabla thead').addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn || btn.disabled) return;
    const k = btn.closest('th').dataset.k;
    state.sort = state.sort.key === k ? { key: k, dir: -state.sort.dir } : { key: k, dir: ['file', 'name', 'line'].includes(k) ? 1 : -1 };
    renderTable();
    $(`#tabla th[data-k="${k}"] button`).focus();
  });
  $('#tabla tbody').addEventListener('click', (ev) => {
    const tr = ev.target.closest('tr[data-key]');
    if (!tr) return;
    const r = state.results.find((x) => x.key === tr.dataset.key);
    if (r) select(r, { scroll: true, announce: true, focus: !!ev.target.closest('button') && ev.detail === 0 });
  });

  $('#btnCSV').addEventListener('click', () => {
    const head = McC.uiLang === 'en'
      ? ['file', 'function', 'start_line', 'end_line', 'nodes_N', 'edges_E', 'predicates_P', 'VG', 'risk']
      : ['archivo', 'funcion', 'linea_inicio', 'linea_fin', 'nodos_N', 'aristas_E', 'predicados_P', 'VG', 'riesgo'];
    const rows = [head];
    state.results.forEach((r) => rows.push([r.file, r.name, r.line, r.endLine, r.m.N, r.m.E, r.m.P, r.m.V, McC.risk(r.m.V).label]));
    const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    download(McC.uiLang === 'en' ? 'mccabe-complexity.csv' : 'complejidad-mccabe.csv', '﻿' + csv, 'text/csv;charset=utf-8');
  });

  /* ------------------------------------------------------------ Detalle */
  function select(r, opts) {
    opts = opts || {};
    stopPlay();
    state.selected = r;
    $$('#tabla tbody tr').forEach((tr) => {
      const on = tr.dataset.key === r.key;
      tr.classList.toggle('sel', on);
      const b = tr.querySelector('.fn-btn'); if (b) b.setAttribute('aria-current', on ? 'true' : 'false');
    });
    const hidden = isHidden(r);
    const g = r.cfg, m = r.m;
    const lay = McC.layoutGraph(g);
    r.lay = lay;
    const num = lay.num;
    state.order = g.nodes.map((n) => n.id).sort((a, b) => num[a] - num[b]);
    const rk = McC.risk(m.V);

    $('#detalle').hidden = false;
    $('#detNombre').textContent = r.name;
    $('#detMeta').textContent = t('det.meta', { file: r.file, lang: McC.LANGS[r.lang].name, a: r.line, b: r.endLine });
    const badge = $('#detBadge');
    if (hidden) {
      badge.className = 'vg-badge vg-hidden';
      badge.innerHTML = `<span class="vg-l">V(G)</span><span class="vg-v">?</span><span class="vg-r">${esc(t('res.hidden'))}</span>`;
    } else {
      badge.className = 'vg-badge r-' + rk.key;
      badge.innerHTML = `<span class="vg-l">V(G)</span><span class="vg-v">${m.V}</span><span class="vg-r">${esc(rk.label)}</span>`;
    }

    // Ejercicio / solución
    $('#quiz').hidden = !hidden;
    $('#solucion').hidden = hidden;
    if (hidden) {
      $('#quizAsk').innerHTML = t('q.ask', { name: esc(r.name) });
      $('#quizInput').value = '';
      $('#quizFb').textContent = '';
      $('#quizFb').className = 'quiz-fb';
    } else {
      const pTerms = m.predicates.map((p) => String(p.weight));
      const pSum = pTerms.length ? (pTerms.length <= 12 ? pTerms.join(' + ') + ' = ' : '') + m.P : '0';
      $('#formulas').innerHTML = `
        <div class="formula"><span class="f-t">${esc(t('f.edges'))}</span><span class="f-eq">V(G) = E − N + 2</span>
          <span class="f-n">= ${m.E} − ${m.N} + 2 = <b>${m.V}</b></span></div>
        <div class="formula"><span class="f-t">${esc(t('f.preds'))}</span><span class="f-eq">V(G) = P + 1</span>
          <span class="f-n">P = ${pSum} → ${m.P} + 1 = <b>${m.VP}</b></span></div>
        <div class="formula"><span class="f-t">${esc(t('f.regions'))}</span><span class="f-eq">V(G) = R</span>
          <span class="f-n">${esc(t('f.regionsTxt', { c: m.V - 1 }))} = <b>${m.V}</b></span></div>`;
      const solvedMsg = state.justSolved && state.justSolved.key === r.key && state.justSolved.msg
        ? `<span class="ok-msg" role="status">✓ ${esc(state.justSolved.msg)}</span> ` : '';
      state.justSolved = null;
      $('#interpretacion').innerHTML = solvedMsg + `<span class="pill r-${rk.key}">${esc(rk.label)}</span> ` +
        t('det.interp', { desc: esc(rk.desc), v: m.V }) +
        (m.V !== m.VP ? ` <span class="warn">${esc(t('det.warn'))}</span>` : '');
      if (!opts.keepTour) state.tour = 0;
    }

    // Grafo
    $('#grafo').innerHTML = McC.graphSVG(g, lay, m, r.name);
    const first = $('#grafo .node');
    if (first) first.setAttribute('tabindex', '0');
    state.zoom = 0; applyZoom();

    // Código fuente
    const f = state.files[r.fileIdx];
    const srcLines = f.src.split(/\r?\n/);
    const decLines = new Map();
    if (!hidden) m.predicates.forEach((p) => {
      if (!p.node.line) return;
      if (!decLines.has(p.node.line)) decLines.set(p.node.line, []);
      decLines.get(p.node.line).push(num[p.node.id]);
    });
    let html = '';
    for (let ln = r.line; ln <= Math.min(r.endLine, srcLines.length); ln++) {
      const d = decLines.get(ln);
      html += `<div class="ln${d ? ' dec' : ''}" data-line="${ln}"><span class="no" aria-hidden="true">${ln}</span><span class="tx">${esc(srcLines[ln - 1]) || ' '}</span>${d ? `<span class="tag">${d.join(', ')}</span>` : ''}</div>`;
    }
    $('#codigo').innerHTML = html;

    // Nodos predicado y caminos
    const locked = `<li class="locked"><span aria-hidden="true">🔒</span> ${esc(t('locked'))}</li>`;
    if (hidden) {
      $('#predCount').textContent = '';
      $('#predicados').innerHTML = locked;
      $('#pathCount').textContent = '';
      $('#caminos').innerHTML = locked;
      state.paths = [];
    } else {
      $('#predCount').textContent = `P = ${m.P}`;
      $('#predicados').innerHTML = m.predicates.length ? m.predicates
        .slice().sort((a, b) => num[a.node.id] - num[b.node.id])
        .map((p) => `<li data-node="${p.node.id}"><span class="nbadge dec" aria-hidden="true">${num[p.node.id]}</span>
          <span class="li-main"><span class="sr-only">${esc(t('nodes.num'))} ${num[p.node.id]}: </span><code>${esc(McC.trunc(p.node.label, 90))}</code>
          <span class="muted small">${esc(t('pred.info', { line: p.node.line || '—', out: m.outdeg[p.node.id], w: p.weight }))}</span></span></li>`).join('')
        : `<li class="muted">${esc(t('pred.none'))}</li>`;

      const paths = McC.basisPaths(g);
      state.paths = paths;
      $('#pathCount').textContent = t('path.count', { n: paths.length, v: m.V });
      $('#caminos').innerHTML = paths.map((p, i) => {
        const seqTxt = p.nodes.map((v) => num[v]).join(' → ');
        const lab = p.flip && g.edges[p.flip.edge].label ? ` (${esc(McC.trunc(g.edges[p.flip.edge].label, 16))})` : '';
        const flip = p.flip ? esc(t('path.flip', { n: num[p.flip.node], lab: '' })) + lab : esc(t('path.base'));
        return `<li data-path="${i}">
          <button type="button" class="play" data-play="${i}" aria-label="${esc(t('path.play', { i: i + 1 }))}"><span aria-hidden="true">▶</span></button>
          <span class="path-id" aria-hidden="true">C${i + 1}</span>
          <span class="li-main"><code>${seqTxt}${p.incomplete ? ' …' : ''}</code><span class="muted small">${flip}</span></span></li>`;
      }).join('');
    }

    // Tabla de nodos
    $('#nodos').innerHTML = state.order.map((id) => {
      const n = g.nodes[id];
      const dec = m.outdeg[id] > 1 && n.kind !== 'end';
      const kind = t('kind.' + (dec ? 'decision' : n.kind === 'decision' ? 'block' : n.kind));
      return `<tr data-node="${id}"><td class="num">${num[id]}</td><td>${esc(kind)}${dec ? ' <span aria-hidden="true">◆</span>' : ''}</td>
        <td class="num">${n.line ? n.line + (n.lineEnd && n.lineEnd !== n.line ? '–' + n.lineEnd : '') : '—'}</td>
        <td><code>${esc(McC.trunc(n.label, 110))}</code></td><td class="num">${m.outdeg[id]}</td></tr>`;
    }).join('');

    if (!hidden) renderTour(); else clearHL();

    if (opts.announce) announce(hidden ? t('live.selectHidden', { name: r.name }) : t('live.select', { name: r.name, v: m.V, risk: rk.label }));
    if (opts.scroll && window.innerWidth < 1200) $('#detalle').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    if (opts.focus) $('#detalle').focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------ Resaltado */
  const grafo = $('#grafo');
  function clearHL() {
    grafo.classList.remove('dim');
    $$('.hl').forEach((el) => el.classList.remove('hl'));
    $$('.cur').forEach((el) => el.classList.remove('cur'));
  }
  function hlLines(n) {
    if (!n || !n.line) return null;
    let firstEl = null;
    for (let ln = n.line; ln <= (n.lineEnd || n.line); ln++) {
      const el = document.querySelector(`#codigo .ln[data-line="${ln}"]`);
      if (el) { el.classList.add('hl'); firstEl = firstEl || el; }
    }
    if (firstEl) {
      const box = $('#codigo');
      const top = firstEl.offsetTop - box.offsetTop;
      if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 30) box.scrollTop = Math.max(0, top - 40);
    }
    return firstEl;
  }
  function setHL(o) {
    clearHL();
    if (o.dim !== false) grafo.classList.add('dim');
    (o.nodes || []).forEach((id) => { const el = grafo.querySelector(`.node[data-id="${id}"]`); if (el) el.classList.add('hl'); });
    (o.edges || []).forEach((ix) => { const el = grafo.querySelector(`.edge[data-ix="${ix}"]`); if (el) el.classList.add('hl'); });
  }
  function restoreHL() {
    if (state.playTimer) return;
    const r = state.selected;
    if (r && !isHidden(r)) applyTourHL(); else clearHL();
  }
  function highlightNode(id) {
    const r = state.selected;
    if (!r) return;
    const edges = [];
    r.cfg.edges.forEach((e, ix) => { if (e.from === id || e.to === id) edges.push(ix); });
    setHL({ nodes: [id], edges, dim: false });
    $$(`[data-node="${id}"]`).forEach((el) => el.classList.add('hl'));
    hlLines(r.cfg.nodes[id]);
  }

  grafo.addEventListener('mouseover', (ev) => { const n = ev.target.closest('.node'); if (n && !state.playTimer) highlightNode(+n.dataset.id); });
  grafo.addEventListener('mouseleave', restoreHL);
  grafo.addEventListener('focusin', (ev) => {
    const n = ev.target.closest('.node');
    if (!n) return;
    stopPlay();
    grafo.querySelectorAll('.node').forEach((x) => x.setAttribute('tabindex', '-1'));
    n.setAttribute('tabindex', '0');
    highlightNode(+n.dataset.id);
  });
  grafo.addEventListener('focusout', (ev) => { if (!grafo.contains(ev.relatedTarget)) restoreHL(); });
  grafo.addEventListener('keydown', (ev) => {
    const n = ev.target.closest('.node');
    if (!n) return;
    const cur = +n.dataset.num, max = state.order.length;
    let k = null;
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') k = Math.min(max, cur + 1);
    else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') k = Math.max(1, cur - 1);
    else if (ev.key === 'Home') k = 1;
    else if (ev.key === 'End') k = max;
    else if (ev.key === 'Escape') { n.blur(); restoreHL(); return; }
    else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); highlightNode(+n.dataset.id); announce(n.getAttribute('aria-label')); return; }
    if (k === null) return;
    ev.preventDefault();
    const el = grafo.querySelector(`.node[data-num="${k}"]`);
    if (el) { el.focus(); if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  });
  grafo.addEventListener('click', (ev) => { const n = ev.target.closest('.node'); if (n) n.focus(); });

  ['#predicados', '#nodos'].forEach((sel) => {
    $(sel).addEventListener('mouseover', (ev) => { const li = ev.target.closest('[data-node]'); if (li && !state.playTimer) highlightNode(+li.dataset.node); });
    $(sel).addEventListener('mouseleave', restoreHL);
  });

  /* ------------------------------------------------------------ Caminos */
  function pathHL(i) {
    const p = state.paths[i];
    if (!p) return;
    setHL({ nodes: p.nodes, edges: p.edges });
    const li = document.querySelector(`#caminos [data-path="${i}"]`);
    if (li) li.classList.add('hl');
  }
  function stopPlay() {
    if (state.playTimer) { clearTimeout(state.playTimer); state.playTimer = null; }
    $$('#caminos .playing').forEach((el) => el.classList.remove('playing'));
  }
  function playPath(i) {
    stopPlay();
    const r = state.selected, p = state.paths[i];
    if (!p || !r) return;
    const li = document.querySelector(`#caminos [data-path="${i}"]`);
    announce(t('path.playing', { i: i + 1, seq: p.nodes.map((v) => r.lay.num[v]).join(', ') }));
    if (reduceMotion.matches) { pathHL(i); return; }
    clearHL();
    grafo.classList.add('dim');
    li.classList.add('playing', 'hl');
    let k = 0;
    const tick = () => {
      if (k >= p.nodes.length) {
        state.playTimer = null;
        li.classList.remove('playing');
        $$('#codigo .cur').forEach((el) => el.classList.remove('cur'));
        return;
      }
      const v = p.nodes[k];
      const nodeEl = grafo.querySelector(`.node[data-id="${v}"]`);
      grafo.querySelectorAll('.node.cur').forEach((el) => el.classList.remove('cur'));
      if (nodeEl) nodeEl.classList.add('hl', 'cur');
      if (k > 0) { const e = grafo.querySelector(`.edge[data-ix="${p.edges[k - 1]}"]`); if (e) e.classList.add('hl'); }
      $$('#codigo .hl').forEach((el) => el.classList.remove('hl'));
      hlLines(r.cfg.nodes[v]);
      k++;
      state.playTimer = setTimeout(tick, 560);
    };
    tick();
  }
  $('#caminos').addEventListener('click', (ev) => { const b = ev.target.closest('[data-play]'); if (b) playPath(+b.dataset.play); });
  $('#caminos').addEventListener('mouseover', (ev) => { const li = ev.target.closest('[data-path]'); if (li && !state.playTimer) pathHL(+li.dataset.path); });
  $('#caminos').addEventListener('mouseleave', restoreHL);
  $('#caminos').addEventListener('focusin', (ev) => { const li = ev.target.closest('[data-path]'); if (li && !state.playTimer) pathHL(+li.dataset.path); });

  /* ------------------------------------------------------------ Recorrido guiado */
  function tourVars() {
    const r = state.selected, m = r.m, rk = McC.risk(m.V);
    return {
      name: esc(r.name), N: m.N, E: m.E, P: m.P, V: m.V, VP: m.VP, c: m.V - 1,
      blocks: m.N - 2 - m.predicates.length, preds: m.predicates.length,
      risk: esc(rk.label), desc: esc(rk.desc),
    };
  }
  function renderTour() {
    const s = state.tour;
    $('#tourStep').textContent = t('tour.step', { i: s + 1, n: TOUR_N });
    $('#tourStepTitle').textContent = t(`tour.s${s}.t`);
    $('#tourText').innerHTML = t(`tour.s${s}.d`, tourVars());
    $('#tourDots').innerHTML = Array.from({ length: TOUR_N }, (_, i) => `<li class="${i === s ? 'on' : i < s ? 'done' : ''}"></li>`).join('');
    $('#tourPrev').disabled = s === 0;
    $('#tourNext').textContent = s === TOUR_N - 1 ? t('tour.restart') : t('tour.next');
    applyTourHL();
  }
  function applyTourHL() {
    const r = state.selected;
    if (!r) return;
    const all = r.cfg.nodes.map((n) => n.id);
    const preds = r.m.predicates.map((p) => p.node.id);
    switch (state.tour) {
      case 1: setHL({ nodes: all }); break;
      case 2: setHL({ edges: r.cfg.edges.map((e, ix) => ix) }); break;
      case 3: case 5: setHL({ nodes: preds }); break;
      case 7: pathHL(0); break;
      default: clearHL();
    }
  }
  $('#tourPrev').addEventListener('click', () => { if (state.tour > 0) { stopPlay(); state.tour--; renderTour(); } });
  $('#tourNext').addEventListener('click', () => { stopPlay(); state.tour = (state.tour + 1) % TOUR_N; renderTour(); });

  /* ------------------------------------------------------------ Modo práctica */
  function reveal(r, msg) {
    state.revealed.add(r.key);
    state.justSolved = { key: r.key, msg };
    renderSummary();
    renderTable();
    select(r, {});
    if (msg) announce(msg);
    $('#detalle').focus({ preventScroll: true });
  }
  $('#quiz').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const r = state.selected;
    if (!r) return;
    const fb = $('#quizFb');
    const v = parseInt($('#quizInput').value, 10);
    if (!(v >= 1)) { fb.textContent = t('q.invalid'); fb.className = 'quiz-fb bad'; $('#quizInput').focus(); return; }
    if (v === r.m.V) { reveal(r, t('q.ok', { v })); return; }
    const a = (state.attempts[r.key] || 0) + 1;
    state.attempts[r.key] = a;
    const hint = a === 1 ? t('q.hint1') : a === 2 ? t('q.hint2') : t('q.hint3', { N: r.m.N, E: r.m.E });
    fb.textContent = (v < r.m.V ? t('q.low') : t('q.high')) + ' ' + hint;
    fb.className = 'quiz-fb bad';
    $('#quizInput').select();
  });
  $('#quizReveal').addEventListener('click', () => { if (state.selected) reveal(state.selected, ''); });

  /* ------------------------------------------------------------ Zoom y exportación */
  function applyZoom() {
    const svg = $('#grafo svg');
    const lay = state.selected && state.selected.lay;
    if (!svg || !lay) return;
    if (state.zoom === 0) {
      const avail = grafo.clientWidth - 16;
      state.zoomScale = Math.min(1.25, Math.max(0.35, avail / lay.width));
    }
    svg.style.width = lay.width * state.zoomScale + 'px';
    svg.style.height = lay.height * state.zoomScale + 'px';
  }
  document.querySelector('.zoom').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-z]');
    if (!b) return;
    const z = +b.dataset.z;
    if (z === 0) state.zoom = 0;
    else { state.zoom = 1; state.zoomScale = Math.min(3, Math.max(0.2, state.zoomScale * (z > 0 ? 1.25 : 0.8))); }
    applyZoom();
  });
  let resizeT = null;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (state.zoom === 0) applyZoom(); }, 120); });

  $('#btnSVG').addEventListener('click', () => {
    const svg = $('#grafo svg');
    if (!svg) return;
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    const style = `<style>
      svg{background:${v('--surface')};font-family:system-ui,sans-serif}
      .edge{fill:none;stroke:${v('--edge')};stroke-width:1.6}.edge.back{stroke:${v('--edge-back')};stroke-dasharray:5 3}
      .ah{fill:${v('--edge')}}.ah-back{fill:${v('--edge-back')}}
      .elabel{font-size:11px;font-weight:600;fill:${v('--muted')}}.elabel.t{fill:${v('--ok')}}.elabel.f{fill:${v('--crit')}}
      .node circle,.node rect{fill:${v('--node-fill')};stroke:${v('--node-stroke')};stroke-width:1.6}
      .node.dec rect{fill:${v('--dec-fill')};stroke:${v('--dec-stroke')}}
      .node.k-start circle,.node.k-end circle{fill:${v('--term-fill')};stroke:${v('--term-fill')}}
      .node text{font-size:12px;font-weight:600;text-anchor:middle;fill:${v('--text')}}
      .node.k-start text,.node.k-end text{fill:${v('--term-text')}}.node text.cap{text-anchor:start;fill:${v('--muted')};font-weight:400}
    </style>`;
    const clone = svg.cloneNode(true);
    clone.removeAttribute('style');
    clone.querySelectorAll('.hl,.cur').forEach((el) => el.classList.remove('hl', 'cur'));
    const xml = new XMLSerializer().serializeToString(clone).replace(/(<svg[^>]*>)/, `$1${style}`);
    const name = (state.selected.name || 'grafo').replace(/[^\w.-]+/g, '_');
    download(`grafo-${name}.svg`, xml, 'image/svg+xml');
  });

  /* ------------------------------------------------------------ Inicio */
  addFile(McC.EJEMPLOS[0].name, McC.EJEMPLOS[0].src, 'auto');
  setUiLang(McC.uiLang, false);
})();
