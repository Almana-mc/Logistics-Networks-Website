/* visualiser-page.jsx — standalone visualiser route: nav + Visualiser + footer */

function VisNav() {
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
        <a href="library.html">Library</a>
        <span className="nav__here" aria-current="page">Visualiser</span>
      </div>
    </nav>
  );
}

function VisFooter({ release }) {
  return (
    <footer className="footer">
      <div className="section-wrap footer__inner">
        <div className="footer__brand">
          <span className="nav__name">LOGISTICS<span>NETWORK</span></span>
          <p className="mono">.lnet visualiser · runs entirely in your browser</p>
        </div>
        <div className="footer__links">
          <a href="index.html">Home</a>
          <a href="library.html">Library</a>
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

function VisualiserPage() {
  const release = useRelease();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const graphOpts = {
    style: 'glow',
    pulseSpeed: reduce ? 0.45 : 1,
    breathing: !reduce,
    nodePulse: !reduce,
  };
  return (
    <>
      <VisNav />
      <main>
        <Visualiser graphOpts={graphOpts} />
      </main>
      <VisFooter release={release} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<VisualiserPage />);
