/* hero.jsx — top section: nav + mod name/description + live graph centerpiece */

function NavBar() {
  return (
    <nav className="nav" aria-label="Primary">
      <a className="nav__brand" href="#top">
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
        <a href="#download">Download</a>
        <a href="#" aria-disabled="true" onClick={e => e.preventDefault()}>Docs</a>
        <Btn as="a" href="#visualiser" variant="ghost" className="nav__cta" aria-label="Open visualiser">
          Open Visualiser <Icon name="arrow" size={15} />
        </Btn>
      </div>
    </nav>
  );
}

function Hero({ heroData, graphOpts, headline, release }) {
  const lines = headline.split('/').map(l => l.trim());
  return (
    <header className="hero hero--boot" id="top" data-screen-label="Hero">
      <div className="hero__grid">
        <div className="hero__copy">
          <div className="hero__status">
            <span className="kicker hero__kicker">Network Visualiser · v{release.version.split('-')[0]}</span>
            <span className="hero__boot mono" aria-hidden="true">
              <span className="hero__boot-dot" /> system online
            </span>
          </div>
          <h1 className="hero__title">
            {lines.map((line, i) => (
              <span key={i} className="hero__line" style={{ '--i': i }}>{line}</span>
            ))}
            <span className="hero__title-sweep" aria-hidden="true" />
          </h1>
          <p className="hero__blurb">{MOD.blurb}</p>
          <div className="hero__actions">
            <Btn as="a" href="#visualiser" variant="primary">
              <Icon name="upload" size={17} /> Drop a .lnet file
            </Btn>
            <Btn as="a" href="#download" variant="ghost">
              <Icon name="download" size={17} /> Get the mod
            </Btn>
          </div>
          <ul className="hero__stats">
            {MOD.stats.map((s, i) => (
              <li key={s.l} style={{ '--i': i }}><b className="mono">{s.n}</b><span>{s.l}</span></li>
            ))}
          </ul>
        </div>

        <div className="hero__graph">
          <div className="hero__well">
            <GraphCanvas data={heroData} options={{ ...graphOpts, decorative: true, interactive: false }} className="graph-canvas--hero" />
            <span className="hero__surge" aria-hidden="true" />
            <span className="hero__scan" aria-hidden="true" />
            <div className="hero__frame" aria-hidden="true">
              <span className="corner tl" /><span className="corner tr" />
              <span className="corner bl" /><span className="corner br" />
            </div>
            <span className="hero__tag mono" aria-hidden="true">
              <span className="hero__tag-boot">▸ booting topology</span>
              <span className="hero__tag-live">● live topology · sim</span>
            </span>
            <Legend />
          </div>
        </div>
      </div>
      <div className="hero__scroll mono" aria-hidden="true">Scroll ↓</div>
    </header>
  );
}

function Legend() {
  return (
    <div className="legend">
      {RESOURCE_TYPES.map(r => (
        <span key={r.id} className="legend__item" style={{ '--c': `var(${r.v})` }}>
          <span className="legend__dot" />{r.label}
        </span>
      ))}
    </div>
  );
}

Object.assign(window, { NavBar, Hero });
