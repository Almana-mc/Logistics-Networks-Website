import React from "react";
import { rawUrl, resolvePath, dirOf, routeFromMdPath } from "./docs-source";

const h = React.createElement;

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function mdLink(textNodes, href, baseDir, key) {
  try {
    if (new URL(href, "https://guide.invalid").protocol !== "https:")
      return h("span", { key }, textNodes);
  } catch {
    return h("span", { key }, textNodes);
  }
  if (/^https:/i.test(href)) {
    return h(
      "a",
      {
        key,
        href,
        target: "_blank",
        rel: "noreferrer",
        className: "doc-link doc-link--ext",
      },
      textNodes,
    );
  }
  if (/\.md(#|$)/i.test(href)) {
    const [path, anchor] = href.split("#");
    const route = routeFromMdPath(resolvePath(baseDir, path));
    return h(
      "a",
      {
        key,
        href: "#" + route + (anchor ? "~" + anchor : ""),
        className: "doc-link",
      },
      textNodes,
    );
  }
  if (href.startsWith("#"))
    return h(
      "a",
      {
        key,
        href,
        className: "doc-link",
        onClick: (event) => {
          event.preventDefault();
          const target = document.getElementById(href.slice(1));
          target?.scrollIntoView({ block: "start" });
          target?.setAttribute("tabindex", "-1");
          target?.focus({ preventScroll: true });
        },
      },
      textNodes,
    );
  return h("a", { key, href, className: "doc-link" }, textNodes);
}

const INLINE_SRC =
  "!\\[([^\\]]*)\\]\\(([^)\\s]+)[^)]*\\)|\\[([^\\]]+)\\]\\(([^)\\s]+)[^)]*\\)|`([^`]+)`|\\*\\*([^*]+)\\*\\*|\\*([^*\\n]+)\\*";

function parseInline(text, baseDir, img, kp) {
  const out = [];
  let last = 0,
    m,
    n = 0;
  const re = new RegExp(INLINE_SRC, "g");
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = kp + "-" + n++;
    if (m[0][0] === "!")
      out.push(
        h("img", {
          key,
          src: img(m[2]),
          alt: m[1] || "",
          loading: "lazy",
          className: "doc-inline-img",
        }),
      );
    else if (m[3] !== undefined)
      out.push(
        mdLink(parseInline(m[3], baseDir, img, key + "l"), m[4], baseDir, key),
      );
    else if (m[5] !== undefined)
      out.push(h("code", { key, className: "doc-code" }, m[5]));
    else if (m[6] !== undefined) out.push(h("strong", { key }, m[6]));
    else if (m[7] !== undefined) out.push(h("em", { key }, m[7]));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function figure(alt, src, key) {
  return h("figure", { key, className: "doc-figure" }, [
    h("img", {
      key: "i",
      src,
      alt,
      loading: "lazy",
      className: "doc-figure__img",
    }),
    alt
      ? h("figcaption", { key: "c", className: "doc-figure__cap mono" }, alt)
      : null,
  ]);
}

function parseList(lines, start, inline, key) {
  const baseIndent = lines[start].match(/^(\s*)/)[1].length;
  const ordered = /^\s*\d+\.\s/.test(lines[start]);
  const items = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      const nxt = lines[i + 1];
      if (
        nxt &&
        /^\s*([-*]|\d+\.)\s+/.test(nxt) &&
        nxt.match(/^(\s*)/)[1].length >= baseIndent
      ) {
        i++;
        continue;
      }
      break;
    }
    const indent = line.match(/^(\s*)/)[1].length;
    const m = line.match(/^\s*([-*]|\d+\.)\s+(.*)$/);
    if (!m || indent < baseIndent) break;
    let txt = m[2];
    i++;
    let nested = null;
    while (i < lines.length && lines[i].trim()) {
      const ind = lines[i].match(/^(\s*)/)[1].length;
      if (/^\s*([-*]|\d+\.)\s+/.test(lines[i]) && ind > baseIndent) {
        const sub = parseList(lines, i, inline, key + "s" + items.length);
        nested = sub.el;
        i = sub.next;
        break;
      }
      if (ind > baseIndent) {
        txt += " " + lines[i].trim();
        i++;
        continue;
      }
      break;
    }
    const kids = inline(txt, "li" + key + "-" + items.length);
    items.push(
      h(
        "li",
        { key: items.length, className: "doc-li" },
        nested ? [...kids, nested] : kids,
      ),
    );
  }
  return {
    el: h(
      ordered ? "ol" : "ul",
      { key, className: ordered ? "doc-ol" : "doc-ul" },
      items,
    ),
    next: i,
  };
}

