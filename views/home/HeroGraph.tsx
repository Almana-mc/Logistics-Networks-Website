import { useEffect, useRef, useState } from "react";
import "../../js/graph.js";
import ResourceLegend from "../../components/ResourceLegend";
import { buildHeroNetwork } from "../../lib/hero-network";
import { graphData, loadLibraryNetwork } from "../../lib/network";
import type { NetworkEntry } from "../../lib/library";
import type { GraphData } from "../../lib/graph";
import { afterFirstPaint } from "../../lib/first-paint";

type Stage = { data: GraphData; entry?: NetworkEntry };

function mountGraph(canvas: HTMLCanvasElement, { data, entry }: Stage) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const graph = new window.NetworkGraph(canvas, {
    style: "glow",
    pulseSpeed: still ? 0 : 1.6,
    breathing: !still,
    nodePulse: !still,
    decorative: !entry,
    interactive: false,
  });
  graph.setData(data);
  graph.start();
  const resize = new ResizeObserver(() => {
    graph.resize();
    graph._frame();
  });
  const onScreen = new IntersectionObserver(([view]) =>
    view.isIntersecting ? graph.start() : graph.stop(),
  );
  resize.observe(canvas);
  onScreen.observe(canvas);
  return () => {
    resize.disconnect();
    onScreen.disconnect();
    graph.destroy();
  };
}

function useStage(entry: NetworkEntry | undefined, ready: boolean) {
  const [stage, setStage] = useState<Stage | null>(null);
  useEffect(() => {
    if (!ready) return;
    const fallback = () => setStage({ data: buildHeroNetwork(7) });
    if (!entry) return fallback();
    loadLibraryNetwork(entry)
      .then((network) => setStage({ data: graphData(network), entry }))
      .catch(fallback);
  }, [entry, ready]);
  return stage;
}

type Props = { entry?: NetworkEntry; ready: boolean };
export default function HeroGraph({ entry, ready }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useStage(entry, ready);
  useEffect(() => {
    if (!stage) return;
    let unmount = () => {};
    let live = true;
    afterFirstPaint().then(() => {
      if (live) unmount = mountGraph(canvas.current!, stage);
    });
    return () => {
      live = false;
      unmount();
    };
  }, [stage]);
  const shown = stage?.entry;
  return (
    <figure className="hero-stage">
      <div className="hero-canvas">
        <canvas ref={canvas} aria-hidden="true" />
      </div>
      <span className="stage-corner top left" aria-hidden="true" />
      <span className="stage-corner top right" aria-hidden="true" />
      <span className="stage-corner bottom left" aria-hidden="true" />
      <span className="stage-corner bottom right" aria-hidden="true" />
      {shown && (
        <figcaption className="stage-credit">
          <a href={`visualiser.html?net=${encodeURIComponent(shown.file)}`}>
            {shown.name}
          </a>
          <span>by {shown.author}</span>
        </figcaption>
      )}
      <ResourceLegend types={shown?.types} />
    </figure>
  );
}
