/* lib.jsx — shared UI primitives */
const { useState, useEffect, useRef, useCallback } = React;

const MOD = {
  name: 'Logistics Network',
  tagline: 'Wireless. Invisible. Instant.',
  blurb: 'A fully wireless, efficient and fast logistical system. No real blocks. Stick a node on any block you want to move things from or to, and it just works.',
  version: '26.1.2-1.6.0',
  released: 'Jun 3, 2026',
  loader: 'NeoForge · Java',
  features: [
    { k: 'Items · Fluids · Energy · Chemicals', d: 'Move anything: items, fluids, FE and Mekanism chemicals across one network.' },
    { k: '9 channels per node', d: 'Run nine independent transfer processes from a single node, each fully configurable.' },
    { k: 'Up to 10k / tick', d: '10k items, 1000mB fluid, 2.1B FE/t or 1000mB chemicals per channel, with nearly no lag.' },
    { k: 'Any side, redstone-aware', d: 'Pick any face for input or output. Every node responds to redstone control.' },
    { k: 'Cross-dimensional', d: 'Bridge dimensions with a special upgrade. One network, many worlds.' },
  ],
  stats: [{ n: '9', l: 'channels / node' }, { n: '5', l: 'resource types' }, { n: '10K', l: 'items / tick' }, { n: '0', l: 'blocks placed' }],
};

const RELEASES_URL = 'https://github.com/Almana-mc/LogisticsNetworks/releases/latest';

const RELEASE_TTL = 60 * 60 * 1000;

const HANDOFF_KEY = 'ln-pending-net';

function writeHandoff(name, text) {
  sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ name, text }));
}

function readHandoff() {
  const raw = sessionStorage.getItem(HANDOFF_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(HANDOFF_KEY);
  try {
    const v = JSON.parse(raw);
    return v && typeof v.text === 'string' ? { name: v.name || 'network.lnet', text: v.text } : null;
  } catch (e) {
    return null;
  }
}

function useRelease() {
  const [rel, setRel] = useState({ version: MOD.version, released: MOD.released, url: RELEASES_URL });

  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem('ln-release') || 'null');
    if (cached) setRel(cached.data);
    if (cached && Date.now() - cached.at < RELEASE_TTL) return;

    let live = true;
    fetch('https://api.github.com/repos/Almana-mc/LogisticsNetworks/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => {
        if (!live) return;
        const released = new Date(d.published_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        });
        const data = { version: d.tag_name, released, url: d.html_url };
        setRel(data);
        localStorage.setItem('ln-release', JSON.stringify({ at: Date.now(), data }));
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  return rel;
}

const RESOURCE_TYPES = [
  { id: 'ITEM', label: 'Item', v: '--type-item' },
  { id: 'FLUID', label: 'Fluid', v: '--type-fluid' },
  { id: 'ENERGY', label: 'Energy', v: '--type-energy' },
  { id: 'CHEMICAL', label: 'Chemical', v: '--type-chemical' },
  { id: 'SOURCE', label: 'Source', v: '--type-source' },
];

function Icon({ name, size = 18, stroke = 2 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    upload: <><path d="M12 16V4" /><path d="M6 10l6-6 6 6" /><path d="M4 20h16" /></>,
    arrow: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
    download: <><path d="M12 4v12" /><path d="M6 12l6 6 6-6" /><path d="M5 20h14" /></>,
    close: <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
    external: <><path d="M7 17L17 7" /><path d="M8 7h9v9" /></>,
    file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>,
    reset: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v4h4" /></>,
    dot: <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />,
  };
  return <svg {...common} aria-hidden="true">{paths[name]}</svg>;
}

function Btn({ children, variant = 'primary', as = 'button', className = '', ...rest }) {
  const Comp = as;
  return <Comp className={`btn btn-${variant} ${className}`} {...rest}>{children}</Comp>;
}

function TypeChip({ type, count, active = true }) {
  const meta = RESOURCE_TYPES.find(r => r.id === type) || { label: type, v: '--accent' };
  return (
    <span className="type-chip" style={{ '--c': `var(${meta.v})`, opacity: active ? 1 : 0.4 }}>
      <span className="type-chip__dot" />
      {meta.label}{count != null && <b>{count}</b>}
    </span>
  );
}

Object.assign(window, { MOD, RESOURCE_TYPES, Icon, Btn, TypeChip,
  HANDOFF_KEY, writeHandoff, readHandoff,
  useState, useEffect, useRef, useCallback });
