import type { NetworkNode } from "../../lib/network";
type Props = {
  nodes: NetworkNode[];
  selected: number;
  onSelect: (index: number) => void;
};
export default function NodePicker({ nodes, selected, onSelect }: Props) {
  return (
    <div className="node-picker">
      <label htmlFor="node-select">Inspect a node</label>
      <select
        id="node-select"
        value={selected}
        onChange={(event) => onSelect(Number(event.target.value))}
      >
        <option value={-1}>Select a node…</option>
        {nodes.map((node, index) => (
          <option key={index} value={index}>
            {node.label}
            {node.visible ? "" : " (hidden)"}
          </option>
        ))}
      </select>
      <p role="status">
        {selected >= 0
          ? `Selected ${nodes[selected].label}`
          : "Choose a node here or select one on the graph."}
      </p>
    </div>
  );
}
