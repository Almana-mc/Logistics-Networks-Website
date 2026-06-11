/* library.jsx — saved networks gallery page */

const typeVar = id => {
  const m = RESOURCE_TYPES.find(t => t.id === id);
  return m ? `var(${m.v})` : 'var(--accent)';
};
const typeLabel = id => {
  const m = RESOURCE_TYPES.find(t => t.id === id);
  return m ? m.label : id;
};

function LibNav() {
  return (
    <nav className="nav" aria-label="Primary">
      <a className="nav__brand" href="index.html">
        <span className="nav__logo">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
            <circle cx="16" cy="16" r="13" fill="none" stroke="var(--accent)" strokeWidth="2" />
            <circle cx="16" cy="16" r="4.5" fill="var(--accent)" />
            <circle cx="16" cy="3" r="2.4" fill="var(--accent-2)" />
            <circle cx="29" cy="16" r="2.4" fill="var(--type-chemical)" />
            <circle cx="16" cy="29" r="2.4" fill="var(--type-source)" />
          </svg>
        </span>
        <span className="nav__name">LOGISTICS<span>NETWORK</span></span>
      </a>
      <div className="nav__links">
        <a href="index.html">Home</a>
        <a href="index.html#download">Download</a>
        <span className="lib-nav__here" aria-current="page">Library</span>
        <Btn as="a" href="visualiser.html" variant="ghost" className="nav__cta" aria-label="Open visualiser">
          Open Visualiser <Icon name="arrow" size={15} />
        </Btn>
      </div>
    </nav>
  );
}

function LibFooter({ release }) {
  return (
    <footer className="footer">
      <div className="section-wrap footer__inner">
        <div className="footer__brand">
          <span className="nav__name">LOGISTICS<span>NETWORK</span></span>
          <p className="mono">Saved networks · open any export in the visualiser</p>
        </div>
        <div className="footer__links">
          <a href="index.html">Home</a>
          <a href="visualiser.html">Visualiser</a>
          <a href="https://github.com/Almana-mc/LogisticsNetworks" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://discord.gg/xTeHR2tdYh" target="_blank" rel="noreferrer">Discord</a>
        </div>
        <div className="footer__meta mono">
          v{release.version} · {MOD.loader}<br />
          Unofficial companion tool · not affiliated with Mojang
        </div>
      </div>
    </footer>
  );
}

function Toolbar({ q, setQ, active, toggleType, sort, setSort, shown, total }) {
  return (
    <div className="lib-bar">
      <div className="lib-search">
        <Icon name="search" size={16} />
        <input type="search" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search networks, authors…" aria-label="Search saved networks" />
        {q && <button className="lib-search__clear" aria-label="Clear search" onClick={() => setQ('')}><Icon name="close" size={14} /></button>}
      </div>
      <div className="lib-filters" role="group" aria-label="Filter by resource type">
        {RESOURCE_TYPES.map(t => (
          <button key={t.id} className={`lib-chip${active.has(t.id) ? ' is-on' : ''}`}
            style={{ '--c': `var(${t.v})` }} aria-pressed={active.has(t.id)}
            onClick={() => toggleType(t.id)}>
            <span className="lib-chip__dot" />{t.label}
          </button>
        ))}
      </div>
      <div className="lib-sort" role="group" aria-label="Sort networks">
        <button className={sort === 'new' ? 'is-on' : ''} aria-pressed={sort === 'new'} onClick={() => setSort('new')}>Newest</button>
        <button className={sort === 'name' ? 'is-on' : ''} aria-pressed={sort === 'name'} onClick={() => setSort('name')}>Name</button>
      </div>
      <p className="lib-count mono" role="status">{shown}<span>/{total}</span></p>
    </div>
  );
}

function Tile({ entry }) {
  const dominant = entry.types[0] ? typeVar(entry.types[0]) : 'var(--accent)';
  return (
    <article className={`lib-tile lib-tile--${entrySpan(entry)}`} style={{ '--c': dominant }}>
      <span className="lib-tile__bar" aria-hidden="true" />
      <div className="lib-tile__top">
        <h2 className="lib-tile__name">{entry.name}</h2>
        <p className="lib-tile__by mono">by {entry.author}</p>
      </div>
      <p className="lib-tile__desc">{entry.desc}</p>
      <div className="lib-tile__meta">
        <ul className="lib-tile__types">
          {entry.types.length === 0 && <li className="lib-tile__type lib-tile__type--none mono">untyped</li>}
          {entry.types.map(t => (
            <li key={t} className="lib-tile__type mono" style={{ '--c': typeVar(t) }}>
              <span className="lib-tile__tdot" />{typeLabel(t)}
            </li>
          ))}
        </ul>
        {entry.added && <time className="lib-tile__date mono" dateTime={entry.added}>{entry.added}</time>}
      </div>
      <div className="lib-tile__act">
        <a className="btn btn-primary btn-sm" href={visualiserUrl(entry)}>
          Open in visualiser <Icon name="arrow" size={15} />
        </a>
      </div>
    </article>
  );
}

