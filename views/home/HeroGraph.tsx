import { useEffect, useRef } from "react";
import "../../js/graph.js";
import ResourceLegend from "../../components/ResourceLegend";
import { buildHeroNetwork } from "../../lib/hero-network";

function mountGraph(canvas: HTMLCanvasElement) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const graph = new window.NetworkGraph(canvas, {
    style: "glow",
    pulseSpeed: still ? 0 : 1.6,
    breathing: !still,
    nodePulse: !still,
    decorative: true,
    interactive: false,
  });
  graph.setData(buildHeroNetwork(7));
  graph.start();
  const resize = new ResizeObserver(() => {
    graph.resize();
    graph._frame();
  });
  const onScreen = new IntersectionObserver(([entry]) =>
    entry.isIntersecting ? graph.start() : graph.stop(),
  );
  resize.observe(canvas);
  onScreen.observe(canvas);
  return () => {
    resize.disconnect();
    onScreen.disconnect();
    graph.destroy();
  };
}

export default function HeroGraph() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => mountGraph(canvas.current!), []);
  return (
    <div className="hero-stage">
      <canvas ref={canvas} aria-hidden="true" />
      <span className="stage-corner top left" aria-hidden="true" />
      <span className="stage-corner top right" aria-hidden="true" />
      <span className="stage-corner bottom left" aria-hidden="true" />
      <span className="stage-corner bottom right" aria-hidden="true" />
      <p className="stage-badge" aria-hidden="true">
        Live topology · sim
      </p>
      <ResourceLegend />
    </div>
  );
}
