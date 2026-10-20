import { useEffect, useRef } from "react";
import "../../js/graph.js";
import type { Network } from "../../lib/network";
import type { Graph } from "../../lib/graph";

function createGraph(
  canvas: HTMLCanvasElement,
  network: Network,
  onSelect: (index: number) => void,
) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const next = new window.NetworkGraph(canvas, {
    style: "glow",
    pulseSpeed: still ? 0 : 1,
    breathing: !still,
    nodePulse: !still,
    interactive: true,
  });
  next.setData({
    nodes: network.nodes.map((node) => ({
      label: node.label,
      dominantType: node.visible
        ? node.config.activeChannels[0]?.type || "ITEM"
        : null,
      role: node.visible ? "node" : "hidden",
      baseR: 11,
    })),
    edges: network.topology,
  });
  next.on("nodeclick", ({ index }) => onSelect(index));
  next.start();
  return next;
}
export function useGraph(
  network: Network,
  selected: number,
  onSelect: (index: number) => void,
) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const graph = useRef<Graph | null>(null);
  useEffect(() => {
    const next = createGraph(canvas.current!, network, onSelect);
    graph.current = next;
    const resize = new ResizeObserver(() => {
      next.resize();
      next._frame();
    });
    resize.observe(canvas.current!);
    return () => {
      resize.disconnect();
      next.destroy();
    };
  }, [network, onSelect]);
  useEffect(() => {
    graph.current?.select(selected);
    graph.current?._frame();
  }, [selected]);
  return {
    canvas,
    zoom: (factor: number) => zoomGraph(graph.current!, factor),
    reset: () => {
      graph.current!.view = { x: 0, y: 0, k: 1 };
      graph.current!._frame();
    },
  };
}
function zoomGraph(value: Graph, factor: number) {
  const next = Math.max(0.45, Math.min(2.6, value.view.k * factor));
  const scale = next / value.view.k;
  value.view = {
    k: next,
    x: value.cw / 2 - (value.cw / 2 - value.view.x) * scale,
    y: value.ch / 2 - (value.ch / 2 - value.view.y) * scale,
  };
  value._frame();
}
