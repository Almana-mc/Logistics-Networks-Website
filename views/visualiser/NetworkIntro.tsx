import { useEffect, useRef } from "react";
import type { LoadedNetwork } from "./useNetworkFile";
import Icon from "../../components/Icon";
import { expiryText } from "../../lib/share";

export default function NetworkIntro({ loaded }: { loaded: LoadedNetwork }) {
  const title = useLandingFocus();
  const { entry, network, share } = loaded;
  return (
    <header className="page-intro network-intro">
      {entry && (
        <a className="intro-back" href="library.html">
          <Icon name="arrow" size={16} /> All saved networks
        </a>
      )}
      <h1 ref={title} tabIndex={-1}>
        {entry?.name || network.network}
      </h1>
      <p className="network-meta">
        {entry ? (
          <>
            By {entry.author} · saved in game as <code>{network.network}</code>
          </>
        ) : share ? (
          <>
            Shared link · from <code>{loaded.name}</code> ·{" "}
            {expiryText(share.expiresAt)}
          </>
        ) : (
          <>
            From <code>{loaded.name}</code>, read in your browser and only
            uploaded if you share it.
          </>
        )}
      </p>
    </header>
  );
}

function useLandingFocus() {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (document.activeElement === document.body)
      title.current!.focus({ preventScroll: true });
  }, []);
  return title;
}
