import ResourceLegend from "../../components/ResourceLegend";
import EdgeKey from "./EdgeKey";
import type { Network } from "../../lib/network";

export default function GraphKeys({ network }: { network: Network }) {
  const types = network.nodes.flatMap((node) =>
    node.config.activeChannels.map((channel) => channel.type),
  );
  return (
    <div className="graph-keys">
      <ResourceLegend types={types} />
      <EdgeKey />
    </div>
  );
}
