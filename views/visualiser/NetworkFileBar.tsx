import { useEffect, useState } from "react";
import type { LoadedNetwork } from "./useNetworkFile";
import Icon from "../../components/Icon";

export default function NetworkFileBar({
  loaded,
  onReset,
}: {
  loaded: LoadedNetwork;
  onReset: () => void;
}) {
  const url = useDownloadUrl(loaded.raw);
  return (
    <header className="network-file-bar">
      <div className="network-file-name">
        <span>
          <Icon name="file" size={16} />
          {loaded.name}
        </span>
        <h2>{loaded.network.network}</h2>
      </div>
      <p className="network-stats">
        <span>
          <b>{loaded.network.stats.nodes}</b> nodes
        </span>
        <span>
          <b>{loaded.network.stats.links}</b> links
        </span>
        <span>
          <b>{loaded.network.stats.activeChannels}</b> active channels
        </span>
      </p>
      <div className="actions">
        <a className="button secondary" href={url} download={loaded.name}>
          Download .lnet <Icon name="download" size={16} />
        </a>
        <button className="button text-button" onClick={onReset}>
          New file
        </button>
      </div>
    </header>
  );
}

function useDownloadUrl(raw: string) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(new Blob([raw], { type: "text/plain" }));
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [raw]);
  return url;
}
