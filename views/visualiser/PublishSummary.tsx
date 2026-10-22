import Icon from "../../components/Icon";
import ResourceLegend from "../../components/ResourceLegend";
import type { LoadedNetwork } from "./useNetworkFile";

type Props = { loaded: LoadedNetwork; types: string[] };

export default function PublishSummary({ loaded, types }: Props) {
  const { stats } = loaded.network;
  return (
    <>
      <p className="publish-file">
        <Icon name="file" size={16} />
        <code>{loaded.name}</code>
        <span>
          {stats.nodes} nodes · {stats.links} links
        </span>
      </p>
      <ResourceLegend types={types} />
    </>
  );
}
