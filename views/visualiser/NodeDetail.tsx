import type { NetworkNode } from "../../lib/network";
import NodePicker from "./NodePicker";
import NodeChannels from "./NodeChannels";
import NodeItems from "./NodeItems";

type Props = {
  nodes: NetworkNode[];
  selected: number;
  onSelect: (index: number) => void;
};

export default function NodeDetail({ nodes, selected, onSelect }: Props) {
  const node = selected < 0 ? null : nodes[selected];
  return (
    <aside
      className="node-detail"
      aria-label={node ? "Selected node details" : "Node details"}
    >
      <NodePicker nodes={nodes} selected={selected} onSelect={onSelect} />
      {node ? (
        <>
          <header className="node-heading">
            <p className="detail-label">Node</p>
            <h3>{node.label}</h3>
            <p className="node-chips">
              <span className={node.visible ? "chip is-visible" : "chip"}>
                {node.visible ? "visible" : "hidden"}
              </span>
              <span className="chip">
                {node.config.activeChannels.length} / 9 channels
              </span>
            </p>
          </header>
          <NodeChannels channels={node.config.activeChannels} />
          <NodeItems config={node.config} />
        </>
      ) : (
        <p className="detail-empty">
          <span aria-hidden="true" />
          Select a node
          <br />
          Inspect its channels
        </p>
      )}
    </aside>
  );
}
