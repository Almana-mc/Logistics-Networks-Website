/* graph-canvas.jsx — graph wrapper */

function GraphCanvas({ data, options, onNodeClick, selectedIndex, className = '', ariaLabel = 'Network graph' }) {
  const ref = React.useRef(null);
  const wrapRef = React.useRef(null);
  const gRef = React.useRef(null);

  React.useEffect(() => {
    const g = new NetworkGraph(ref.current, options);
    gRef.current = g;
    if (onNodeClick) g.on('nodeclick', onNodeClick);
    g.start();
    const ro = new ResizeObserver(() => { g.resize(); });
    ro.observe(wrapRef.current);
    return () => { ro.disconnect(); g.destroy(); };
  }, []);

  React.useEffect(() => {
    if (gRef.current && data) { gRef.current.resize(); gRef.current.setData(data); }
  }, [data]);

  React.useEffect(() => {
    const g = gRef.current; if (!g) return;
    Object.assign(g.opts, options);
    g._refreshColors();
  }, [options]);

  React.useEffect(() => {
    if (gRef.current && selectedIndex != null) gRef.current.select(selectedIndex);
  }, [selectedIndex]);

  const decorative = options && options.decorative;

  return (
    <div
      ref={wrapRef}
      className={`graph-canvas ${className}`}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : ariaLabel}
      aria-hidden={decorative ? 'true' : undefined}
    >
      <canvas ref={ref} aria-hidden="true" />
    </div>
  );
}

function buildHeroNetwork(seed = 1) {
  const types = ['ITEM', 'FLUID', 'ENERGY', 'CHEMICAL', 'SOURCE'];
  const N = 16;
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const nodes = Array.from({ length: N }, (_, i) => ({
    label: '', dominantType: types[Math.floor(rnd() * types.length)],
    baseR: 4 + rnd() * 5,
  }));
  const edges = [];
  const hubs = [0, 5, 10];
  for (let i = 0; i < N; i++) {
    const h = hubs[Math.floor(rnd() * hubs.length)];
    if (h !== i) edges.push({ from: i, to: h, type: nodes[i].dominantType, channel: i % 9 });
  }
  for (let k = 0; k < 9; k++) {
    const a = Math.floor(rnd() * N), b = Math.floor(rnd() * N);
    if (a !== b) edges.push({ from: a, to: b, type: types[Math.floor(rnd() * types.length)], channel: k });
  }
  return { nodes, edges };
}

Object.assign(window, { GraphCanvas, buildHeroNetwork });
