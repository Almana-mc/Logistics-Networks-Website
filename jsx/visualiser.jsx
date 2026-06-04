/* visualiser.jsx — bottom section */

const SAMPLE_LNET = `version=1.0
network=transfer check
label=barrel1
clipboard={channels:[{batch:10000,delay:1,enabled:1b,index:0,mode:"EXPORT"}],network_name:"transfer check",node_label:"barrel1",required_items:[{count:1,item:{count:1,id:"logisticsnetworks:netherite_upgrade"}}],upgrades:[{item:{count:1,id:"logisticsnetworks:netherite_upgrade"},slot:0}]}
label=barrel
clipboard={channels:[{enabled:1b,index:0}],network_name:"transfer check",node_label:"barrel"}`;

function shortId(id) {
  if (!id) return '';
  return id.includes(':') ? id.split(':')[1].replace(/_/g, ' ') : id;
}

function Visualiser({ graphOpts }) {
  const [net, setNet] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [fileName, setFileName] = React.useState('');
  const [selected, setSelected] = React.useState(-1);
  const [drag, setDrag] = React.useState(false);
  const [pending, setPending] = React.useState(null);
  const fileInput = React.useRef(null);

  const commit = (parsed, name) => {
    setNet(parsed); setError(null); setFileName(name || 'network.lnet'); setSelected(-1);
  };

  const load = (text, name) => {
    let parsed;
    try {
      parsed = LNET.parse(text);
      parsed.nodes.forEach(n => {
        const t = (n.config.activeChannels[0] || {}).type;
        n.dominantType = n.visible ? (t || 'ITEM') : null;
        n.role = n.visible ? 'node' : 'hidden';
      });
    } catch (e) {
      setError(e.message || 'Could not parse file.'); setNet(null); setPending(null);
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { commit(parsed, name); return; }
    setError(null); setNet(null); setPending({ net: parsed, name: name || 'network.lnet' });
  };

  const onFile = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => load(String(r.result), file.name);
    r.readAsText(file);
  };

  const graphData = React.useMemo(() => {
    if (!net) return null;
    return {
      nodes: net.nodes.map(n => ({ label: n.label, dominantType: n.dominantType, role: n.role, baseR: 11 })),
      edges: net.topology,
    };
  }, [net]);

  const onNodeClick = React.useCallback(({ index }) => setSelected(index), []);

  return (
    <section className="vis" id="visualiser" data-screen-label="Visualiser">
      <div className="section-wrap">
        <div className="vis__head">
          <span className="kicker">The Visualiser</span>
          <h2 className="vis__title">See your network breathe.</h2>
          <p className="vis__lead">
            Drop a <span className="mono">.lnet</span> export from the in-game Computer screen.
            We parse every node, infer the flow between exporters and importers, and render it live,
            colour-coded by resource type.
          </p>
        </div>

        {!net && !pending && (
          <UploadZone drag={drag} setDrag={setDrag} onFile={onFile} error={error}
            fileInput={fileInput}
            onTiny={() => load(SAMPLE_LNET, 'transfer check.lnet')} />
        )}

        {pending && (
          <Processing net={pending.net} name={pending.name}
            onComplete={() => { commit(pending.net, pending.name); setPending(null); }} />
        )}

        {net && (
          <div className="vis__stage">
            <div className="vis__bar">
              <div className="vis__file">
                <Icon name="file" size={16} />
                <span className="mono">{fileName}</span>
                <span className="vis__net">{net.network}</span>
              </div>
              <div className="vis__statline mono">
                <span><b>{net.stats.nodes}</b> nodes</span>
                <span><b>{net.stats.links}</b> links</span>
                <span><b>{net.stats.activeChannels}</b> active ch.</span>
                {net.stats.hidden > 0 && <span className="dim">{net.stats.hidden} hidden</span>}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setNet(null); setError(null); setPending(null); }}>
                <Icon name="reset" size={15} /> New file
              </button>
            </div>

            <div className="vis__grid">
              <div className="vis__graph">
                <GraphCanvas data={graphData} options={{ ...graphOpts, interactive: true }}
                  ariaLabel={`${net.network} topology graph`}
                  onNodeClick={onNodeClick} selectedIndex={selected} className="graph-canvas--vis" />
                <Legend />
                {net.warnings.length > 0 && (
                  <div className="vis__warn mono">⚠ {net.warnings.length} parsing note{net.warnings.length === 1 ? '' : 's'}</div>
                )}
                {selected < 0 && <div className="vis__hint mono">click a node →</div>}
              </div>
              <NodeDetail node={selected >= 0 ? net.nodes[selected] : null} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function UploadZone({ drag, setDrag, onFile, error, onTiny, fileInput }) {
  return (
    <div className={`upload ${drag ? 'upload--drag' : ''} ${error ? 'upload--error' : ''}`}
      role="button"
      tabIndex="0"
      aria-label="Choose or drop a .lnet file"
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={e => { e.preventDefault(); setDrag(false); }}
      onDrop={e => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
      onClick={() => fileInput.current.click()}
      onKeyDown={e => {
        if (e.currentTarget !== e.target) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput.current.click();
        }
      }}>
      <input ref={fileInput} type="file" accept=".lnet,.txt" hidden
        onChange={e => onFile(e.target.files[0])} />
      <div className="upload__pulse" aria-hidden="true">
        <span /><span /><span />
        <div className="upload__core"><Icon name="upload" size={30} /></div>
      </div>
      <h3 className="upload__title">{error ? 'Could not read that file' : 'Drop a .lnet file here'}</h3>
      <p className="upload__sub">
        {error ? <span className="upload__err" role="alert">{error}</span>
               : <>or <u>browse</u>. Parsed entirely in your browser, nothing is uploaded.</>}
      </p>
      <div className="upload__samples" onClick={e => e.stopPropagation()}>
        <button className="btn btn-ghost btn-sm" onClick={onTiny}>Load spec example</button>
      </div>
    </div>
  );
}

const LOAD_TYPES = ['item', 'fluid', 'energy', 'chemical', 'source'];

function Processing({ net, name, onComplete }) {
  const steps = [
    { k: 'Reading export', v: name },
    { k: 'Parsing nodes', v: net.stats.nodes },
    { k: 'Inferring flow', v: net.stats.links },
    { k: 'Resolving channels', v: net.stats.activeChannels },
    { k: 'Building topology', v: 'ok' },
  ];
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const timers = [];
    steps.forEach((_, i) => timers.push(setTimeout(() => setStep(i + 1), 200 + i * 210)));
    timers.push(setTimeout(onComplete, 260 + steps.length * 210));
    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = step / steps.length;

  return (
    <div className="vis__stage vis__stage--load" role="status" aria-live="polite">
      <span className="sr-only">Processing {name}, {net.stats.nodes} nodes.</span>
      <div className="vis__bar load-bar">
        <span className="skel skel--file" />
        <span className="skel skel--stats" />
        <span className="skel skel--btn" />
      </div>

      <div className="vis__grid">
        <div className="vis__graph load-graph" aria-hidden="true">
          <span className="load-graph__scan" />
          <ul className="load-graph__nodes">
            {LOAD_TYPES.map((t, i) => (
              <li key={t} className={`load-node load-node--${i}`} style={{ '--c': `var(--type-${t})`, '--d': `${i * 0.12}s` }} />
            ))}
          </ul>

          <div className="load-steps mono">
            {steps.map((s, i) => (
              <div key={s.k} className={`load-step${i < step ? ' is-done' : ''}${i === step ? ' is-active' : ''}`}>
                <span className="load-step__dot" />
                <span className="load-step__k">{s.k}</span>
                <span className="load-step__v">{i < step ? s.v : ''}</span>
              </div>
            ))}
            <div className="load-progress"><span style={{ transform: `scaleX(${progress})` }} /></div>
          </div>
        </div>

        <aside className="detail detail--skel" aria-hidden="true">
          <span className="skel skel--line w70" />
          <span className="skel skel--line w40" />
          <span className="skel skel--chip" />
          <span className="skel skel--block" />
          <span className="skel skel--block" />
        </aside>
      </div>
    </div>
  );
}

function NodeDetail({ node }) {
  if (!node) {
    return (
      <aside className="detail detail--empty">
        <div className="detail__placeholder mono">
          <span className="detail__ph-mark" />
          Select a node<br />Inspect its channels
        </div>
      </aside>
    );
  }
  const cfg = node.config;
  const active = cfg.activeChannels;
  return (
    <aside className="detail">
      <div className="detail__head">
        <span className="detail__kicker mono">NODE</span>
        <h3 className="detail__name">{node.label}</h3>
        <div className="detail__tags">
          <span className={`pill ${node.visible ? 'pill--on' : 'pill--off'}`}>{node.visible ? 'visible' : 'hidden'}</span>
          <span className="pill pill--mute">{active.length} / 9 channels</span>
        </div>
      </div>

      <div className="detail__section">
        <span className="detail__label mono">CHANNELS</span>
        {active.length === 0 && <p className="detail__none">No active channels.</p>}
        <ul className="chan-list">
          {active.map((c, i) => (
            <li className="chan" key={c.index} style={{ '--c': `var(--type-${c.type.toLowerCase()})`, '--i': i }}>
              <div className="chan__head">
                <span className="chan__idx mono">CH{c.index}</span>
                <span className={`chan__mode chan__mode--${c.mode.toLowerCase()}`}>{c.mode}</span>
                <span className="chan__type">{c.type}</span>
              </div>
              <div className="chan__stats mono">
                <span><i>batch</i>{c.batch.toLocaleString()}</span>
                <span><i>delay</i>{c.delay}t</span>
                <span><i>side</i>{c.io}</span>
                {c.priority !== 0 && <span><i>prio</i>{c.priority}</span>}
              </div>
              {c.name && <div className="chan__name">"{c.name}"</div>}
            </li>
          ))}
        </ul>
      </div>

      {cfg.upgrades.length > 0 && (
        <div className="detail__section">
          <span className="detail__label mono">UPGRADES</span>
          <ul className="item-list">
            {cfg.upgrades.map((u, i) => (
              <li key={i} className="item-row"><span className="item-row__slot mono">S{u.slot}</span>{shortId(u.item.id)}</li>
            ))}
          </ul>
        </div>
      )}

      {cfg.required_items.length > 0 && (
        <div className="detail__section">
          <span className="detail__label mono">REQUIRED TO PASTE</span>
          <ul className="item-list">
            {cfg.required_items.map((r, i) => (
              <li key={i} className="item-row"><span className="item-row__qty mono">×{r.count}</span>{shortId(r.item.id)}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

Object.assign(window, { Visualiser });
