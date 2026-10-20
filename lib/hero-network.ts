import type { GraphData } from "./graph";

const types = ["ITEM", "FLUID", "ENERGY", "CHEMICAL", "SOURCE"];
const hubs = [0, 5, 10];

export function buildHeroNetwork(seed: number, size = 16): GraphData {
  let state = seed * 9301 + 49297;
  const random = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
  const nodes = Array.from({ length: size }, () => ({
    label: "",
    dominantType: pick(types),
    role: "node",
    baseR: 4 + random() * 5,
  }));
  const edges: GraphData["edges"] = [];
  nodes.forEach((node, index) => {
    const hub = pick(hubs);
    if (hub !== index)
      edges.push({
        from: index,
        to: hub,
        type: node.dominantType,
        channel: index % 9,
      });
  });
  for (let channel = 0; channel < 9; channel++) {
    const from = Math.floor(random() * size);
    const to = Math.floor(random() * size);
    if (from !== to) edges.push({ from, to, type: pick(types), channel });
  }
  return { nodes, edges };
}
