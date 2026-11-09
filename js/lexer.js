/* =========================================================================
 * Analizador léxico multi-lenguaje
 * Convierte el código fuente en tokens, eliminando comentarios y cadenas
 * para que no generen falsos puntos de decisión.
 * ========================================================================= */
(function () {
  'use strict';
  const McC = (window.McC = window.McC || {});

  McC.LANGS = {
    js:   { name: 'JavaScript / TypeScript', family: 'c', line: ['//'], asi: true, regex: true, tmpl: true, dollar: true, top: true },
    java: { name: 'Java', family: 'c', line: ['//'] },
    c:    { name: 'C / C++', family: 'c', line: ['//'], pre: true },
    cs:   { name: 'C#', family: 'c', line: ['//'], pre: true },
    php:  { name: 'PHP', family: 'c', line: ['//', '#'], dollar: true, wordOps: true, top: true },
    go:   { name: 'Go', family: 'c', line: ['//'], asi: true, parenless: true, noFall: true, raw: true },
    py:   { name: 'Python', family: 'py', line: ['#'], triple: true, wordOps: true, top: true },
  };

  McC.EXT = {
    js: 'js', mjs: 'js', cjs: 'js', jsx: 'js', ts: 'js', tsx: 'js',
    java: 'java',
    c: 'c', h: 'c', cpp: 'c', cc: 'c', cxx: 'c', hpp: 'c', hh: 'c',
    cs: 'cs', php: 'php', go: 'go', py: 'py', pyw: 'py',
  };

  const byLen = (a, b) => b.length - a.length;
  const C_OPS = ['>>>=', '===', '!==', '**=', '<<=', '>>=', '>>>', '...', '??=', '&&=', '||=', '<=>',
    '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '=>', '->', '::', '++', '--', '+=', '-=', '*=',
    '/=', '%=', '&=', '|=', '^=', '<<', '>>', '**', ':='].sort(byLen);
  const GO_OPS = C_OPS.concat(['<-']).sort(byLen);
  const PY_OPS = ['**=', '//=', '>>=', '<<=', '==', '!=', '<=', '>=', '->', '**', '//', '+=', '-=',
    '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', ':=', '...'].sort(byLen);

  const KW_BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new',
    'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);
  const ID_START = /[A-Za-z_À-￿]/;
  const ID_PART = /[\wÀ-￿]/;

  /**
   * Devuelve un arreglo de tokens {v, k, line, col, nl, i}
   *  k: 'id' | 'num' | 'str' | 're' | 'op'
   *  nl: true si el token es el primero de su línea física
   */
  McC.lex = function (src, lang) {
    const L = McC.LANGS[lang];
    const ops = L.family === 'py' ? PY_OPS : lang === 'go' ? GO_OPS : C_OPS;
    const toks = [];
    const n = src.length;
    let i = 0, line = 1, ls = 0, nl = true;

    const add = (v, k, stLine, stCol) => {
      toks.push({ v, k, line: stLine, col: stCol, nl, i: toks.length });
      nl = false;
    };
    const advanceLines = (from, to) => {
      for (let k = from; k < to; k++) if (src.charCodeAt(k) === 10) { line++; ls = k + 1; }
    };

    if (src.startsWith('#!')) { while (i < n && src[i] !== '\n') i++; }

    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; ls = i; nl = true; continue; }
      if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v' || c === '﻿') { i++; continue; }

      // Continuación de línea con barra invertida
      if (c === '\\' && (src[i + 1] === '\n' || (src[i + 1] === '\r' && src[i + 2] === '\n'))) {
        const j = src.indexOf('\n', i) + 1; line++; ls = j; i = j; continue;
      }
      // Directivas de preprocesador (C, C++, C#)
      if (L.pre && c === '#' && nl) {
        while (i < n && src[i] !== '\n') {
          if (src[i] === '\\' && (src[i + 1] === '\n' || src[i + 1] === '\r')) {
            const j = src.indexOf('\n', i) + 1; line++; ls = j; i = j; continue;
          }
          i++;
        }
        continue;
      }
      // Comentarios de línea
      let isLineComment = false;
      for (const p of L.line) if (src.startsWith(p, i)) { isLineComment = true; break; }
      if (isLineComment) { while (i < n && src[i] !== '\n') i++; continue; }
      // Comentarios de bloque
      if (L.family === 'c' && c === '/' && src[i + 1] === '*') {
        let e = src.indexOf('*/', i + 2); e = e < 0 ? n : e + 2;
        advanceLines(i, e); i = e; continue;
      }

      const stLine = line, stCol = i - ls;

      // Cadenas triples de Python
      if (L.triple && (src.startsWith('"""', i) || src.startsWith("'''", i))) {
        const q = src.substr(i, 3); let j = i + 3;
        while (j < n && !src.startsWith(q, j)) { if (src[j] === '\\') j++; j++; }
        j = Math.min(n, j + 3);
        add(src.slice(i, j), 'str', stLine, stCol); advanceLines(i, j); i = j; continue;
      }
      // Cadenas y caracteres
      if (c === '"' || c === "'" || (c === '`' && (L.tmpl || L.raw))) {
        const raw = c === '`' && L.raw;
        const multi = c === '`';
        let j = i + 1, closed = false;
        while (j < n) {
          const ch = src[j];
          if (ch === c) { closed = true; break; }
          if (ch === '\\' && !raw) { j += 2; continue; }
          if (ch === '\n' && !multi) break;
          j++;
        }
        if (closed) j++;
        add(src.slice(i, j), 'str', stLine, stCol); advanceLines(i, j); i = j; continue;
      }
      // Expresiones regulares literales (JavaScript)
      if (L.regex && c === '/') {
        const prev = toks[toks.length - 1];
        const allowed = !prev || (prev.k === 'op' && !')]}'.includes(prev.v)) ||
          (prev.k === 'id' && KW_BEFORE_REGEX.has(prev.v));
        if (allowed) {
          let j = i + 1, cls = false, ok = false;
          while (j < n) {
            const ch = src[j];
            if (ch === '\\') { j += 2; continue; }
            if (ch === '\n') break;
            if (ch === '[') cls = true;
            else if (ch === ']') cls = false;
            else if (ch === '/' && !cls) { ok = true; break; }
            j++;
          }
          if (ok) {
            j++;
            while (j < n && /[a-z]/i.test(src[j])) j++;
            add(src.slice(i, j), 're', stLine, stCol); i = j; continue;
          }
        }
      }
      // Identificadores y palabras clave
      if (ID_START.test(c) || (L.dollar && c === '$')) {
        let j = i + 1;
        while (j < n && (ID_PART.test(src[j]) || (L.dollar && src[j] === '$'))) j++;
        add(src.slice(i, j), 'id', stLine, stCol); i = j; continue;
      }
      // Números
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        let j = i + 1;
        const hex = /^0[xX]/.test(src.slice(i, i + 2));
        while (j < n && /[0-9A-Za-z_.]/.test(src[j])) {
          if (!hex && (src[j] === 'e' || src[j] === 'E') && (src[j + 1] === '+' || src[j + 1] === '-')) j++;
          j++;
        }
        add(src.slice(i, j), 'num', stLine, stCol); i = j; continue;
      }
      // Operadores y puntuación
      let op = null;
      for (const o of ops) if (src.startsWith(o, i)) { op = o; break; }
      if (!op) op = c;
      add(op, 'op', stLine, stCol);
      i += op.length;
    }
    return toks;
  };

  /* Reconstruye texto legible a partir de tokens */
  const NO_SPACE_BEFORE = new Set([')', ']', ',', ';', '.', '?.', '::']);
  const NO_SPACE_AFTER = new Set(['(', '[', '.', '?.', '::', '!', '~', '@']);
  const SPACE_BEFORE_PAREN = new Set(['if', 'for', 'foreach', 'while', 'switch', 'catch', 'return',
    'and', 'or', 'not', 'in', 'elif', 'except', 'with', 'using', 'lock']);

  McC.join = function (toks) {
    let s = '';
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k], p = toks[k - 1];
      if (p) {
        let sp = true;
        if (t.k === 'op' && NO_SPACE_BEFORE.has(t.v)) sp = false;
        else if (p.k === 'op' && NO_SPACE_AFTER.has(p.v)) sp = false;
        else if (t.k === 'op' && (t.v === '(' || t.v === '[') &&
          ((p.k === 'id' && !SPACE_BEFORE_PAREN.has(p.v)) || p.v === ')' || p.v === ']')) sp = false;
        else if (t.k === 'op' && (t.v === '++' || t.v === '--') && p.k === 'id') sp = false;
        if (sp) s += ' ';
      }
      s += t.v;
    }
    return s;
  };

  McC.trunc = function (s, max) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  };

  /* Detección automática del lenguaje */
  McC.detectLang = function (name, src) {
    const ext = ((name || '').split('.').pop() || '').toLowerCase();
    if (McC.EXT[ext]) return McC.EXT[ext];
    if (/<\?php/i.test(src)) return 'php';
    const colon = (src.match(/:\s*(#.*)?$/gm) || []).length;
    const brace = (src.match(/\{\s*$/gm) || []).length;
    if (colon > brace && /^\s*(def|class|if|for|while|import|from)\b/m.test(src)) return 'py';
    if (/^\s*package\s+\w+\s*$/m.test(src) || /\bfunc\s+(\([^)]*\)\s*)?\w+\s*\(/.test(src)) return 'go';
    if (/#include\s*[<"]/.test(src)) return 'c';
    if (/\busing\s+System\b|\bnamespace\s+[\w.]+\s*[{;]/.test(src)) return 'cs';
    if (/\b(public|private|protected)\s+(static\s+)?(final\s+)?(class|void|int|String|double|boolean)\b/.test(src)) return 'java';
    return 'js';
  };
})();
