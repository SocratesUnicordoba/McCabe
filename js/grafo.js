/* =========================================================================
 * Dibujo del grafo de flujo (layout por capas tipo Sugiyama, sin librerías)
 * ========================================================================= */
(function () {
  'use strict';
  const McC = window.McC;
  const R = 17, LAYER = 82, NODE_W = 2 * R + 34, DUMMY_W = 20, MARGIN = 40;

  function pav(y) {
    const blocks = [];
    for (let i = 0; i < y.length; i++) {
      blocks.push({ v: y[i], n: 1 });
      while (blocks.length > 1 && blocks[blocks.length - 2].v > blocks[blocks.length - 1].v) {
        const b = blocks.pop(), a = blocks.pop();
        blocks.push({ v: (a.v * a.n + b.v * b.n) / (a.n + b.n), n: a.n + b.n });
      }
    }
    const z = [];
    blocks.forEach((b) => { for (let k = 0; k < b.n; k++) z.push(b.v); });
    return z;
  }

  McC.layoutGraph = function (g) {
    const N = g.nodes.length;
    const outE = Array.from({ length: N }, () => []);
    g.edges.forEach((e, ix) => outE[e.from].push(ix));

    // 1. Aristas de retorno (DFS iterativo)
    const st = new Array(N).fill(0), back = new Array(g.edges.length).fill(false), disc = [];
    const dfs = (root) => {
      const stack = [[root, 0]]; st[root] = 1; disc.push(root);
      while (stack.length) {
        const top = stack[stack.length - 1];
        const v = top[0];
        if (top[1] < outE[v].length) {
          const ix = outE[v][top[1]++];
          const w = g.edges[ix].to;
          if (st[w] === 1) back[ix] = true;
          else if (st[w] === 0) { st[w] = 1; disc.push(w); stack.push([w, 0]); }
        } else { st[v] = 2; stack.pop(); }
      }
    };
    dfs(g.START);
    for (let v = 0; v < N; v++) if (!st[v]) dfs(v);

    // 2. Capas por camino más largo
    const indeg = new Array(N).fill(0);
    g.edges.forEach((e, ix) => { if (!back[ix]) indeg[e.to]++; });
    const layer = new Array(N).fill(0);
    const q = disc.filter((v) => indeg[v] === 0);
    for (let qi = 0; qi < q.length; qi++) {
      const v = q[qi];
      for (const ix of outE[v]) {
        if (back[ix]) continue;
        const w = g.edges[ix].to;
        layer[w] = Math.max(layer[w], layer[v] + 1);
        if (--indeg[w] === 0) q.push(w);
      }
    }
    let maxL = 0;
    for (let v = 0; v < N; v++) if (v !== g.END) maxL = Math.max(maxL, layer[v]);
    layer[g.END] = maxL + 1;
    const NL = maxL + 2;

    // 3. Nodos virtuales para aristas largas
    const vn = [];
    for (let v = 0; v < N; v++) vn.push({ real: v, layer: layer[v], w: NODE_W });
    const up = [], down = [];
    const ensure = (k) => { if (!up[k]) { up[k] = []; down[k] = []; } };
    const link = (a, b) => { ensure(a); ensure(b); down[a].push(b); up[b].push(a); };
    for (let v = 0; v < N; v++) ensure(v);
    const chains = new Array(g.edges.length);
    g.edges.forEach((e, ix) => {
      if (back[ix]) return;
      const chain = [e.from]; let prev = e.from;
      for (let l = layer[e.from] + 1; l < layer[e.to]; l++) {
        const d = vn.length; vn.push({ real: -1, layer: l, w: DUMMY_W }); ensure(d);
        link(prev, d); chain.push(d); prev = d;
      }
      link(prev, e.to); chain.push(e.to);
      chains[ix] = chain;
    });

    // 4. Orden dentro de cada capa (baricentro)
    const layers = Array.from({ length: NL }, () => []);
    disc.forEach((v) => layers[layer[v]].push(v));
    for (let d = N; d < vn.length; d++) layers[vn[d].layer].push(d);
    const pos = new Array(vn.length);
    const setPos = () => layers.forEach((Ly) => Ly.forEach((v, k) => { pos[v] = k; }));
    setPos();
    for (let it = 0; it < 10; it++) {
      const downPass = it % 2 === 0;
      for (let s = 0; s < NL; s++) {
        const l = downPass ? s : NL - 1 - s;
        const Ly = layers[l], nb = downPass ? up : down;
        const bc = new Map();
        Ly.forEach((v) => {
          const ns = nb[v];
          bc.set(v, ns.length ? ns.reduce((a, u) => a + pos[u], 0) / ns.length : pos[v]);
        });
        Ly.sort((a, b) => bc.get(a) - bc.get(b));
        Ly.forEach((v, k) => { pos[v] = k; });
      }
    }

    // 5. Coordenadas X (regresión isotónica para respetar separación)
    const x = new Array(vn.length).fill(0);
    const gap = (a, b) => (vn[a].w + vn[b].w) / 2;
    layers.forEach((Ly) => {
      let c = 0;
      Ly.forEach((v, k) => { x[v] = c; if (k < Ly.length - 1) c += gap(v, Ly[k + 1]); });
      Ly.forEach((v) => { x[v] -= c / 2; });
    });
    for (let it = 0; it < 24; it++) {
      const order = it % 2 === 0 ? layers : layers.slice().reverse();
      order.forEach((Ly) => {
        if (!Ly.length) return;
        const desired = Ly.map((v) => {
          const ns = up[v].concat(down[v]);
          if (!ns.length) return x[v];
          let s = 0; ns.forEach((u) => { s += x[u]; });
          return s / ns.length;
        });
        const off = [0];
        for (let k = 1; k < Ly.length; k++) off[k] = off[k - 1] + gap(Ly[k - 1], Ly[k]);
        const z = pav(desired.map((d, k) => d - off[k]));
        Ly.forEach((v, k) => { x[v] = z[k] + off[k]; });
      });
    }
    let minX = Infinity;
    vn.forEach((n, k) => { minX = Math.min(minX, x[k] - (n.real >= 0 ? R : 4)); });
    vn.forEach((n, k) => { x[k] = x[k] - minX + MARGIN; });
    const y = vn.map((n) => MARGIN + R + n.layer * LAYER);

    // 6. Enrutado de aristas de retorno por la derecha
    const layerRight = new Array(NL).fill(-Infinity);
    vn.forEach((n, k) => { layerRight[n.layer] = Math.max(layerRight[n.layer], x[k] + (n.real >= 0 ? R : 4)); });
    const occ = new Array(NL).fill(-Infinity);
    const backs = g.edges.map((e, ix) => ix).filter((ix) => back[ix])
      .sort((a, b) => (layer[g.edges[a].from] - layer[g.edges[a].to]) - (layer[g.edges[b].from] - layer[g.edges[b].to]));
    const route = {};
    backs.forEach((ix) => {
      const e = g.edges[ix];
      const a = Math.min(layer[e.to], layer[e.from]), b = Math.max(layer[e.to], layer[e.from]);
      let xr = -Infinity;
      for (let l = a; l <= b; l++) xr = Math.max(xr, layerRight[l], occ[l]);
      xr += 24;
      for (let l = a; l <= b; l++) occ[l] = xr;
      route[ix] = xr;
    });

    // 7. Geometría de aristas
    const backSlot = {}, perLayer = {};
    backs.forEach((ix) => { const l = layer[g.edges[ix].from]; backSlot[ix] = perLayer[l] = (perLayer[l] === undefined ? 0 : perLayer[l] + 1); });
    const multi = {};
    g.edges.forEach((e, ix) => { if (!back[ix]) { const k = e.from + '>' + e.to; (multi[k] = multi[k] || []).push(ix); } });
    const paths = g.edges.map((e, ix) => {
      if (back[ix]) {
        const xs = x[e.from], ys = y[e.from], xt = x[e.to], yt = y[e.to], xr = route[ix];
        // Sale por debajo del nodo origen, rodea por la derecha y entra al destino por su lado derecho
        const yb = ys + R + 12 + (backSlot[ix] || 0) * 6;
        const d = `M ${xs} ${ys + R} Q ${xs} ${yb} ${xs + 12} ${yb} L ${xr - 10} ${yb} Q ${xr} ${yb} ${xr} ${yb - 10} ` +
          `L ${xr} ${yt + 10} Q ${xr} ${yt} ${xr - 10} ${yt} L ${xt + R + 2} ${yt}`;
        return { d, back: true, lx: xs + 8, ly: yb - 4 };
      }
      const ch = chains[ix];
      const pts = ch.map((v) => ({ x: x[v], y: y[v] }));
      pts[0] = { x: pts[0].x, y: pts[0].y + R };
      const lastP = pts[pts.length - 1];
      pts[pts.length - 1] = { x: lastP.x, y: lastP.y - R - 1 };
      const group = multi[e.from + '>' + e.to];
      const mi = group.indexOf(ix);
      const dx = group.length > 1 ? (mi - (group.length - 1) / 2) * 26 : 0;
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let k = 1; k < pts.length; k++) {
        const p = pts[k - 1], qq = pts[k];
        const my = (p.y + qq.y) / 2;
        const ox = ch.length === 2 ? dx : 0;
        d += ` C ${p.x + ox} ${my} ${qq.x + ox} ${my} ${qq.x} ${qq.y}`;
      }
      const p0 = pts[0], p1 = pts[1];
      const side = p1.x + dx >= p0.x ? 1 : -1;
      return { d, back: false, lx: p0.x + (p1.x + dx - p0.x) * 0.22 + side * 9, ly: p0.y + (p1.y - p0.y) * 0.3 };
    });

    // 8. Numeración de nodos (de arriba hacia abajo, de izquierda a derecha)
    const real = [];
    for (let v = 0; v < N; v++) real.push(v);
    real.sort((a, b) => (a === g.END) - (b === g.END) || layer[a] - layer[b] || x[a] - x[b]);
    const num = new Array(N);
    real.forEach((v, k) => { num[v] = k + 1; });

    let W = 0;
    vn.forEach((n, k) => { W = Math.max(W, x[k] + R); });
    Object.values(route).forEach((xr) => { W = Math.max(W, xr + 6); });
    g.edges.forEach((e, ix) => { if (e.label && !back[ix]) W = Math.max(W, paths[ix].lx + 70); });
    const H = MARGIN * 2 + 2 * R + (NL - 1) * LAYER;
    return { x, y, num, paths, back, width: Math.ceil(W + MARGIN), height: Math.ceil(H), R };
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  McC.graphSVG = function (g, lay, m, name) {
    const t = McC.t;
    const parts = [];
    const titleId = 'cfg-title-' + Math.random().toString(36).slice(2, 8);
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" class="cfg" viewBox="0 0 ${lay.width} ${lay.height}" width="${lay.width}" height="${lay.height}" role="group" aria-labelledby="${titleId}">`);
    parts.push(`<title id="${titleId}">${esc(t('g.aria', { name: name || '', N: m.N, E: m.E }))}</title>`);
    parts.push(`<defs>
      <marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ah"/></marker>
      <marker id="arwb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ah-back"/></marker>
    </defs>`);
    parts.push('<g class="edges" aria-hidden="true">');
    g.edges.forEach((e, ix) => {
      const p = lay.paths[ix];
      parts.push(`<path class="edge${p.back ? ' back' : ''}" data-ix="${ix}" data-from="${e.from}" data-to="${e.to}" d="${p.d}" marker-end="url(#${p.back ? 'arwb' : 'arw'})"/>`);
    });
    g.edges.forEach((e, ix) => {
      if (!e.label) return;
      const p = lay.paths[ix];
      parts.push(`<text class="elabel${e.label === 'V' ? ' t' : e.label === 'F' ? ' f' : ''}" x="${p.lx.toFixed(1)}" y="${p.ly.toFixed(1)}">${esc(McC.trunc(e.label, 14))}</text>`);
    });
    parts.push('</g>');
    // Los nodos se emiten en orden numérico para que el orden de tabulación sea natural
    const order = g.nodes.slice().sort((a, b) => lay.num[a.id] - lay.num[b.id]);
    order.forEach((n) => {
      const dec = m.outdeg[n.id] > 1 && n.kind !== 'end';
      const cls = ['node', 'k-' + n.kind, dec ? 'dec' : ''].join(' ').trim();
      const aria = t('node.aria', {
        num: lay.num[n.id],
        kind: t('kind.' + (dec ? 'decision' : n.kind === 'decision' ? 'block' : n.kind)),
        line: n.line ? t('node.line', { line: n.line }) : '',
        label: McC.trunc(n.label, 160),
        out: m.outdeg[n.id],
      });
      parts.push(`<g class="${cls}" data-id="${n.id}" data-num="${lay.num[n.id]}" transform="translate(${lay.x[n.id].toFixed(1)},${lay.y[n.id].toFixed(1)})" tabindex="-1" role="button" aria-label="${esc(aria)}">`);
      if (dec) { const h = Math.round(R / Math.SQRT2 * 1.08); parts.push(`<rect x="${-h}" y="${-h}" width="${2 * h}" height="${2 * h}" rx="3" transform="rotate(45)"/>`); }
      else parts.push(`<circle r="${R}"/>`);
      parts.push(`<text dy="4.5" aria-hidden="true">${lay.num[n.id]}</text>`);
      if (n.kind === 'start' || n.kind === 'end') parts.push(`<text class="cap" x="${R + 6}" dy="4" aria-hidden="true">${esc(t(n.kind === 'start' ? 'cap.start' : 'cap.end'))}</text>`);
      parts.push('</g>');
    });
    parts.push('</svg>');
    return parts.join('');
  };
})();
