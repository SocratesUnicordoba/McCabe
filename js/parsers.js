/* =========================================================================
 * Analizadores sintácticos
 *  - Familia C (JS/TS, Java, C/C++, C#, PHP, Go): detecta funciones y
 *    construye un árbol de sentencias de control.
 *  - Python: basado en líneas lógicas e indentación.
 * Resultado: unidades { name, line, endLine, ast, top? }
 * ========================================================================= */
(function () {
  'use strict';
  const McC = window.McC;

  const isOpen = (t) => t.k === 'op' && (t.v === '(' || t.v === '[' || t.v === '{');
  const isClose = (t) => t.k === 'op' && (t.v === ')' || t.v === ']' || t.v === '}');
  const EMPTY = () => ({ type: 'block', body: [] });

  /* ---------------------------------------------------------------------
   * Puntos de decisión dentro de expresiones (familia C)
   * ------------------------------------------------------------------- */
  const LOGICAL = new Set(['&&', '||', '??']);
  const NOT_TERNARY_NEXT = new Set([')', ',', ':', '>', ';', '=', ']', '.', '?', '}']);

  function opsOfC(toks, ctx) {
    const { all, owner, fnId, lang, opts } = ctx;
    const wordOps = McC.LANGS[lang].wordOps;
    const ops = [];
    toks.forEach((t, idx) => {
      if (owner[t.i] !== fnId) return; // pertenece a una función anidada
      let op = null;
      if (t.k === 'op') {
        if (LOGICAL.has(t.v)) { if (opts.logical) op = t.v; }
        else if (t.v === '?') {
          const nx = all[t.i + 1], pv = all[t.i - 1], nn = all[t.i + 2];
          let tern = nx && !(nx.k === 'op' && NOT_TERNARY_NEXT.has(nx.v));
          // tipos anulables de C#: "int? x = ..."
          if (tern && pv && pv.k === 'id' && nx.k === 'id' && nn && ['=', ';', ',', ')'].includes(nn.v)) tern = false;
          if (tern) op = '?:';
        }
      } else if (t.k === 'id' && wordOps) {
        const lv = t.v.toLowerCase();
        if ((lv === 'and' || lv === 'or') && opts.logical) op = lv;
      }
      if (op) ops.push({ op, line: t.line, idx });
    });
    return ops;
  }

  /* ---------------------------------------------------------------------
   * Emparejamiento de paréntesis / llaves / corchetes
   * ------------------------------------------------------------------- */
  function matchBrackets(toks) {
    const m = new Array(toks.length).fill(null);
    const st = [];
    const pairs = { ')': '(', ']': '[', '}': '{' };
    toks.forEach((t, k) => {
      if (t.k !== 'op') return;
      if (t.v === '(' || t.v === '[' || t.v === '{') st.push(k);
      else if (pairs[t.v]) {
        for (let s = st.length - 1; s >= 0; s--) {
          if (toks[st[s]].v === pairs[t.v]) { const o = st[s]; st.length = s; m[o] = k; m[k] = o; break; }
        }
      }
    });
    return m;
  }

  /* ---------------------------------------------------------------------
   * Detección de funciones en lenguajes con llaves
   * ------------------------------------------------------------------- */
  const CTRL = new Set(['if', 'for', 'foreach', 'while', 'switch', 'catch', 'with', 'using', 'lock',
    'fixed', 'synchronized', 'elseif', 'return', 'sizeof', 'typeof', 'await', 'new', 'do', 'else',
    'try', 'finally', 'case', 'throw', 'select', 'when', 'in', 'of', 'delete', 'and', 'or', 'not',
    'echo', 'print', 'range', 'go', 'defer', 'yield', 'instanceof']);
  const STOP_BACK = new Set([...CTRL, 'class', 'struct', 'interface', 'enum', 'namespace', 'union',
    'record', 'trait', 'impl', 'default', 'extends', 'implements', 'module']);
  const SKIP_OPS = new Set([':', '<', '>', ',', '.', '[', ']', '*', '&', '?', '::', '->', '|', '&&', '!']);
  const BEFORE_OK = new Set(['*', '&', '>', '}', ';', '{', ')', ']', '::', '~', ':', ',', '@', '&&']);

  function detectFn(toks, match, b) {
    const prev = toks[b - 1];
    if (!prev) return null;

    // Funciones flecha / lambdas:  (a) => {   x -> {
    if (prev.k === 'op' && (prev.v === '=>' || prev.v === '->')) {
      let k = b - 2;
      if (k >= 0 && toks[k].v === ')' && match[k] != null) k = match[k] - 1; else k = k - 1;
      if (k >= 0 && toks[k].v === 'async') k--;
      if (k >= 1 && toks[k].k === 'op' && (toks[k].v === '=' || toks[k].v === ':') && toks[k - 1].k === 'id')
        return { name: toks[k - 1].v, line: toks[k - 1].line };
      return { name: McC.t('unit.arrow'), line: prev.line };
    }

    // Retroceder desde '{' hasta el ')' de la lista de parámetros
    let j = b - 1, steps = 0;
    while (j >= 0 && steps < 40) {
      const x = toks[j];
      if (x.k === 'op' && x.v === ')') break;
      if (x.k === 'id' && !STOP_BACK.has(x.v)) { j--; steps++; continue; }
      if (x.k === 'op' && SKIP_OPS.has(x.v)) { j--; steps++; continue; }
      return null;
    }
    if (j < 0 || toks[j].v !== ')' || match[j] == null) return null;

    let k = match[j];
    let nameTok = toks[k - 1];
    // Go: retorno múltiple  func f(a int) (int, error) {
    if (nameTok && nameTok.v === ')' && match[k - 1] != null) { k = match[k - 1]; nameTok = toks[k - 1]; }
    // PHP: function ($x) use ($y) {
    if (nameTok && nameTok.v === 'use' && toks[k - 2] && toks[k - 2].v === ')' && match[k - 2] != null) {
      k = match[k - 2]; nameTok = toks[k - 1];
    }
    // C++ / C#: listas de inicialización  Foo(int x) : a(x), base(y) {
    let guard = 0;
    while (nameTok && toks[k - 2] && (toks[k - 2].v === ':' || toks[k - 2].v === ',') &&
      toks[k - 3] && toks[k - 3].v === ')' && match[k - 3] != null && guard++ < 20) {
      k = match[k - 3]; nameTok = toks[k - 1];
    }
    // Genéricos:  foo<T>(x) {
    if (nameTok && nameTok.v === '>') {
      let d = 0, q = k - 1;
      for (; q >= 0; q--) {
        if (toks[q].v === '>') d++; else if (toks[q].v === '<') { d--; if (d === 0) break; }
        else if (toks[q].v === '>>') d += 2;
      }
      if (q > 0) { k = q; nameTok = toks[q - 1]; }
    }
    if (!nameTok) return { name: McC.t('unit.anon'), line: toks[b].line };

    // Funciones anónimas: function (...) {   func (...) {
    if (nameTok.k === 'id' && (nameTok.v === 'function' || nameTok.v === 'func')) {
      const a = toks[k - 2], bb = toks[k - 3];
      let name = McC.t('unit.anon');
      if (a && a.k === 'op' && (a.v === '=' || a.v === ':') && bb && bb.k === 'id') name = bb.v;
      return { name, line: nameTok.line };
    }
    // Sobrecarga de operadores en C++
    if (nameTok.k === 'op' && toks[k - 2] && toks[k - 2].v === 'operator')
      return { name: 'operator' + nameTok.v, line: nameTok.line };

    if (nameTok.k !== 'id' || CTRL.has(nameTok.v)) return null;
    const before = toks[k - 2];
    if (before) {
      if (before.k === 'id' && CTRL.has(before.v)) return null;
      if (before.k === 'op' && !BEFORE_OK.has(before.v)) return null;
      if (before.k === 'str' || before.k === 'num') return null;
    }
    let name = nameTok.v;
    if (before && before.v === '::' && toks[k - 3] && toks[k - 3].k === 'id') name = toks[k - 3].v + '::' + name;
    if (before && before.v === '~') name = '~' + name;
    return { name, line: nameTok.line };
  }

  /* ---------------------------------------------------------------------
   * Parser de sentencias (familia C)
   * ------------------------------------------------------------------- */
  function CParser(ctx, lo, hi) {
    this.ctx = ctx; this.t = ctx.all; this.match = ctx.match;
    this.lang = ctx.lang; this.L = McC.LANGS[ctx.lang];
    this.p = lo; this.hi = hi;
  }
  const P = CParser.prototype;

  P.peek = function (o) { const k = this.p + (o || 0); return k < this.hi ? this.t[k] : null; };
  P.is = function (v, o) { const t = this.peek(o); return !!t && t.v === v; };
  P.kw = function (t) { return !t || t.k !== 'id' ? null : (this.lang === 'php' ? t.v.toLowerCase() : t.v); };
  P.closeOf = function (tok) { const c = this.match[tok.i]; return c != null && c < this.hi ? c : null; };

  P.mkExpr = function (toks) {
    const last = toks[toks.length - 1];
    const ref = toks[0] || this.peek() || this.t[Math.max(0, this.p - 1)] || { line: 0 };
    return { text: McC.join(toks), toks, ops: opsOfC(toks, this.ctx), line: ref.line, lineEnd: last ? last.line : ref.line };
  };

  P.parseStatements = function (top) {
    const out = [];
    while (this.p < this.hi) {
      const t = this.peek();
      if (t.k === 'op' && t.v === '}') { if (top) { this.p++; continue; } break; }
      const before = this.p;
      const s = this.parseStatement();
      if (s) out.push(s);
      if (this.p === before) this.p++;
    }
    return out;
  };

  P.parseBlock = function () {
    const open = this.peek();
    this.p++;
    const body = this.parseStatements(false);
    if (this.is('}')) this.p++;
    return { type: 'block', body, line: open.line };
  };

  P.parseStatement = function () {
    const t = this.peek();
    if (!t) return null;
    if (t.k === 'op') {
      if (t.v === '{') return this.parseBlock();
      if (t.v === ';') { this.p++; return null; }
    }
    if (t.k === 'id') {
      const v = this.kw(t);
      switch (v) {
        case 'if': case 'elseif': return this.parseIf();
        case 'while': return this.parseLoop('while');
        case 'for': case 'foreach': return this.parseLoop('for');
        case 'do': if (this.lang !== 'go') return this.parseDo(); break;
        case 'switch': return this.parseSwitch();
        case 'select': if (this.lang === 'go') return this.parseSwitch(); break;
        case 'try': return this.parseTry();
        case 'return': case 'throw': {
          this.p++;
          const e = this.mkExpr(this.parseSimpleToks());
          e.type = v; e.text = v + (e.text ? ' ' + e.text : ''); e.line = t.line;
          return e;
        }
        case 'break': case 'continue': {
          this.p++;
          const n = this.peek();
          if (n && n.k === 'id' && !n.nl) this.p++; // etiqueta
          if (this.is(';')) this.p++;
          return { type: v, line: t.line, lineEnd: t.line, text: v, ops: [] };
        }
        case 'fallthrough':
          this.p++; if (this.is(';')) this.p++;
          return { type: 'fallthrough', line: t.line, text: v, ops: [] };
        case 'else':
          this.p++; return this.parseStatement();
      }
      // Etiquetas:  externo:
      const n = this.peek(1), n2 = this.peek(2);
      if (n && n.k === 'op' && n.v === ':' && !(n2 && n2.v === ':') && v !== 'default' && v !== 'case') {
        this.p += 2; return null;
      }
    }
    const toks = this.parseSimpleToks();
    if (!toks.length) return null;
    const e = this.mkExpr(toks);
    e.type = 'simple';
    return e;
  };

  P.parseCond = function () {
    const t = this.peek();
    if (!t) return this.mkExpr([]);
    let toks;
    if (!this.L.parenless && t.v === '(') {
      const c = this.closeOf(t);
      const e = c != null ? c : this.hi;
      toks = this.t.slice(t.i + 1, e);
      this.p = Math.min(e + 1, this.hi);
    } else {
      toks = []; let d = 0;
      while (this.p < this.hi) {
        const x = this.t[this.p];
        if (x.k === 'op') {
          if (x.v === '{' && d === 0) break;
          if (isOpen(x)) d++;
          else if (isClose(x)) { if (d === 0) break; d--; }
        }
        toks.push(x); this.p++;
      }
    }
    return this.mkExpr(toks);
  };

  P.parseIf = function () {
    const kwTok = this.peek(); this.p++;
    const cond = this.parseCond();
    const then = this.parseStatement() || EMPTY();
    let els = null;
    const n = this.peek();
    const nv = this.kw(n);
    if (nv === 'else') { this.p++; els = this.parseStatement() || EMPTY(); }
    else if (nv === 'elseif') { els = this.parseIf(); }
    return { type: 'if', cond, then, else: els, line: kwTok.line, kw: 'if' };
  };

  P.parseLoop = function (kind) {
    const kwTok = this.peek(); this.p++;
    const cond = this.parseCond();
    let infinite = false;
    if (kind === 'for') {
      if (cond.toks.length === 0) infinite = true;
      else {
        const semis = []; let d = 0;
        cond.toks.forEach((x, k) => {
          if (x.k !== 'op') return;
          if (isOpen(x)) d++; else if (isClose(x)) d--;
          else if (x.v === ';' && d === 0) semis.push(k);
        });
        if (semis.length === 2 && semis[1] === semis[0] + 1) infinite = true;
      }
    }
    let body;
    if (this.is(';')) { this.p++; body = EMPTY(); }
    else body = this.parseStatement() || EMPTY();
    return { type: kind, cond, body, infinite, line: kwTok.line, kw: kwTok.v };
  };

  P.parseDo = function () {
    const kwTok = this.peek(); this.p++;
    const body = this.parseStatement() || EMPTY();
    let cond = this.mkExpr([]);
    if (this.kw(this.peek()) === 'while') { this.p++; cond = this.parseCond(); }
    if (this.is(';')) this.p++;
    return { type: 'dowhile', body, cond, line: kwTok.line };
  };

  P.parseSwitch = function () {
    const kwTok = this.peek(); this.p++;
    const expr = (this.lang === 'go' && kwTok.v === 'select') ? this.mkExpr([]) : this.parseCond();
    const node = { type: 'switch', expr, cases: [], line: kwTok.line, kw: kwTok.v, noFall: !!this.L.noFall };
    if (!this.is('{')) return node;
    const open = this.peek();
    const close = this.closeOf(open);
    this.p++;
    const savedHi = this.hi;
    if (close != null) this.hi = close;
    let cur = null;
    while (this.p < this.hi) {
      const t = this.peek();
      const v = this.kw(t);
      const nx = this.peek(1);
      if (v === 'case' || (v === 'default' && nx && (nx.v === ':' || nx.v === '->'))) {
        this.p++;
        const lab = []; let d = 0;
        if (v === 'case') {
          while (this.p < this.hi) {
            const x = this.t[this.p];
            if (x.k === 'op') {
              if (d === 0 && (x.v === ':' || x.v === '->')) break;
              if (isOpen(x)) d++; else if (isClose(x)) d--;
            }
            lab.push(x); this.p++;
          }
        }
        const sep = this.peek();
        if (sep && (sep.v === ':' || sep.v === '->' || sep.v === ';')) {
          if (sep.v === '->') node.noFall = true;
          this.p++;
        }
        cur = { label: v === 'case' ? McC.join(lab) : 'default', isDefault: v === 'default', body: [], line: t.line };
        node.cases.push(cur);
        continue;
      }
      const before = this.p;
      const s = this.parseStatement();
      if (s && cur) cur.body.push(s);
      if (this.p === before) this.p++;
    }
    this.hi = savedHi;
    if (close != null) this.p = close + 1;
    return node;
  };

  P.parseTry = function () {
    const kwTok = this.peek(); this.p++;
    if (this.is('(')) { const c = this.closeOf(this.peek()); this.p = c != null ? c + 1 : this.p + 1; }
    const body = this.parseStatement() || EMPTY();
    const node = { type: 'try', body, catches: [], fin: null, line: kwTok.line };
    while (this.kw(this.peek()) === 'catch') {
      const ct = this.peek(); this.p++;
      let label = '';
      if (this.is('(')) {
        const c = this.closeOf(this.peek());
        if (c != null) { label = McC.join(this.t.slice(this.p + 1, c)); this.p = c + 1; } else this.p++;
      }
      if (this.kw(this.peek()) === 'when') { this.p++; this.parseCond(); }
      const b = this.parseStatement() || EMPTY();
      node.catches.push({ label, body: b, line: ct.line, kw: 'catch' });
    }
    if (this.kw(this.peek()) === 'finally') { this.p++; node.fin = this.parseStatement() || EMPTY(); }
    return node;
  };

  const CONT_AFTER_OK = new Set([')', ']', '}', '++', '--']);
  const BREAK_BEFORE_OPS = new Set(['(', '[', '!', '++', '--', '~', '@']);
  const NO_BREAK_IDS = new Set(['instanceof', 'in', 'of', 'as', 'satisfies']);

  /* Inserción automática de punto y coma (JS, Go) */
  P.asiBreak = function (prev, next) {
    const prevEnds = prev.k !== 'op' || CONT_AFTER_OK.has(prev.v);
    if (!prevEnds) return false;
    if (next.k === 'op') return BREAK_BEFORE_OPS.has(next.v);
    if (next.k === 'id') return !NO_BREAK_IDS.has(next.v);
    return true;
  };

  P.parseSimpleToks = function () {
    const toks = []; let d = 0;
    while (this.p < this.hi) {
      const t = this.t[this.p];
      if (d === 0 && toks.length && t.nl && this.L.asi && this.asiBreak(toks[toks.length - 1], t)) break;
      if (t.k === 'op') {
        if (t.v === ';' && d === 0) { this.p++; break; }
        if (isOpen(t)) d++;
        else if (isClose(t)) {
          if (d === 0) break;
          d--; toks.push(t); this.p++;
          if (d === 0 && t.v === '}') { const nx = this.peek(); if (!nx || nx.nl) break; }
          continue;
        }
      }
      toks.push(t); this.p++;
    }
    return toks;
  };

  McC.parseCLike = function (src, lang, opts) {
    const all = McC.lex(src, lang);
    const match = matchBrackets(all);
    const fns = [];
    for (let b = 0; b < all.length; b++) {
      const t = all[b];
      if (t.k !== 'op' || t.v !== '{' || match[b] == null) continue;
      const r = detectFn(all, match, b);
      if (r) fns.push({ name: r.name, line: r.line, open: b, close: match[b], endLine: all[match[b]].line });
    }
    fns.sort((a, b) => a.open - b.open);
    const owner = new Int32Array(all.length).fill(-1);
    fns.forEach((f, fi) => { for (let k = f.open; k <= f.close; k++) owner[k] = fi; });

    // Nombre compuesto para funciones anidadas anónimas
    fns.forEach((f, fi) => {
      const parent = f.open > 0 ? owner[f.open - 1] : -1;
      if (parent >= 0 && parent !== fi && f.name.startsWith('(')) f.name = fns[parent].name + ' › ' + f.name;
    });

    const units = fns.map((f, fi) => {
      const ctx = { all, match, owner, fnId: fi, lang, opts };
      const ast = new CParser(ctx, f.open + 1, f.close).parseStatements(true);
      return { name: f.name, line: f.line, endLine: f.endLine, ast };
    });

    if (McC.LANGS[lang].top || fns.length === 0) {
      const ctx = { all, match, owner, fnId: -1, lang, opts };
      const ast = new CParser(ctx, 0, all.length).parseStatements(true);
      const last = all[all.length - 1];
      units.unshift({ name: McC.t('unit.main'), line: 1, endLine: last ? last.line : 1, ast, top: true });
    }
    return units;
  };

  /* =====================================================================
   * Python
   * =================================================================== */
  function pyLines(toks) {
    const lines = []; let cur = null, depth = 0;
    for (const t of toks) {
      if (!cur || (t.nl && depth === 0)) { cur = { toks: [], indent: t.col, line: t.line }; lines.push(cur); }
      if (t.k === 'op') {
        if (t.v === '(' || t.v === '[' || t.v === '{') depth++;
        else if (t.v === ')' || t.v === ']' || t.v === '}') depth = Math.max(0, depth - 1);
      }
      cur.toks.push(t);
    }
    lines.forEach((l) => { l.lineEnd = l.toks[l.toks.length - 1].line; });
    return lines;
  }

  function PyParser(lines, opts) { this.lines = lines; this.opts = opts; }
  const Q = PyParser.prototype;

  Q.kw = function (L) {
    const t0 = L.toks[0];
    if (t0.k !== 'id') return null;
    if (t0.v === 'async' && L.toks[1]) return L.toks[1].v;
    return t0.v;
  };
  Q.bodyEnd = function (i, end) {
    const ind = this.lines[i].indent; let j = i + 1;
    while (j < end && this.lines[j].indent > ind) j++;
    return j;
  };
  Q.header = function (L) {
    let depth = 0, lambdas = 0;
    const ts = L.toks;
    for (let k = 0; k < ts.length; k++) {
      const t = ts[k];
      if (t.k === 'op') {
        if (t.v === '(' || t.v === '[' || t.v === '{') depth++;
        else if (t.v === ')' || t.v === ']' || t.v === '}') depth--;
        else if (t.v === ':' && depth === 0) {
          if (lambdas > 0) { lambdas--; continue; }
          return { head: ts.slice(0, k), inline: ts.slice(k + 1) };
        }
      } else if (t.k === 'id' && t.v === 'lambda' && depth === 0) lambdas++;
    }
    return { head: ts, inline: [] };
  };
  Q.ops = function (ts) {
    const ops = [];
    ts.forEach((t, idx) => {
      if (t.k !== 'id') return;
      if ((t.v === 'and' || t.v === 'or') && this.opts.logical) ops.push({ op: t.v, line: t.line, idx });
      else if (t.v === 'if' && idx > 0) ops.push({ op: 'if-expr', line: t.line, idx });
      else if (t.v === 'for' && idx > 0) ops.push({ op: 'for-comp', line: t.line, idx });
    });
    return ops;
  };
  Q.expr = function (ts, fallbackLine) {
    const last = ts[ts.length - 1];
    return { text: McC.join(ts), toks: ts, ops: this.ops(ts), line: ts[0] ? ts[0].line : fallbackLine, lineEnd: last ? last.line : fallbackLine };
  };
  Q.simpleFromToks = function (ts) {
    if (!ts.length) return null;
    const k = ts[0].k === 'id' ? ts[0].v : null;
    if (k === 'return' || k === 'raise') {
      const e = this.expr(ts.slice(1), ts[0].line);
      e.type = k === 'return' ? 'return' : 'throw'; e.text = McC.join(ts); e.line = ts[0].line;
      return e;
    }
    if (k === 'break' || k === 'continue') return { type: k, line: ts[0].line, lineEnd: ts[0].line, text: k, ops: [] };
    const e = this.expr(ts, ts[0].line); e.type = 'simple';
    return e;
  };
  Q.inlineStmts = function (ts) {
    const out = []; let d = 0, start = 0;
    for (let k = 0; k <= ts.length; k++) {
      const t = ts[k];
      if (t && t.k === 'op') {
        if (t.v === '(' || t.v === '[' || t.v === '{') d++;
        else if (t.v === ')' || t.v === ']' || t.v === '}') d--;
      }
      if (k === ts.length || (t.k === 'op' && t.v === ';' && d === 0)) {
        const s = this.simpleFromToks(ts.slice(start, k));
        if (s) out.push(s);
        start = k + 1;
      }
    }
    return out;
  };
  Q.suite = function (i, end) {
    const L = this.lines[i];
    const h = this.header(L);
    const j = this.bodyEnd(i, end);
    const body = h.inline.length ? this.inlineStmts(h.inline) : this.parseStmts(i + 1, j);
    return { head: h.head, body, next: j };
  };
  Q.headOf = function (L, head) { return head.slice(L.toks[0].v === 'async' ? 2 : 1); };

  Q.parseIf = function (i, end) {
    const L = this.lines[i];
    const s = this.suite(i, end);
    const node = { type: 'if', kw: 'if', cond: this.expr(this.headOf(L, s.head), L.line), then: { type: 'block', body: s.body }, else: null, line: L.line };
    let n = s.next;
    if (n < end && this.lines[n].indent === L.indent) {
      const k = this.kw(this.lines[n]);
      if (k === 'elif') { const r = this.parseIf(n, end); node.else = r.node; n = r.next; }
      else if (k === 'else') { const e = this.suite(n, end); node.else = { type: 'block', body: e.body }; n = e.next; }
    }
    return { node, next: n };
  };

  Q.parseStmts = function (i, end) {
    const out = [];
    while (i < end) {
      const L = this.lines[i];
      const k = this.kw(L);
      if (k === 'if') { const r = this.parseIf(i, end); out.push(r.node); i = r.next; continue; }
      if (k === 'while' || k === 'for') {
        const s = this.suite(i, end);
        const node = { type: k, kw: k, cond: this.expr(this.headOf(L, s.head), L.line), body: { type: 'block', body: s.body }, line: L.line };
        i = s.next;
        if (i < end && this.lines[i].indent === L.indent && this.kw(this.lines[i]) === 'else') {
          const e = this.suite(i, end); node.orelse = { type: 'block', body: e.body }; i = e.next;
        }
        out.push(node); continue;
      }
      if (k === 'try') {
        const s = this.suite(i, end);
        const node = { type: 'try', body: { type: 'block', body: s.body }, catches: [], fin: null, line: L.line };
        i = s.next;
        while (i < end && this.lines[i].indent === L.indent) {
          const k2 = this.kw(this.lines[i]);
          if (k2 === 'except') {
            const c = this.suite(i, end);
            node.catches.push({ label: McC.join(c.head.slice(1)), body: { type: 'block', body: c.body }, line: this.lines[i].line, kw: 'except' });
            i = c.next;
          } else if (k2 === 'else') { const c = this.suite(i, end); node.orelse = { type: 'block', body: c.body }; i = c.next; }
          else if (k2 === 'finally') { const c = this.suite(i, end); node.fin = { type: 'block', body: c.body }; i = c.next; }
          else break;
        }
        out.push(node); continue;
      }
      if (k === 'with') {
        const s = this.suite(i, end);
        const h = this.expr(s.head, L.line); h.type = 'simple';
        out.push({ type: 'block', body: [h].concat(s.body) });
        i = s.next; continue;
      }
      if (k === 'match' && L.toks.length > 1 && this.header(L).inline.length === 0) {
        const h = this.header(L);
        const j = this.bodyEnd(i, end);
        const node = { type: 'switch', kw: 'match', expr: this.expr(h.head.slice(1), L.line), cases: [], line: L.line, noFall: true, py: true };
        let q = i + 1;
        while (q < j) {
          const c = this.suite(q, j);
          const label = McC.join(c.head.slice(1));
          node.cases.push({ label, isDefault: label === '_', body: c.body, line: this.lines[q].line });
          q = c.next;
        }
        out.push(node); i = j; continue;
      }
      if (k === 'def' || k === 'class') {
        const j = this.bodyEnd(i, end);
        out.push({ type: 'simple', text: McC.join(this.header(L).head), ops: [], line: L.line, lineEnd: L.line });
        i = j; continue;
      }
      if (k === 'elif' || k === 'else' || k === 'except' || k === 'finally' || k === 'case') {
        const s = this.suite(i, end); out.push(...s.body); i = s.next; continue;
      }
      out.push(...this.inlineStmts(L.toks));
      i = this.bodyEnd(i, end);
    }
    return out;
  };

  McC.parsePython = function (src, opts) {
    const toks = McC.lex(src, 'py');
    const lines = pyLines(toks);
    const P = new PyParser(lines, opts);
    const units = [];
    const stack = [];
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      while (stack.length && stack[stack.length - 1].indent >= L.indent) stack.pop();
      const k = P.kw(L);
      if (k === 'def' || k === 'class') {
        const nameTok = L.toks[L.toks[0].v === 'async' ? 2 : 1];
        const name = nameTok ? nameTok.v : '?';
        if (k === 'def') {
          const end = P.bodyEnd(i, lines.length);
          const s = P.suite(i, end);
          const full = stack.map((x) => x.name).concat(name).join('.');
          units.push({ name: full, line: L.line, endLine: lines[end - 1].lineEnd, ast: s.body });
        }
        stack.push({ indent: L.indent, name });
      }
    }
    const top = P.parseStmts(0, lines.length);
    const last = lines[lines.length - 1];
    units.unshift({ name: McC.t('unit.main'), line: 1, endLine: last ? last.lineEnd : 1, ast: top, top: true });
    return units;
  };
})();
