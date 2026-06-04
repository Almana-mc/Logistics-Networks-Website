/* ===========================================================================
   lnet.js — .lnet file parser
   - Hand-rolled SNBT (stringified NBT) parser
   - .lnet line-grammar parser per the format spec
   - Applies §4.1 compaction defaults
   - Infers network topology (flow edges) from channel mode/index/type
   Exposed as window.LNET
   =========================================================================== */
(function () {
  'use strict';

  /* ---------------------- SNBT parser ---------------------- */
  // Parses a single compound {...}. Returns plain JS object.
  // Numbers: typed suffixes (b s L f d, case-insensitive) are stripped;
  // 1b/0b stay numeric but we expose helpers to read booleans.
  function parseSNBT(str) {
    let i = 0;
    const s = str;

    function ws() { while (i < s.length && /\s/.test(s[i])) i++; }
    function peek() { return s[i]; }

    function parseValue() {
      ws();
      const c = s[i];
      if (c === '{') return parseCompound();
      if (c === '[') return parseList();
      if (c === '"' || c === "'") return parseQuoted(c);
      return parseLiteral();
    }

    function parseCompound() {
      const obj = {};
      i++; // {
      ws();
      if (s[i] === '}') { i++; return obj; }
      while (i < s.length) {
        ws();
        let key;
        if (s[i] === '"' || s[i] === "'") key = parseQuoted(s[i]);
        else {
          let start = i;
          while (i < s.length && !/[:\s]/.test(s[i])) i++;
          key = s.slice(start, i);
        }
        ws();
        if (s[i] === ':') i++;
        const val = parseValue();
        obj[key] = val;
        ws();
        if (s[i] === ',') { i++; continue; }
        if (s[i] === '}') { i++; break; }
        break;
      }
      return obj;
    }

    function parseList() {
      const arr = [];
      i++; // [
      ws();
      // typed array prefix [I; / [B; / [L;
      if (/[IBL]/.test(s[i]) && s[i + 1] === ';') i += 2;
      ws();
      if (s[i] === ']') { i++; return arr; }
      while (i < s.length) {
        const val = parseValue();
        arr.push(val);
        ws();
        if (s[i] === ',') { i++; ws(); continue; }
        if (s[i] === ']') { i++; break; }
        break;
      }
      return arr;
    }

    function parseQuoted(q) {
      i++; // opening quote
      let out = '';
      while (i < s.length) {
        const c = s[i++];
        if (c === '\\') { out += s[i++]; continue; }
        if (c === q) break;
        out += c;
      }
      return out;
    }

    function parseLiteral() {
      let start = i;
      while (i < s.length && !/[,\]}:\s]/.test(s[i])) i++;
      let tok = s.slice(start, i);
      if (tok === 'true') return true;
      if (tok === 'false') return false;
      // numeric with optional type suffix
      const m = /^(-?\d*\.?\d+(?:[eE][-+]?\d+)?)([bBsSlLfFdD]?)$/.exec(tok);
      if (m) {
        const num = parseFloat(m[1]);
        return num;
      }
      return tok; // bare unquoted string
    }

    ws();
    const result = parseValue();
    return result;
  }

  function toBool(v, dflt) {
    if (v === undefined || v === null) return dflt;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return v === 'true' || v === '1' || v === '1b';
    return dflt;
  }

  /* ---------------------- String unescape (§3) ---------------------- */
  function unescapeStr(str) {
    let out = '';
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (c === '\\') {
        const n = str[i + 1];
        if (n === undefined) { out += '\\'; break; }
        if (n === 'n') out += '\n';
        else if (n === 'r') out += '\r';
        else if (n === 't') out += '\t';
        else out += n;
        i++;
      } else out += c;
    }
    return out;
  }

  /* ---------------------- Channel defaults (§4.3) ---------------------- */
  const CH_DEFAULTS = {
    enabled: false, mode: 'IMPORT', type: 'ITEM', batch: 8, delay: 20,
    io: 'up', redstone: 'ALWAYS_ON', distribution: 'PRIORITY',
    filter_mode: 'MATCH_ANY', priority: 0, name: ''
  };

  function normChannel(raw) {
    const idx = Math.trunc(Number(raw.index));
    if (!(idx >= 0 && idx <= 8)) return null;
    const ch = { index: idx };
    ch.enabled = toBool(raw.enabled, CH_DEFAULTS.enabled);
    ch.mode = (raw.mode || CH_DEFAULTS.mode).toUpperCase();
    ch.type = (raw.type || CH_DEFAULTS.type).toUpperCase();
    ch.batch = raw.batch !== undefined ? Math.max(1, Math.trunc(raw.batch)) : CH_DEFAULTS.batch;
    ch.delay = raw.delay !== undefined ? Math.max(1, Math.trunc(raw.delay)) : CH_DEFAULTS.delay;
    let io = (raw.io || CH_DEFAULTS.io);
    const dirs = ['up', 'down', 'north', 'south', 'east', 'west', 'all'];
    ch.io = dirs.includes(io) ? io : 'up';
    ch.redstone = raw.redstone || CH_DEFAULTS.redstone;
    ch.distribution = raw.distribution || CH_DEFAULTS.distribution;
    ch.filter_mode = raw.filter_mode || CH_DEFAULTS.filter_mode;
    ch.priority = raw.priority !== undefined ? Math.max(-99, Math.min(99, Math.trunc(raw.priority))) : 0;
    ch.name = raw.name || '';
    return ch;
  }

  // Build a full 9-channel view: present channels normalized, missing ones = disabled defaults.
  function fullChannels(rawList) {
    const byIdx = {};
    (rawList || []).forEach(r => {
      const c = normChannel(r);
      if (c) byIdx[c.index] = c;
    });
    const out = [];
    for (let i = 0; i < 9; i++) {
      out.push(byIdx[i] || Object.assign({ index: i }, CH_DEFAULTS));
    }
    return out;
  }

  /* ---------------------- Node config from clipboard SNBT ---------------------- */
  function buildNodeConfig(clip, fallbackLabel) {
    const cfg = {};
    cfg.network_name = clip.network_name || '';
    cfg.node_label = clip.node_label || fallbackLabel || '';
    cfg.renderVisible = clip.renderVisible === undefined ? true : toBool(clip.renderVisible, true);
    cfg.channels = fullChannels(clip.channels);
    cfg.activeChannels = cfg.channels.filter(c => c.enabled);
    cfg.filters = (clip.filters || []).map(f => ({
      channel: Math.trunc(f.channel || 0),
      slot: Math.trunc(f.slot || 0),
      item: normItem(f.item)
    }));
    cfg.upgrades = (clip.upgrades || []).map(u => ({
      slot: Math.trunc(u.slot || 0),
      item: normItem(u.item)
    }));
    cfg.required_items = (clip.required_items || []).map(r => ({
      item: normItem(r.item),
      count: Math.trunc(r.count || 1)
    }));
    return cfg;
  }

  function normItem(it) {
    if (!it) return null;
    return {
      id: it.id || 'minecraft:air',
      count: Math.trunc(it.count || 1),
      components: it.components || null
    };
  }

  /* ---------------------- Header detection (§2) ---------------------- */
  function isHeader(line) {
    const [k, v] = splitFirst(line, '=');
    if (k === 'version' && v === '1.0') return true;
    if (k === 'format' && v === 'lnet') return true;
    if (k === 'lnet' && v === '1') return true;
    return false;
  }

  function splitFirst(line, sep) {
    const idx = line.indexOf(sep);
    if (idx === -1) return [line.trim(), ''];
    return [line.slice(0, idx).trim(), line.slice(idx + 1)];
  }

  /* ---------------------- Main .lnet parser (§5) ---------------------- */
  function parse(text) {
    const result = { network: '', nodes: [], warnings: [] };
    if (!text || !text.length) throw new LnetError('Empty file.');
    const lines = text.split(/\r\n|\r|\n/);

    // find first non-empty line -> header
    let li = 0;
    while (li < lines.length && lines[li].trim() === '') li++;
    if (li >= lines.length) throw new LnetError('File has no content.');
    if (!isHeader(lines[li].trim())) {
      throw new LnetError('Not a valid .lnet file. Missing version/format header.');
    }

    let cur = null;
    const flush = () => {
      if (!cur) return;
      if (!cur.label || cur.clipboard == null) {
        result.warnings.push(`Skipped node "${cur.label || '(unnamed)'}". Missing label or clipboard.`);
        cur = null; return;
      }
      let clip;
      try { clip = parseSNBT(cur.clipboard); }
      catch (e) { result.warnings.push(`Node "${cur.label}" has unparseable clipboard.`); cur = null; return; }
      const cfg = buildNodeConfig(clip, cur.label);
      result.nodes.push({ label: cur.label, visible: cur.visible, config: cfg });
      cur = null;
    };

    for (li; li < lines.length; li++) {
      const raw = lines[li];
      if (raw.trim() === '') continue;
      const [key, value] = splitFirst(raw, '=');
      const k = key.toLowerCase();
      switch (k) {
        case 'version': case 'format': case 'lnet': break; // header lines, already validated
        case 'network': case 'n':
          result.network = unescapeStr(value); break;
        case 'label': case 'node':
          flush();
          cur = { label: unescapeStr(value), visible: true, clipboard: null };
          break;
        case 'visible': case 'v':
          if (cur) cur.visible = !(value.trim() === 'false' || value.trim() === '0');
          break;
        case 'clipboard': case 'c':
          if (cur) cur.clipboard = value;
          break;
        case 'end':
          flush(); break;
        default: break; // unknown -> ignore
      }
    }
    flush();

    if (!result.network.trim()) throw new LnetError('Network name is blank.');
    if (!result.nodes.length) throw new LnetError('No valid node blocks found.');

    result.topology = inferTopology(result.nodes);
    result.stats = computeStats(result);
    return result;
  }

  /* ---------------------- Topology inference ----------------------
     The file lists nodes + per-channel configs but NOT explicit links.
     We infer logical flows: within a channel index, EXPORT nodes push to
     IMPORT nodes (matched by channel index + resource type). Edge color =
     resource type. This produces a meaningful, data-driven graph.
  ------------------------------------------------------------------ */
  function inferTopology(nodes) {
    const edges = [];
    const seen = new Set();
    for (let idx = 0; idx <= 8; idx++) {
      // group enabled channels at this index by type
      const byType = {};
      nodes.forEach((n, ni) => {
        const ch = n.config.channels[idx];
        if (!ch.enabled) return;
        (byType[ch.type] = byType[ch.type] || []).push({ ni, ch });
      });
      Object.keys(byType).forEach(type => {
        const group = byType[type];
        const exporters = group.filter(g => g.ch.mode === 'EXPORT');
        const importers = group.filter(g => g.ch.mode === 'IMPORT');
        if (exporters.length && importers.length) {
          exporters.forEach(e => importers.forEach(im => {
            if (e.ni === im.ni) return;
            const id = `${e.ni}-${im.ni}-${idx}-${type}`;
            if (seen.has(id)) return; seen.add(id);
            edges.push({ from: e.ni, to: im.ni, type, channel: idx,
              batch: e.ch.batch, delay: e.ch.delay });
          }));
        } else if (group.length > 1) {
          // no clear direction: link consecutively so the channel still reads as connected
          for (let j = 0; j < group.length - 1; j++) {
            const a = group[j], b = group[j + 1];
            const id = `${a.ni}-${b.ni}-${idx}-${type}`;
            if (seen.has(id)) continue; seen.add(id);
            edges.push({ from: a.ni, to: b.ni, type, channel: idx,
              batch: a.ch.batch, delay: a.ch.delay, undirected: true });
          }
        }
      });
    }
    // Ensure no node is fully orphaned: tie lone nodes to the most-connected hub.
    const degree = nodes.map(() => 0);
    edges.forEach(e => { degree[e.from]++; degree[e.to]++; });
    if (nodes.length > 1) {
      let hub = 0; degree.forEach((d, i) => { if (d > degree[hub]) hub = i; });
      nodes.forEach((n, ni) => {
        if (ni !== hub && degree[ni] === 0) {
          edges.push({ from: hub, to: ni, type: 'LINK', channel: -1, batch: 0, delay: 0, weak: true });
        }
      });
    }
    return edges;
  }

  function computeStats(result) {
    let active = 0, hidden = 0;
    const types = {};
    result.nodes.forEach(n => {
      if (!n.visible) hidden++;
      n.config.activeChannels.forEach(c => {
        active++;
        types[c.type] = (types[c.type] || 0) + 1;
      });
    });
    return {
      nodes: result.nodes.length,
      hidden,
      activeChannels: active,
      links: result.topology.filter(e => !e.weak).length,
      types
    };
  }

  class LnetError extends Error {}

  window.LNET = { parse, parseSNBT, CH_DEFAULTS, LnetError };
})();
