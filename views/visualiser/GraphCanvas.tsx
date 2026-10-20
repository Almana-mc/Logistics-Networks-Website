import { useGraph } from "./useGraph";
import GraphKeys from "./GraphKeys";
import type { Network } from "../../lib/network";

export default function GraphCanvas({
  network,
  selected,
  onSelect,
}: {
  network: Network;
  selected: number;
  onSelect: (index: number) => void;
}) {
  const { canvas, zoom, reset } = useGraph(network, selected, onSelect);
  return (
    <div className="graph-region">
      <div className="graph-canvas">
        <canvas
          ref={canvas}
          role="img"
          aria-label={`${network.network} inferred topology. Use the node selector to inspect every node.`}
        />
      </div>
      <p className="graph-hint">
        <span className="hint-fine">Ctrl/⌘ + scroll to zoom · drag to pan</span>
        <span className="hint-touch">Drag sideways to pan · +/− to zoom</span>
        {selected < 0 && <strong>Select a node to inspect it</strong>}
      </p>
      <div className="graph-controls">
        <button aria-label="Zoom out" onClick={() => zoom(0.8)}>
          −
        </button>
        <button aria-label="Zoom in" onClick={() => zoom(1.25)}>
          +
        </button>
        <button onClick={reset}>Reset view</button>
      </div>
      <GraphKeys network={network} />
    </div>
  );
}
