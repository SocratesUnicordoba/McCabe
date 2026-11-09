/* =========================================================================
 * Grafo de flujo de control (CFG) y métricas de McCabe
 *   V(G) = E − N + 2      (aristas, nodos)
 *   V(G) = P + 1          (nodos predicado, ponderados por sus salidas)
 *   V(G) = R              (regiones del grafo plano, fórmula de Euler)
 * ========================================================================= */
(function () {
  'use strict';
  const McC = window.McC;

  const OR_LIKE = new Set(['||', 'or', '??']);
  const OP_LABEL = { '?:': '?:', 'if-expr': 'if (expr.)', 'for-comp': 'for (compr.)' };
  const opLabel = (op) => OP_LABEL[op.op] || op.op;

  /* Divide el texto de una condición en sus operandos para etiquetar nodos */
  function splitParts(c) {
    const ops = c.ops || [];
    if (!c.toks || !ops.length) return [c.text || ''];
    const parts = []; let prev = 0;
    ops.forEach((op) => { parts.push(McC.join(c.toks.slice(prev, op.idx))); prev = op.idx + 1; });
    parts.push(McC.join(c.toks.slice(prev)));
    return parts;
  }

  McC.buildCFG = function (ast) {
    const nodes = [], edges = [];
    const mk = (kind, label, line, lineEnd) => {
      nodes.push({ id: nodes.length, kind, label, line: line || null, lineEnd: lineEnd || line || null });
      return nodes.length - 1;
    };
    const edge = (a, b, l) => edges.push({ from: a, to: b, label: l || '' });
    const conn = (preds, b) => preds.forEach((p) => edge(p.n, b, p.l));

    const START = mk('start', McC.t('node.start'));
    const END = mk('end', McC.t('node.end'));

    /* Condición (posiblemente compuesta) → cadena de nodos predicado */
    function cond(c, preds, kw) {
      const ops = c.ops || [];
      const parts = splitParts(c);
      const ids = [];
      for (let k = 0; k <= ops.length; k++) {
        const label = k === 0 ? `${kw} ${parts[0] || ''}`.trim() : `${opLabel(ops[k - 1])} ${parts[k] || ''}`;
        ids.push(mk('decision', label, k === 0 ? c.line : ops[k - 1].line));
      }
      conn(preds, ids[0]);
      const t = [], f = [];
      for (let k = 0; k < ops.length; k++) {
        if (OR_LIKE.has(ops[k].op)) { t.push({ n: ids[k], l: 'V' }); edge(ids[k], ids[k + 1], 'F'); }
        else { edge(ids[k], ids[k + 1], 'V'); f.push({ n: ids[k], l: 'F' }); }
      }
      const last = ids[ids.length - 1];
      t.push({ n: last, l: 'V' }); f.push({ n: last, l: 'F' });
      return { entry: ids[0], t, f };
    }

    /* Sentencia simple con decisiones internas (&&, ||, ?:) */
    function exprStmt(s, preds) {
      const first = mk('decision', s.text, s.line, s.lineEnd);
      conn(preds, first);
      let out = [{ n: first }];
      s.ops.forEach((op, k) => {
        let d = first;
        if (k > 0) { d = mk('decision', opLabel(op), op.line); conn(out, d); }
        const br = mk('block', McC.t('node.branch', { op: opLabel(op) }), op.line);
        edge(d, br, 'V');
        out = [{ n: d, l: 'F' }, { n: br }];
      });
      return out;
    }

    function seq(list, preds, ctx) {
      let buf = [];
      const flush = () => {
        if (!buf.length) return;
        const a = buf[0], b = buf[buf.length - 1];
        const id = mk('block', buf.map((s) => s.text).join('; '), a.line, b.lineEnd || b.line);
        conn(preds, id);
        preds = [{ n: id }];
        buf = [];
      };
      for (const s of list) {
        if (!s) continue;
        const hasOps = s.ops && s.ops.length;
        if (s.type === 'simple' && !hasOps) { buf.push(s); continue; }
        if ((s.type === 'return' || s.type === 'throw') && !hasOps) {
          buf.push(s); flush(); conn(preds, END); preds = []; continue;
        }
        flush();
        preds = stmt(s, preds, ctx);
      }
      flush();
      return preds;
    }

    function stmt(s, preds, ctx) {
      switch (s.type) {
        case 'block': return seq(s.body, preds, ctx);
        case 'simple': return s.ops && s.ops.length ? exprStmt(s, preds) : seq([s], preds, ctx);
        case 'return': case 'throw': {
          const out = s.ops && s.ops.length ? exprStmt(s, preds) : seq([s], preds, ctx);
          conn(out, END); return [];
        }
        case 'if': {
          const c = cond(s.cond, preds, 'if');
          const a = stmt(s.then, c.t, ctx);
          const b = s.else ? stmt(s.else, c.f, ctx) : c.f;
          return a.concat(b);
        }
        case 'while': case 'for': {
          const loop = { brk: [], cont: [] };
          const inner = { brk: loop.brk, cont: loop.cont };
          let entry, t, f;
          if (s.infinite) {
            entry = mk('block', s.kw === 'for' ? `${s.kw} (;;)` : `${s.kw} {}`, s.line);
            conn(preds, entry); t = [{ n: entry }]; f = [];
          } else {
            const c = cond(s.cond, preds, s.kw || s.type);
            entry = c.entry; t = c.t; f = c.f;
          }
          const bo = stmt(s.body, t, inner);
          conn(bo, entry); conn(loop.cont, entry);
          let out = f;
          if (s.orelse) out = stmt(s.orelse, out, ctx);
          return out.concat(loop.brk);
        }
        case 'dowhile': {
          const j = mk('join', 'do', s.line);
          conn(preds, j);
          const loop = { brk: [], cont: [] };
          const bo = stmt(s.body, [{ n: j }], { brk: loop.brk, cont: loop.cont });
          const c = cond(s.cond, bo.concat(loop.cont), 'while');
          conn(c.t, j);
          return c.f.concat(loop.brk);
        }
        case 'switch': {
          const S = mk('decision', `${s.kw || 'switch'} ${s.expr.text}`.trim(), s.line);
          conn(preds, S);
          const sw = { brk: [] };
          const inner = { brk: s.py ? ctx.brk : sw.brk, cont: ctx.cont };
          const caseOuts = [];
          let fall = [], hasDef = false;
          s.cases.forEach((cs) => {
            if (cs.isDefault) hasDef = true;
            const lab = cs.isDefault ? 'default' : McC.trunc(cs.label, 14);
            const o = seq(cs.body, [{ n: S, l: lab }].concat(fall), inner);
            const last = cs.body[cs.body.length - 1];
            const ft = last && last.type === 'fallthrough';
            if (s.noFall && !ft) { caseOuts.push(...o); fall = []; } else fall = o;
          });
          const out = fall.concat(caseOuts, sw.brk);
          if (!hasDef) out.push({ n: S, l: McC.t('edge.other') });
          return out;
        }
        case 'try': {
          const T = mk(s.catches.length ? 'decision' : 'block', 'try', s.line);
          conn(preds, T);
          let bo = stmt(s.body, [{ n: T }], ctx);
          if (s.orelse) bo = stmt(s.orelse, bo, ctx);
          const co = [];
          s.catches.forEach((c) => {
            co.push(...stmt(c.body, [{ n: T, l: McC.trunc(`${c.kw} ${c.label}`, 16) }], ctx));
          });
          let out = bo.concat(co);
          if (s.fin) out = stmt(s.fin, out, ctx);
          return out;
        }
        case 'break':
          if (ctx.brk) ctx.brk.push(...preds); else conn(preds, END);
          return [];
        case 'continue':
          if (ctx.cont) ctx.cont.push(...preds); else conn(preds, END);
          return [];
        case 'fallthrough': return preds;
        default: return seq([s], preds, ctx);
      }
    }

    const out = seq(ast, [{ n: START }], { brk: null, cont: null });
    conn(out, END);
    return { nodes, edges, START, END };
  };

  McC.metrics = function (g) {
    const N = g.nodes.length, E = g.edges.length;
    const outdeg = new Array(N).fill(0);
    g.edges.forEach((e) => outdeg[e.from]++);
    let P = 0;
    const predicates = [];
    g.nodes.forEach((n) => {
      if (n.kind !== 'end' && outdeg[n.id] > 1) { P += outdeg[n.id] - 1; predicates.push({ node: n, weight: outdeg[n.id] - 1 }); }
    });
    return { N, E, P, V: E - N + 2, VP: P + 1, outdeg, predicates };
  };

  /* Conjunto básico de caminos independientes (método de la línea base de McCabe) */
  McC.basisPaths = function (g, limit) {
    limit = limit || 80;
    const N = g.nodes.length;
    const outE = Array.from({ length: N }, () => []);
    const inE = Array.from({ length: N }, () => []);
    g.edges.forEach((e, ix) => { outE[e.from].push(ix); inE[e.to].push(ix); });

    const dist = new Array(N).fill(Infinity);
    dist[g.END] = 0;
    const q = [g.END];
    for (let qi = 0; qi < q.length; qi++) {
      const v = q[qi];
      for (const ix of inE[v]) { const u = g.edges[ix].from; if (dist[u] === Infinity) { dist[u] = dist[v] + 1; q.push(u); } }
    }
    const nextE = new Array(N).fill(-1);
    for (let v = 0; v < N; v++) {
      let best = Infinity;
      for (const ix of outE[v]) { const d = dist[g.edges[ix].to]; if (d < best) { best = d; nextE[v] = ix; } }
    }
    const follow = (path, v) => {
      let guard = 0;
      while (v !== g.END && guard++ < N * 2) {
        const ix = nextE[v];
        if (ix < 0) { path.incomplete = true; break; }
        path.edges.push(ix); v = g.edges[ix].to; path.nodes.push(v);
      }
      if (v !== g.END) path.incomplete = true;
      return path;
    };

    const paths = [follow({ nodes: [g.START], edges: [] }, g.START)];
    const done = new Set();
    for (let pi = 0; pi < paths.length && paths.length < limit; pi++) {
      const Pth = paths[pi];
      for (let k = 0; k < Pth.nodes.length && paths.length < limit; k++) {
        const v = Pth.nodes[k];
        if (done.has(v) || outE[v].length < 2) continue;
        done.add(v);
        const used = Pth.edges[k];
        for (const ix of outE[v]) {
          if (ix === used) continue;
          const np = { nodes: Pth.nodes.slice(0, k + 1), edges: Pth.edges.slice(0, k) };
          np.edges.push(ix);
          const w = g.edges[ix].to;
          np.nodes.push(w);
          follow(np, w);
          np.flip = { node: v, edge: ix };
          paths.push(np);
          if (paths.length >= limit) break;
        }
      }
    }
    return paths;
  };

  McC.risk = function (v) {
    const key = v <= 10 ? 'bajo' : v <= 20 ? 'moderado' : v <= 50 ? 'alto' : 'muyalto';
    return { key, label: McC.t('risk.' + key), desc: McC.t('risk.' + key + '.d') };
  };

  /* Punto de entrada: analiza un archivo completo */
  McC.analyze = function (src, lang, opts) {
    if (lang === 'php') src = src.replace(/<\?php|<\?=|\?>/gi, (m) => ' '.repeat(m.length));
    const raw = McC.LANGS[lang].family === 'py' ? McC.parsePython(src, opts) : McC.parseCLike(src, lang, opts);
    const units = raw.map((u) => {
      const cfg = McC.buildCFG(u.ast);
      return Object.assign({}, u, { cfg, m: McC.metrics(cfg) });
    });
    const fnCount = units.filter((u) => !u.top).length;
    return units.filter((u) => !u.top || fnCount === 0 || u.m.V > 1);
  };
})();
