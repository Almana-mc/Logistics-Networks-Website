/* docs-ui.jsx — docs presentational components */

function BranchSwitcher({ versions, current, onPick }) {
  if (!versions || !versions.length) return null;
  return (
    <div className="docs-ver" role="group" aria-label="Minecraft version">
      <span className="docs-ver__label mono">Minecraft version</span>
      <div className="docs-ver__pills">
        {versions.map(v => (
          <button
            key={v}
            className={`docs-ver__pill${v === current ? ' is-active' : ''}`}
            aria-pressed={v === current}
            disabled={versions.length === 1}
            onClick={() => onPick(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function DocsSidebar({ nav, route, onPick }) {
  if (!nav) {
    return (
      <nav className="docs-side__nav" aria-label="Documentation sections">
        {[...Array(7)].map((_, i) => <span key={i} className="docs-nav__skel" style={{ '--i': i }} />)}
      </nav>
    );
  }
  const cls = (k, base) => base + (route === k ? ' is-active' : '');
  const cur = k => (route === k ? 'page' : undefined);
  const link = (it, c) => (
    <a key={it.key || 'overview'} href={'#' + it.key} className={cls(it.key, c)} aria-current={cur(it.key)} onClick={onPick}>
      {it.title}
    </a>
  );
  return (
    <nav className="docs-side__nav" aria-label="Documentation sections">
      {nav.overview && link(nav.overview, 'docs-nav__link')}
      {nav.sections.map(sec => (
        <div className="docs-nav__group" key={sec.key}>
          <a href={'#' + sec.key} className={cls(sec.key, 'docs-nav__head')} aria-current={cur(sec.key)} onClick={onPick}>
            {sec.title}
          </a>
          {sec.pages.length > 0 && (
            <div className="docs-nav__children">
              {sec.pages.map(p => (
                <a key={p.key} href={'#' + p.key} className={cls(p.key, 'docs-nav__sub')} aria-current={cur(p.key)} onClick={onPick}>
                  {p.title}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
      {nav.extras.length > 0 && <span className="docs-nav__rule" aria-hidden="true" />}
      {nav.extras.map(it => link(it, 'docs-nav__link'))}
    </nav>
  );
}

function DocsToc({ toc, reduce }) {
  const [active, setActive] = useState(toc[0] ? toc[0].id : null);
  useEffect(() => {
    if (!toc.length) return;
    setActive(toc[0].id);
    const els = toc.map(t => document.getElementById(t.id)).filter(Boolean);
    const obs = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.id);
    }, { rootMargin: '-84px 0px -68% 0px', threshold: 0 });
    els.forEach(e => obs.observe(e));
    return () => obs.disconnect();
  }, [toc]);

  if (toc.length < 2) return null;
  const go = id => {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  return (
    <nav className="docs-toc" aria-label="On this page">
      <span className="docs-toc__label mono">On this page</span>
      <ul>
        {toc.map(t => (
          <li key={t.id} className={`docs-toc__item docs-toc__item--l${t.level}`}>
            <button className={`docs-toc__link${active === t.id ? ' is-active' : ''}`} onClick={() => go(t.id)}>
              {t.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ArticleSkeleton() {
  return (
    <div className="doc-skel" aria-busy="true" aria-label="Loading documentation">
      <span className="doc-skel__crumb" style={{ '--i': 0 }} />
      <span className="doc-skel__h" style={{ '--i': 1 }} />
      {[94, 80].map((w, i) => <span key={'a' + i} className="doc-skel__line" style={{ width: w + '%', '--i': 2 + i }} />)}
      <span className="doc-skel__fig" style={{ '--i': 4 }} />
      <span className="doc-skel__h2" style={{ '--i': 5 }} />
      {[90, 96, 72, 88].map((w, i) => <span key={'b' + i} className="doc-skel__line" style={{ width: w + '%', '--i': 6 + i }} />)}
    </div>
  );
}

function DocsMessage({ kind, onRetry, repoUrl }) {
  const notFound = kind === 'notfound';
  return (
    <div className={`doc-msg doc-msg--${kind}`} role={notFound ? undefined : 'alert'}>
      <span className="doc-msg__mark">
        <Icon name={notFound ? 'search' : 'alert'} size={26} />
      </span>
      <h1 className="doc-msg__title">{notFound ? 'Topic not found' : 'Could not load this page'}</h1>
      <p className="doc-msg__body">
        {notFound
          ? 'That guide page does not exist in this network. Pick a topic from the menu to keep reading.'
          : 'The guide is fetched live from the mod repository. Check your connection and try again.'}
      </p>
      <div className="doc-msg__actions">
        {notFound
          ? <Btn as="a" href="#" variant="primary"><Icon name="book" size={16} /> Back to Overview</Btn>
          : <Btn variant="primary" onClick={onRetry}><Icon name="reset" size={16} /> Retry</Btn>}
        <a className="doc-msg__src" href={repoUrl} target="_blank" rel="noreferrer">
          Source on GitHub <Icon name="external" size={14} />
        </a>
      </div>
    </div>
  );
}

Object.assign(window, { BranchSwitcher, DocsSidebar, DocsToc, ArticleSkeleton, DocsMessage });
