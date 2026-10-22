import { fileURLToPath } from "node:url";
import { renderAsync } from "@resvg/resvg-js";
import type { Edge, Parsed } from "./lnet.ts";

type Point = { x: number; y: number; dx: number; dy: number };

const width = 800;
const height = 450;
const radius = 11;
const background = "#101216";
const line = "#3a4150";
const palette: Record<string, string> = {
  ITEM: "#e5b567",
  FLUID: "#81a1c1",
  ENERGY: "#e8836b",
  CHEMICAL: "#88c0a0",
  SOURCE: "#c48b9f",
  mute: "#a3a8b2",
};
const font = fileURLToPath(
  new URL("./fonts/jetbrains-mono-500.ttf", import.meta.url),
);
const f = (value: number) => value.toFixed(1);
const escape = (text: string) =>
  text
    .replace(/\p{Cc}/gu, "")
    .replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

function shove(a: Point, b: Point, force: (distance: number) => number) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.hypot(dx, dy) || 0.01;
  const scale = force(distance) / distance;
  a.dx += dx * scale;
  a.dy += dy * scale;
  b.dx -= dx * scale;
  b.dy -= dy * scale;
}

function move(points: Point[], temp: number) {
  const pad = 46;
  for (const point of points) {
    const length = Math.hypot(point.dx, point.dy) || 0.01;
    const step = Math.min(length, temp) / length;
    point.x += point.dx * step + (width / 2 - point.x) * 0.02;
    point.y += point.dy * step + (height / 2 - point.y) * 0.02;
    point.x = Math.max(pad, Math.min(width - pad, point.x));
    point.y = Math.max(pad, Math.min(height - pad, point.y));
    point.dx = 0;
    point.dy = 0;
  }
}

// Fruchterman–Reingold, as js/graph.js
export function layout(count: number, edges: Edge[]) {
  const points = Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    const jitter = ((index * 7919) % 41) - 20;
    return {
      x: width / 2 + Math.cos(angle) * height * 0.28 + jitter,
      y: height / 2 + Math.sin(angle) * height * 0.28 - jitter,
      dx: 0,
      dy: 0,
    };
  });
  const rounds = Math.min(
    240,
    Math.max(24, Math.round(1_800_000 / count ** 2)),
  );
  const k = Math.sqrt((width * height) / count) * 0.55;
  const cool = (height * 0.2) / (rounds + 1);
  for (let round = 0; round < rounds; round++) {
    for (let a = 0; a < count; a++)
      for (let b = a + 1; b < count; b++)
        shove(points[a], points[b], (d) => (k * k) / d);
    for (const edge of edges)
      shove(points[edge.from], points[edge.to], (d) =>
        edge.weak ? (-d * d * 0.35) / k : (-d * d) / k,
      );
    move(points, Math.max(cool, height * 0.2 - cool * round));
  }
  return points;
}

function arrow(a: Point, b: Point, stroke: string) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const x = b.x - Math.cos(angle) * (radius + 8);
  const y = b.y - Math.sin(angle) * (radius + 8);
  const wing = (turn: number) =>
    `${f(x - Math.cos(angle + turn) * 8)},${f(y - Math.sin(angle + turn) * 8)}`;
  return `<polyline points="${wing(-0.5)} ${f(x)},${f(y)} ${wing(0.5)}" stroke="${stroke}" opacity="0.75"/>`;
}

function drawEdge(a: Point, b: Point, edge: Edge) {
  const stroke = edge.weak ? line : palette[edge.type] || line;
  const path = `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" stroke="${stroke}"`;
  if (edge.weak)
    return `${path} stroke-width="0.8" stroke-dasharray="2 6" opacity="0.65"/>`;
  const glow = `${path} stroke-width="5" opacity="0.12"/>`;
  if (edge.undirected)
    return `${glow}${path} stroke-dasharray="5 4" opacity="0.75"/>`;
  const pulse = `<circle cx="${f((a.x + b.x) / 2)}" cy="${f((a.y + b.y) / 2)}" r="2.6" fill="${stroke}"/>`;
  return `${glow}${path} opacity="0.75"/>${arrow(a, b, stroke)}${pulse}`;
}

const gradients = Object.entries(palette).map(
  ([key, color]) =>
    `<radialGradient id="halo-${key}"><stop offset="0.22" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`,
);

// Scale layout to fill frame
function fit(points: Point[]) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const spanX = Math.max(...xs) - left;
  const spanY = Math.max(...ys) - top;
  const scale = Math.min((width - 140) / spanX, (height - 90) / spanY, 1.5);
  const shiftX = (width - spanX * scale) / 2;
  const shiftY = (height - 10 - spanY * scale) / 2;
  for (const point of points) {
    point.x = shiftX + (point.x - left) * scale;
    point.y = shiftY + (point.y - top) * scale;
  }
  return points;
}

const tone = (node: Parsed["nodes"][number]) => {
  const type = node.visible
    ? node.config.activeChannels[0]?.type || "ITEM"
    : "mute";
  return type in palette ? type : "ITEM";
};

function drawNodes(network: Parsed, points: Point[]) {
  const halos: string[] = [];
  const rings: string[] = [];
  const labels: string[] = [];
  network.nodes.forEach((node, index) => {
    const { x, y } = points[index];
    const key = tone(node);
    const color = palette[key];
    const at = `cx="${f(x)}" cy="${f(y)}"`;
    const chars = Array.from(node.label);
    const label =
      chars.length > 16 ? `${chars.slice(0, 15).join("")}…` : node.label;
    halos.push(
      `<circle ${at} r="${radius + 9}" fill="url(#halo-${key})" opacity="0.5"/>`,
    );
    rings.push(
      `<circle ${at} r="${radius + 10}" fill="none" stroke="${color}" stroke-width="1.4" opacity="0.15"/>`,
      `<circle ${at} r="${radius}" fill="none" stroke="${color}" stroke-width="8" opacity="0.2"/>`,
      `<circle ${at} r="${radius}" fill="${background}" stroke="${color}" stroke-width="2"/>`,
      `<circle ${at} r="${f(radius * 0.38)}" fill="${color}"/>`,
    );
    labels.push(
      `<text x="${f(x)}" y="${f(y + radius + 17)}">${escape(label)}</text>`,
    );
  });
  return `<g>${halos.join("")}</g><g>${rings.join("")}</g><g font-family="JetBrains Mono" font-size="12" fill="${palette.mute}" stroke="${background}" stroke-width="3" stroke-linejoin="round" paint-order="stroke" text-anchor="middle">${labels.join("")}</g>`;
}

export function networkSvg(network: Parsed) {
  const points = fit(layout(network.nodes.length, network.topology));
  const edges = network.topology
    .map((edge) => drawEdge(points[edge.from], points[edge.to], edge))
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${gradients.join("")}</defs><rect width="${width}" height="${height}" fill="${background}"/><g fill="none" stroke-width="1.2">${edges}</g>${drawNodes(network, points)}</svg>`;
}

export const networkPng = async (network: Parsed) =>
  (
    await renderAsync(networkSvg(network), {
      fitTo: { mode: "zoom", value: 2 },
      font: {
        fontFiles: [font],
        loadSystemFonts: false,
        defaultFontFamily: "JetBrains Mono",
      },
    })
  ).asPng();