function parseTable(lines, start, inline, key) {
  const rows = [];
  let i = start;
  while (i < lines.length && /^\s*\|/.test(lines[i])) {
    rows.push(lines[i]);
    i++;
  }
  const cells = (r) =>
    r
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  const el = h(
    "div",
    { key, className: "doc-table-wrap" },
    h("table", { className: "doc-table" }, [
      h(
        "thead",
        { key: "h" },
        h(
          "tr",
          {},
          head.map((c, j) => h("th", { key: j }, inline(c, "th" + j))),
        ),
      ),
      h(
        "tbody",
        { key: "b" },
        body.map((r, ri) =>
          h(
            "tr",
            { key: ri },
            r.map((c, j) => h("td", { key: j }, inline(c, "td" + ri + j))),
          ),
        ),
      ),
    ]),
  );
  return { el, next: i };
}

const BLOCK_BREAK = /^(#{1,4}\s|```|>\s?|\s*([-*]|\d+\.)\s+|!\[|\|)/;

function parseMarkdown(text, relPath, branch) {
  const baseDir = dirOf(relPath);
  const img = (src) =>
    /^https:\/\//i.test(src)
      ? src
      : /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(src)
        ? undefined
        : rawUrl(resolvePath(baseDir, src), branch);
  const inline = (s, kp) => parseInline(s, baseDir, img, kp);
  let title = null;
  text = text.replace(/^\uFEFF/, "");
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fm) {
    const t = fm[1].match(/title:\s*(.+)/);
    if (t) title = t[1].trim();
    text = text.slice(fm[0].length);
  }
  const lines = text.split(/\r?\n/);
  const blocks = [];
  const toc = [];
  let i = 0,
    k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        h(
          "pre",
          { key: k++, className: "doc-pre" },
          h("code", {}, buf.join("\n")),
        ),
      );
      continue;
    }
    const hm = line.match(/^(#{1,4})\s+(.*)$/);
    if (hm) {
      const lvl =
        hm[1].length === 1 && blocks.some((block) => block.type === "h1")
          ? 2
          : hm[1].length;
      const txt = hm[2].trim();
      const id = slug(txt);
      if (lvl === 1) {
        if (!title) title = txt;
        blocks.push(
          h("h1", { key: k++, id, className: "doc-h1" }, inline(txt, "h" + i)),
        );
      } else {
        if (lvl === 2 || lvl === 3) toc.push({ id, text: txt, level: lvl });
        blocks.push(
          h(
            "h" + lvl,
            { key: k++, id, className: "doc-h" + lvl },
            inline(txt, "h" + i),
          ),
        );
      }
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(h("hr", { key: k++, className: "doc-hr" }));
      i++;
      continue;
    }
    const im = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)[^)]*\)$/);
    if (im) {
      blocks.push(figure(im[1], img(im[2]), k++));
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        h(
          "blockquote",
          { key: k++, className: "doc-quote" },
          inline(buf.join(" "), "q" + i),
        ),
      );
      continue;
    }
    if (
      /^\s*\|/.test(line) &&
      lines[i + 1] &&
      /-/.test(lines[i + 1]) &&
      /^\s*\|?[\s:|-]+\|/.test(lines[i + 1])
    ) {
      const r = parseTable(lines, i, inline, k++);
      blocks.push(r.el);
      i = r.next;
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const r = parseList(lines, i, inline, k++);
      blocks.push(r.el);
      i = r.next;
      continue;
    }
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !BLOCK_BREAK.test(lines[i]) &&
      !/^(-{3,}|\*{3,})$/.test(lines[i].trim())
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(
      h("p", { key: k++, className: "doc-p" }, inline(buf.join(" "), "p" + i)),
    );
  }
  if (!blocks.some((block) => block.type === "h1"))
    blocks.unshift(
      h("h1", { key: "title", className: "doc-h1" }, title || "Documentation"),
    );
  return { title, blocks, toc };
}

export { parseMarkdown, mdLink };
