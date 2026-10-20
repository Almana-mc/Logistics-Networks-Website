import { useState } from "react";
import NetworkNotes from "./NetworkNotes";
import type { LoadedNetwork } from "./useNetworkFile";
import NetworkFileBar from "./NetworkFileBar";
import GraphCanvas from "./GraphCanvas";
import NodeDetail from "./NodeDetail";

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
      <div className="workspace-card">
        <NetworkFileBar loaded={loaded} onReset={onReset} />
        <div className="workspace-layout">
          <GraphCanvas
            network={network}
            selected={selected}
            onSelect={setSelected}
          />
          <NodeDetail
            nodes={network.nodes}
            selected={selected}
            onSelect={setSelected}
          />
        </div>
      </div>
      <NetworkNotes warnings={network.warnings} />
    </section>
  );
}
