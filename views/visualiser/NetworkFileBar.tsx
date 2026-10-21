import { useEffect, useState } from "react";
import type { LoadedNetwork } from "./useNetworkFile";
import Icon from "../../components/Icon";
import ShareAction from "./ShareAction";

export default function NetworkFileBar({
  loaded,
  onReset,
}: {
  loaded: LoadedNetwork;
  onReset: () => void;
}) {
  const url = useDownloadUrl(loaded.raw);
  const { stats } = loaded.network;
  return (
    <header className="network-file-bar">
      <div className="network-file-name">
        <Icon name="file" size={16} />
        <span>{loaded.name}</span>
      </div>
      <p className="network-stats">
        <span>
          <b>{stats.nodes}</b> nodes
        </span>
        <span>
          <b>{stats.links}</b> links
        </span>
        <span>
          <b>{stats.activeChannels}</b> active channels
        </span>
      </p>
      <div className="actions">
        <a className="button secondary small" href={url} download={loaded.name}>
          <Icon name="download" size={15} /> Download .lnet
        </a>
        <ShareAction loaded={loaded} />
        <button className="button secondary small" onClick={onReset}>
          <Icon name="reset" size={15} /> New file
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
