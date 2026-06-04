/* app.jsx — composition, baked design defaults, mount */

const DESIGN = {
  palette: ['#5ad9e6', '#f0993f'],
  graphStyle: 'glow',
  layout: 'split',
  pulseSpeed: 1,
  breathing: true,
  headline: 'Every node. / Every flow. / One live map.',
};

function applyPalette(p) {
  const root = document.documentElement.style;
  root.setProperty('--accent', p[0]);
  root.setProperty('--accent-2', p[1] || p[0]);
}

function Footer({ release }) {
  return (
    <footer className="footer" data-screen-label="Footer">
      <div className="section-wrap footer__inner">
        <div className="footer__brand">
          <span className="nav__name">LOGISTICS<span>NETWORK</span></span>
          <p className="mono">.lnet visualiser · runs entirely in your browser</p>
        </div>
        <div className="footer__links">
          <a href="https://github.com/Almana-mc/LogisticsNetworks" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://discord.gg/xTeHR2tdYh" target="_blank" rel="noreferrer">Discord</a>
          <a href="#download">Download</a>
          <a href="library.html">Library</a>
          <a href="visualiser.html">Visualiser</a>
        </div>
        <div className="footer__meta mono">
          v{release.version} · {MOD.loader}<br />
          Unofficial companion tool · not affiliated with Mojang
        </div>
      </div>
    </footer>
  );
}

function App() {
  React.useEffect(() => { applyPalette(DESIGN.palette); }, []);

  const release = useRelease();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const graphOpts = {
    style: DESIGN.graphStyle,
    pulseSpeed: reducedMotion ? 0.45 : DESIGN.pulseSpeed,
    breathing: reducedMotion ? false : DESIGN.breathing,
    nodePulse: !reducedMotion,
  };

  const heroData = React.useMemo(() => buildHeroNetwork(7), []);

  return (
    <>
      <NavBar />
      <Hero heroData={heroData} graphOpts={graphOpts} headline={DESIGN.headline} release={release} />
      <Downloads release={release} />
      <Footer release={release} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
