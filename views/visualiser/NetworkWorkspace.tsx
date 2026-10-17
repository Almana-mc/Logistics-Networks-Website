import NodePicker from "./NodePicker";
import NetworkNotes from "./NetworkNotes";
import { useState } from "react";
import type { LoadedNetwork } from "./useNetworkFile";
import NetworkFileBar from "./NetworkFileBar";
import GraphCanvas from "./GraphCanvas";
import NodeDetail from "./NodeDetail";
import ResourceLegend from "../../components/ResourceLegend";

export default function NetworkWorkspace({
  loaded,
  onReset,
}: {
  loaded: LoadedNetwork;
  onReset: () => void;
}) {
  const [selected, setSelected] = useState(-1);
  const { network } = loaded;
  return (
    <section className="network-workspace" aria-label="Network inspection">
      <NetworkFileBar loaded={loaded} onReset={onReset} />
      <NodePicker
        nodes={network.nodes}
        selected={selected}
        onSelect={setSelected}
      />
      <div className="workspace-layout">
        <div className="graph-region">
          <GraphCanvas
            network={network}
            selected={selected}
            onSelect={setSelected}
          />
          <div className="graph-legend">
            <ResourceLegend />
            <p>
              Solid arrows: inferred direction. Dashed: shared channel. Dotted:
              layout only.
            </p>
          </div>
        </div>
        <NodeDetail node={selected < 0 ? null : network.nodes[selected]} />
      </div>
      <NetworkNotes warnings={network.warnings} />
    </section>
  );
}
