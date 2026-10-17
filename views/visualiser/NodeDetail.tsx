import type { NetworkNode } from "../../lib/network";
import NodeChannels from "./NodeChannels";
import NodeItems from "./NodeItems";

export default function NodeDetail({ node }: { node: NetworkNode | null }) {
  if (!node)
    return (
      <aside className="node-detail empty-detail">
        <h2>Every node has a story.</h2>
        <p>Select a node to inspect its channels, filters and upgrades.</p>
      </aside>
    );
  return (
    <aside className="node-detail" aria-label="Selected node details">
      <header className="node-detail-heading">
        <span>Selected node</span>
        <h2>{node.label}</h2>
        <p>
          {node.visible ? "Visible in game" : "Hidden in game"} ·{" "}
          {node.config.activeChannels.length} of 9 channels active
        </p>
      </header>
      <NodeChannels channels={node.config.activeChannels} />
      <NodeItems config={node.config} />
    </aside>
  );
}
