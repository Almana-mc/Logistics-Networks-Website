import { useEffect, useRef } from "react";
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
  const heading = useRevealOnSelect(selected);
  return (
    <aside
      className="node-detail"
      aria-label={node ? "Selected node details" : "Node details"}
    >
      <NodePicker nodes={nodes} selected={selected} onSelect={onSelect} />
      {node ? (
        <>
          <header className="node-heading" ref={heading}>
            <p className="detail-label">Node</p>
            <h2>{node.label}</h2>
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

function useRevealOnSelect(selected: number) {
  const heading = useRef<HTMLElement>(null);
  useEffect(() => {
    const box = heading.current?.getBoundingClientRect();
    if (!box || box.top < innerHeight - 120) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading.current!.scrollIntoView({ behavior: still ? "auto" : "smooth" });
  }, [selected]);
  return heading;
}