function Skeletons() {
  const spans = ['md', 'sm', 'lg', 'sm', 'md', 'md'];
  return (
    <div className="lib-grid" aria-hidden="true">
      {spans.map((s, i) => <div key={i} className={`lib-tile lib-tile--${s} lib-tile--skel`} />)}
    </div>
  );
}

const DISCORD_URL = 'https://discord.gg/xTeHR2tdYh';

function Message({ kind, onRetry, onClear }) {
  const copy = {
    error: { t: 'Could not load the library', d: 'The network manifest failed to load. Check your connection and try again.', a: 'Retry', on: onRetry },
    empty: { t: 'No saved networks yet', d: 'Got a layout worth sharing? Submit your .lnet export on the Discord and it can land here for everyone to open.' },
    none: { t: 'No networks match those filters', d: 'Try a different search term, or clear the active resource filters.', a: 'Clear filters', on: onClear },
  }[kind];
  return (
    <div className={`lib-msg lib-msg--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span className="lib-msg__mark" aria-hidden="true"><Icon name={kind === 'error' ? 'alert' : 'search'} size={22} /></span>
      <h2 className="lib-msg__title">{copy.t}</h2>
      <p className="lib-msg__desc">{copy.d}</p>
      {kind === 'empty' && (
        <a className="btn btn-primary btn-sm" href={DISCORD_URL} target="_blank" rel="noreferrer">
          Submit on Discord <Icon name="external" size={15} />
        </a>
      )}
      {copy.a && <button className="btn btn-ghost btn-sm" onClick={copy.on}>{copy.a}</button>}
    </div>
  );
}

const BATCH = 24;

function LibraryApp() {
  const [entries, setEntries] = useState(null);
  const [status, setStatus] = useState('loading');
  const [q, setQ] = useState('');
  const [active, setActive] = useState(() => new Set());
  const [sort, setSort] = useState('new');
  const [limit, setLimit] = useState(BATCH);
  const [nonce, setNonce] = useState(0);
  const sentinel = useRef(null);
  const release = useRelease();

  useEffect(() => {
    setStatus('loading');
    fetchLibrary()
      .then(list => { setEntries(list); setStatus(list.length ? 'ready' : 'empty'); })
      .catch(() => setStatus('error'));
  }, [nonce]);

  const toggleType = id => setActive(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const clearFilters = () => { setQ(''); setActive(new Set()); };

  const filtered = React.useMemo(() => {
    if (!entries) return [];
    const f = entries.filter(e => matchesQuery(e, q) && matchesTypes(e, active));
    return sortEntries(f, sort);
  }, [entries, q, active, sort]);

  useEffect(() => { setLimit(BATCH); }, [q, active, sort]);

  useEffect(() => {
    if (!sentinel.current) return;
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) setLimit(l => l + BATCH);
    }, { rootMargin: '600px' });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [filtered.length, status]);

  const visible = filtered.slice(0, limit);

  return (
    <>
      <LibNav />
      <main className="lib-shell">
        <header className="lib-head section-wrap">
          <span className="kicker">Library</span>
          <h1 className="lib-title">Saved Networks</h1>
          <p className="lib-lead">Community <span className="mono">.lnet</span> layouts. Search, filter by resource, and open any one straight in the visualiser. Want yours listed? Submit it on the <a href="https://discord.gg/xTeHR2tdYh" target="_blank" rel="noreferrer">Discord</a>.</p>
        </header>

        <div className="section-wrap">
          {status === 'ready' && (
            <Toolbar q={q} setQ={setQ} active={active} toggleType={toggleType}
              sort={sort} setSort={setSort} shown={filtered.length} total={entries.length} />
          )}

          {status === 'loading' && <Skeletons />}
          {status === 'error' && <Message kind="error" onRetry={() => setNonce(n => n + 1)} />}
          {status === 'empty' && <Message kind="empty" />}
          {status === 'ready' && filtered.length === 0 && <Message kind="none" onClear={clearFilters} />}
          {status === 'ready' && filtered.length > 0 && (
            <>
              <div className="lib-grid">
                {visible.map(e => <Tile key={e.file} entry={e} />)}
              </div>
              {limit < filtered.length && <div ref={sentinel} className="lib-sentinel" aria-hidden="true" />}
            </>
          )}
        </div>
      </main>
      <LibFooter release={release} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LibraryApp />);
