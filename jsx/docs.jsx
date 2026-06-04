/* docs.jsx — docs page composition, live routing, mount */

const parseHash = () => decodeURIComponent((location.hash || '').replace(/^#/, '')).trim();

function DocsTopBar({ onMenu, drawerOpen }) {
  return (
    <header className="nav docs-bar" aria-label="Primary">
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
        <span className="docs-bar__here" aria-current="page">Docs</span>
        <Btn as="a" href="index.html#visualiser" variant="ghost" className="nav__cta" aria-label="Open visualiser">
          Open Visualiser <Icon name="arrow" size={15} />
        </Btn>
        <button className="docs-menu" aria-label="Toggle documentation menu" aria-expanded={drawerOpen} onClick={onMenu}>
          <Icon name={drawerOpen ? 'close' : 'menu'} size={20} />
        </button>
      </div>
    </header>
  );
}

function DocsFooter({ release, branch }) {
  return (
    <footer className="footer" aria-label="Site footer">
      <div className="section-wrap footer__inner">
        <div className="footer__brand">
          <span className="nav__name">LOGISTICS<span>NETWORK</span></span>
          <p className="mono">Guides served live from branch {branch}</p>
        </div>
        <div className="footer__links">
          <a href="index.html">Home</a>
          <a href={guideRepoUrl(branch)} target="_blank" rel="noreferrer">Guide source</a>
          <a href="https://discord.gg/xTeHR2tdYh" target="_blank" rel="noreferrer">Discord</a>
          <a href="index.html#visualiser">Visualiser</a>
        </div>
        <div className="footer__meta mono">
          v{release.version} · {MOD.loader}<br />
          Unofficial companion tool · not affiliated with Mojang
        </div>
      </div>
    </footer>
  );
}

function DocsArticle({ status, page, crumb, branch, onRetry }) {
  if (status === 'loading') return <ArticleSkeleton />;
  if (status === 'error') return <DocsMessage kind="error" onRetry={onRetry} repoUrl={guideRepoUrl(branch)} />;
  if (status === 'notfound') return <DocsMessage kind="notfound" repoUrl={guideRepoUrl(branch)} />;
  const items = [];
  const rise = el => React.cloneElement(el, {
    style: { ...(el.props.style || {}), '--rise': items.length },
    className: (el.props.className ? el.props.className + ' ' : '') + 'doc-rise',
  });
  if (crumb) items.push(rise(<p key="crumb" className="doc-crumb mono"><Icon name="book" size={13} /> {crumb}</p>));
  page.blocks.forEach(b => items.push(rise(b)));
  items.push(rise(
    <a key="src" className="doc-source" href={blobUrl(page.path, branch)} target="_blank" rel="noreferrer">
      View this page on GitHub <Icon name="external" size={14} />
    </a>
  ));
  return items;
}

function DocsApp() {
  const [versions, setVersions] = useState(null);
  const [branch, setBranch] = useState(null);
  const [nav, setNav] = useState(null);
  const [route, setRoute] = useState(parseHash());
  const [page, setPage] = useState(null);
  const [status, setStatus] = useState('loading');
  const [drawer, setDrawer] = useState(false);
  const [nonce, setNonce] = useState(0);
  const cache = useRef({});
  const release = useRelease();
  const reduce = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches).current;

  useEffect(() => {
    fetchBranches().then(b => {
      setVersions(b.versions);
      const saved = localStorage.getItem('ln-docs-branch');
      setBranch(saved && b.versions.includes(saved) ? saved : b.default);
    });
  }, []);

  useEffect(() => {
    if (!branch) return;
    setNav(null);
    fetchGuideTree(branch).then(f => setNav(buildNav(f)));
  }, [branch]);

  useEffect(() => {
    const onHash = () => { setRoute(parseHash()); setDrawer(false); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!nav || !branch) return;
    const path = pathForKey(nav, route);
    if (!path) {
      if (route !== '') { location.hash = ''; return; }
      setStatus('notfound');
      setPage(null);
      return;
    }
    let live = true;
    setStatus('loading');
    const ck = branch + ':' + path;
    const show = text => {
      if (!live) return;
      setPage({ ...parseMarkdown(text, path, branch), path });
      setStatus('ready');
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    if (cache.current[ck]) { show(cache.current[ck]); return () => { live = false; }; }
    fetch(rawUrl(path, branch))
      .then(r => (r.ok ? r.text() : Promise.reject(r.status)))
      .then(t => { cache.current[ck] = t; show(t); })
      .catch(() => { if (live) { setStatus('error'); setPage(null); } });
    return () => { live = false; };
  }, [nav, route, branch, nonce]);

  const pickBranch = b => {
    if (b === branch) return;
    localStorage.setItem('ln-docs-branch', b);
    setBranch(b);
    setDrawer(false);
  };

  const section = sectionForKey(nav, route);
  const crumb = status === 'ready'
    ? (section ? section.title : (route === '' ? 'Guide' : 'Reference'))
    : null;

  return (
    <>
      <DocsTopBar drawerOpen={drawer} onMenu={() => setDrawer(o => !o)} />
      <main className="docs-shell">
        <aside className={`docs-side${drawer ? ' is-open' : ''}`}>
          <BranchSwitcher versions={versions} current={branch} onPick={pickBranch} />
          <DocsSidebar nav={nav} route={route} onPick={() => setDrawer(false)} />
        </aside>
        {drawer && <div className="docs-scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}
        <article className="doc-article" key={branch + ':' + ((page && page.path) || status)}>
          <DocsArticle status={status} page={page} crumb={crumb} branch={branch} onRetry={() => setNonce(n => n + 1)} />
        </article>
        <aside className="docs-toc-col">
          {status === 'ready' && page && <DocsToc toc={page.toc} reduce={reduce} />}
        </aside>
      </main>
      <DocsFooter release={release} branch={branch} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<DocsApp />);
