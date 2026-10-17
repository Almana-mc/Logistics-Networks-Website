/* ===========================================================================
   graph.js — NetworkGraph canvas engine
   Force-directed layout · breathing nodes · traveling pulses along edges ·
   hover/click hit-testing · glow / wireframe / solid render styles.
   Exposed as window.NetworkGraph
   =========================================================================== */
(function () {
  'use strict';

  function resolveColor(varName, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return v || fallback;
  }

  const TYPE_VARS = {
    ITEM: '--type-item', FLUID: '--type-fluid', ENERGY: '--type-energy',
    CHEMICAL: '--type-chemical', SOURCE: '--type-source'
  };

  class NetworkGraph {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({
        style: 'glow',        // glow | wireframe | solid
        pulseSpeed: 1,
        breathing: true,
        nodePulse: true,
        interactive: true,
        decorative: false,    // hero mode: more nodes, no labels req
        density: 1
      }, opts);
      this.nodes = [];
      this.edges = [];
      this.pulses = [];
      this.t = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.view = { x: 0, y: 0, k: 1 };
      this.hover = -1;
      this.selected = -1;
      this.dragNode = -1;
      this.panning = false;
      this.dragMoved = false;
      this.lastPointer = null;
      this._raf = null;
      this._listeners = { nodeclick: [] };
      this._refreshColors();
      this._bind();
      this.resize();
    }

    _refreshColors() {
      this.col = {
        accent: resolveColor('--accent', '#4fd6e0'),
        accent2: resolveColor('--accent-2', '#e8954a'),
        bg0: resolveColor('--bg-0', '#0d1117'),
        line: resolveColor('--control', '#a4b4b0'),
        fg: resolveColor('--fg', '#f3f5f8'),
        fgmute: resolveColor('--fg-mute', '#8893a8'),
        link: resolveColor('--line', '#2b3550')
      };
      this.typeColors = {};
      Object.keys(TYPE_VARS).forEach(t => this.typeColors[t] = resolveColor(TYPE_VARS[t], '#888'));
      this.typeColors.LINK = this.col.line;
    }

    typeColor(t) { return this.typeColors[t] || this.col.accent; }

    on(evt, cb) { (this._listeners[evt] = this._listeners[evt] || []).push(cb); }
    _emit(evt, payload) { (this._listeners[evt] || []).forEach(cb => cb(payload)); }

    setData(data) {
      const W = this.cw || 800, H = this.ch || 500;
      this.nodes = data.nodes.map((n, i) => ({
        ...n,
        x: n.x != null ? n.x : W / 2 + Math.cos(i / data.nodes.length * Math.PI * 2) * Math.min(W, H) * 0.28 + (Math.random() - 0.5) * 40,
        y: n.y != null ? n.y : H / 2 + Math.sin(i / data.nodes.length * Math.PI * 2) * Math.min(W, H) * 0.28 + (Math.random() - 0.5) * 40,
        vx: 0, vy: 0,
        phase: Math.random() * Math.PI * 2,
        baseR: n.baseR || (this.opts.decorative ? 5 + Math.random() * 4 : 9)
      }));
      this.edges = data.edges.map(e => ({ ...e }));
      this.pulses = [];
      this.selected = -1; this.hover = -1;
      this._seedPulses();
      const iterations = this.opts.decorative
        ? 180
        : Math.min(240, Math.max(24, Math.round(1800000 / (this.nodes.length ** 2))));
      this._settle(iterations);
      this._lw = this.cw; this._lh = this.ch;
    }

    _seedPulses() {
      // one rolling pulse per non-weak edge, staggered
      this.edges.forEach((e, i) => {
        if (e.weak) return;
        e._pt = Math.random();           // pulse position 0..1
        e._pgap = 0.55 + Math.random() * 0.5;
      });
    }

    /* ---- force-directed settle (Fruchterman–Reingold) ---- */
    _settle(iter) {
      const W = this.cw, H = this.ch, N = this.nodes.length;
      if (!N) return;
      const k = Math.sqrt((W * H) / N) * 0.55;     // ideal edge length
      let temp = Math.min(W, H) * 0.20;
      const cool = temp / (iter + 1);
      const ns = this.nodes;
      for (let it = 0; it < iter; it++) {
        ns.forEach(n => { n.dx = 0; n.dy = 0; });
        // repulsion between every pair: k^2 / d
        for (let a = 0; a < N; a++) {
          const na = ns[a];
          for (let b = a + 1; b < N; b++) {
            const nb = ns[b];
            let dx = na.x - nb.x, dy = na.y - nb.y;
            let d = Math.sqrt(dx * dx + dy * dy) || 0.01;
            const f = (k * k) / d;
            const ux = dx / d, uy = dy / d;
            na.dx += ux * f; na.dy += uy * f;
            nb.dx -= ux * f; nb.dy -= uy * f;
          }
        }
        // attraction along edges: d^2 / k
        this.edges.forEach(e => {
          const a = ns[e.from], b = ns[e.to];
          if (!a || !b) return;
          let dx = a.x - b.x, dy = a.y - b.y;
          let d = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const f = (d * d) / k * (e.weak ? 0.35 : 1);
          const ux = dx / d, uy = dy / d;
          a.dx -= ux * f; a.dy -= uy * f;
          b.dx += ux * f; b.dy += uy * f;
        });
        // apply, capped by temperature, plus gentle centering + bounds
        const pad = 46;
        ns.forEach(n => {
          const dlen = Math.sqrt(n.dx * n.dx + n.dy * n.dy) || 0.01;
          const m = Math.min(dlen, temp);
          n.x += (n.dx / dlen) * m;
          n.y += (n.dy / dlen) * m;
          n.x += (W / 2 - n.x) * 0.02;
          n.y += (H / 2 - n.y) * 0.02;
          n.x = Math.max(pad, Math.min(W - pad, n.x));
          n.y = Math.max(pad, Math.min(H - pad, n.y));
        });
        temp = Math.max(cool, temp - cool);
      }
    }

    _bind() {
      this.canvas.style.touchAction = 'none';
      this._onMove = (ev) => {
        if (!this.opts.interactive) return;
        const screen = this._screenPt(ev);
        const graph = this._toGraph(screen);
        if (this.dragNode >= 0) {
          const n = this.nodes[this.dragNode];
          n.x = graph.x; n.y = graph.y;
          this.dragMoved = true;
          this.canvas.style.cursor = 'grabbing';
          return;
        }
        if (this.panning && this.lastPointer) {
          this.view.x += screen.x - this.lastPointer.x;
          this.view.y += screen.y - this.lastPointer.y;
          this.lastPointer = screen;
          this.dragMoved = true;
          this.canvas.style.cursor = 'grabbing';
          return;
        }
        const h = this._hitNode(graph);
        this.hover = h;
        this.canvas.style.cursor = h >= 0 ? 'grab' : 'move';
      };
      this._onDown = (ev) => {
        if (!this.opts.interactive) return;
        const screen = this._screenPt(ev);
        const graph = this._toGraph(screen);
        const h = this._hitNode(graph);
        this.dragMoved = false;
        this.lastPointer = screen;
        if (h >= 0) {
          this.dragNode = h;
          this.selected = h;
          this.hover = h;
          this._emit('nodeclick', { index: h, node: this.nodes[h] });
          this.canvas.style.cursor = 'grabbing';
          this.canvas.setPointerCapture?.(ev.pointerId);
          ev.preventDefault();
          return;
        }
        this.panning = true;
        this.selected = -1;
        this.canvas.style.cursor = 'grabbing';
        this.canvas.setPointerCapture?.(ev.pointerId);
        ev.preventDefault();
      };
      this._onUp = (ev) => {
        if (!this.opts.interactive) return;
        if (!this.dragMoved && this.dragNode < 0) {
          this._emit('nodeclick', { index: -1, node: null });
        }
        this.dragNode = -1;
        this.panning = false;
        this.lastPointer = null;
        this.canvas.releasePointerCapture?.(ev.pointerId);
        this.canvas.style.cursor = this.hover >= 0 ? 'grab' : 'move';
      };
      this._onWheel = (ev) => {
        if (!this.opts.interactive) return;
        ev.preventDefault();
        const p = this._screenPt(ev);
        const before = this._toGraph(p);
        const next = Math.max(0.45, Math.min(2.6, this.view.k * Math.exp(-ev.deltaY * 0.0016)));
        this.view.k = next;
        this.view.x = p.x - before.x * next;
        this.view.y = p.y - before.y * next;
      };
      this._onLeave = () => {
        this.hover = -1;
        if (this.dragNode < 0 && !this.panning) this.canvas.style.cursor = 'default';
      };
      ['Move', 'Down', 'Up', 'Wheel', 'Leave'].forEach(name => {
        const handle = this['_on' + name];
        this['_on' + name] = ev => { handle(ev); this._frame(); };
      });
      this.canvas.addEventListener('pointermove', this._onMove);
      this.canvas.addEventListener('pointerdown', this._onDown);
      this.canvas.addEventListener('pointerup', this._onUp);
      this.canvas.addEventListener('pointercancel', this._onUp);
      this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
      this.canvas.addEventListener('mouseleave', this._onLeave);
    }

    _screenPt(ev) {
      const r = this.canvas.getBoundingClientRect();
      return { x: (ev.clientX - r.left), y: (ev.clientY - r.top) };
    }

    _toGraph(p) {
      return { x: (p.x - this.view.x) / this.view.k, y: (p.y - this.view.y) / this.view.k };
    }

    _hitNode(p) {
      for (let i = this.nodes.length - 1; i >= 0; i--) {
        const n = this.nodes[i];
        if (Math.hypot(p.x - n.x, p.y - n.y) < n.baseR + 10 / this.view.k) return i;
      }
      return -1;
    }

    select(i) { this.selected = i; }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.cw = r.width; this.ch = r.height;
      this.canvas.width = r.width * this.dpr;
      this.canvas.height = r.height * this.dpr;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      // Re-run layout if the container size changed substantially after the
      // initial settle (e.g. it was measured small/0 before layout).
      if (this.nodes.length && this._lw) {
        const grew = Math.abs(this.cw - this._lw) / this._lw > 0.3 ||
                     Math.abs(this.ch - this._lh) / this._lh > 0.3;
        if (grew) { this._settle(140); this._lw = this.cw; this._lh = this.ch; }
      }
    }

    start() {
      this._frame();
      if (this._raf || !(this.opts.pulseSpeed || this.opts.breathing || this.opts.nodePulse)) return;
      const loop = () => { this._frame(); this._raf = requestAnimationFrame(loop); };
      this._raf = requestAnimationFrame(loop);
    }
    stop() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; }

    _frame() {
      const ctx = this.ctx, W = this.cw, H = this.ch;
      this.t += 0.016 * this.opts.pulseSpeed;
      ctx.clearRect(0, 0, W, H);

      // gentle drift for decorative mode
      if (this.opts.decorative) {
        this.nodes.forEach((n, i) => {
          n.x += Math.sin(this.t * 0.4 + n.phase) * 0.18;
          n.y += Math.cos(this.t * 0.33 + n.phase * 1.3) * 0.18;
        });
      }

      ctx.save();
      if (this.opts.interactive && !this.opts.decorative) {
        ctx.translate(this.view.x, this.view.y);
        ctx.scale(this.view.k, this.view.k);
      }

      this.edges.forEach(e => {
        const a = this.nodes[e.from], b = this.nodes[e.to];
        if (!a || !b) return;
        const c = e.type === 'LINK' || e.weak ? this.col.line : this.typeColor(e.type);
        const connected = this.selected >= 0 && (e.from === this.selected || e.to === this.selected);
        const dim = this.selected >= 0 && !connected;
        this._drawEdge(a, b, c, e, connected, dim);
      });

      if (this.opts.style !== 'wireframe') {
        this.edges.forEach(e => {
          if (e.weak || e.undirected) return;
          const a = this.nodes[e.from], b = this.nodes[e.to];
          if (!a || !b) return;
          e._pt = (e._pt + 0.006 * this.opts.pulseSpeed * (e._pgap || 1));
          if (e._pt > 1) e._pt -= 1;
          const dim = this.selected >= 0 && !(e.from === this.selected || e.to === this.selected);
          this._drawPulse(a, b, e._pt, this.typeColor(e.type), dim);
        });
      }

      this.nodes.forEach((n, i) => this._drawNode(n, i));
      ctx.restore();
    }

    _drawEdge(a, b, color, e, connected, dim) {
      const ctx = this.ctx;
      ctx.save();
      const alpha = dim ? 0.18 : (e.weak ? 0.65 : (connected ? 1 : 0.75));
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = connected ? 2 : (e.weak ? 0.8 : 1.2);
      if (e.weak) ctx.setLineDash([2, 6]);
      else if (e.undirected) ctx.setLineDash([5, 4]);
      if (this.opts.style === 'glow' && !dim) {
        ctx.shadowColor = color;
        ctx.shadowBlur = connected ? 14 : 6;
      }
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (!e.weak && !e.undirected) {
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const offset = b.baseR + 8;
        const x = b.x - Math.cos(angle) * offset, y = b.y - Math.sin(angle) * offset;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(angle - 0.5) * 8, y - Math.sin(angle - 0.5) * 8);
        ctx.lineTo(x, y);
        ctx.lineTo(x - Math.cos(angle + 0.5) * 8, y - Math.sin(angle + 0.5) * 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    _drawPulse(a, b, t, color, dim) {
      const ctx = this.ctx;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const r = 2.6;
      ctx.save();
      ctx.globalAlpha = dim ? 0.12 : 1;
      if (this.opts.style === 'glow') { ctx.shadowColor = color; ctx.shadowBlur = 12; }
      // comet trail
      const tx = a.x + (b.x - a.x) * Math.max(0, t - 0.06);
      const ty = a.y + (b.y - a.y) * Math.max(0, t - 0.06);
      const grad = ctx.createLinearGradient(tx, ty, x, y);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, color);
      ctx.strokeStyle = grad; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    _nodeColor(n) {
      // color a node by its dominant active type; fall back to accent
      if (n.dominantType) return this.typeColor(n.dominantType);
      return this.col.accent;
    }

    _drawNode(n, i) {
      const ctx = this.ctx;
      const breath = this.opts.breathing ? 1 + Math.sin(this.t * 1.6 + n.phase) * 0.12 : 1;
      const pulse = this.opts.nodePulse ? (Math.sin(this.t * 2.4 + n.phase) + 1) * 0.5 : 0;
      const isSel = i === this.selected;
      const isHov = i === this.hover;
      const dim = this.selected >= 0 && !isSel && !this._isNeighbor(i);
      const r = n.baseR * breath * (isSel ? 1.5 : isHov ? 1.25 : 1);
      const color = n.role === 'hidden' ? this.col.fgmute : this._nodeColor(n);

      ctx.save();
      ctx.globalAlpha = dim ? 0.28 : 1;

      // outer glow ring
      if (this.opts.style !== 'wireframe') {
        const haloR = r + (isSel ? 16 : 9) + Math.sin(this.t * 1.6 + n.phase) * 3;
        const g = ctx.createRadialGradient(n.x, n.y, r * 0.4, n.x, n.y, haloR);
        g.addColorStop(0, color); g.addColorStop(1, 'transparent');
        ctx.globalAlpha = (dim ? 0.1 : 0.5);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(n.x, n.y, haloR, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = dim ? 0.28 : 1;
      }

      if (this.opts.nodePulse && this.opts.style === 'glow' && !dim) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 + pulse * 1.4;
        ctx.globalAlpha = 0.22 * (1 - pulse);
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 6 + pulse * 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // node body
      if (this.opts.style === 'solid') {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = this.col.bg0; ctx.globalAlpha *= 0.55;
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 0.5, 0, Math.PI * 2); ctx.fill();
      } else if (this.opts.style === 'wireframe') {
        ctx.strokeStyle = color; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = color; ctx.globalAlpha *= 0.6;
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 0.32, 0, Math.PI * 2); ctx.fill();
      } else { // glow
        ctx.fillStyle = this.col.bg0;
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        if (!dim) { ctx.shadowColor = color; ctx.shadowBlur = isSel ? 22 : 12; }
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 0.38, 0, Math.PI * 2); ctx.fill();
      }

      // label
      if (n.label && !this.opts.decorative && (this.cw > 520 || isSel || isHov)) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = isSel ? this.col.fg : this.col.fgmute;
        ctx.font = `${isSel ? 600 : 400} 13px Barlow, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const txt = n.label.length > 16 ? n.label.slice(0, 15) + '…' : n.label;
        ctx.fillText(txt, n.x, n.y + r + 7);
      }
      ctx.restore();
    }

    _isNeighbor(i) {
      if (this.selected < 0) return false;
      return this.edges.some(e => (e.from === this.selected && e.to === i) || (e.to === this.selected && e.from === i));
    }

    destroy() {
      this.stop();
      this.canvas.removeEventListener('pointermove', this._onMove);
      this.canvas.removeEventListener('pointerdown', this._onDown);
      this.canvas.removeEventListener('pointerup', this._onUp);
      this.canvas.removeEventListener('pointercancel', this._onUp);
      this.canvas.removeEventListener('wheel', this._onWheel);
      this.canvas.removeEventListener('mouseleave', this._onLeave);
    }
  }

  window.NetworkGraph = NetworkGraph;
})();
