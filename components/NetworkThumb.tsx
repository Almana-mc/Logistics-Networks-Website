import { useEffect, useRef } from "react";
import "../js/graph.js";
import { graphData, loadLibraryNetwork } from "../lib/network";
import type { NetworkEntry } from "../lib/library";
import type { Graph } from "../lib/graph";

function drawThumb(canvas: HTMLCanvasElement, entry: NetworkEntry) {
  let graph: Graph | null = null;
  let live = true;
  const resize = new ResizeObserver(() => {
    graph?.resize();
    graph?._frame();
  });
  loadLibraryNetwork(entry)
    .then((network) => {
      if (!live) return;
      graph = new window.NetworkGraph(canvas, {
        style: "glow",
        pulseSpeed: 0,
        breathing: false,
        nodePulse: false,
        decorative: true,
        interactive: false,
      });
      graph.setData(graphData(network, 6));
      graph.start();
      resize.observe(canvas);
    })
    .catch(() => {});
  return () => {
    live = false;
    resize.disconnect();
    graph?.destroy();
  };
}

export default function NetworkThumb({ entry }: { entry: NetworkEntry }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => drawThumb(canvas.current!, entry), [entry]);
  return (
    <div className="network-thumb" aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  );
}
