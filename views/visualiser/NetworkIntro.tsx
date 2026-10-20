import { useEffect, useRef } from "react";
import type { LoadedNetwork } from "./useNetworkFile";
import Icon from "../../components/Icon";

export default function NetworkIntro({ loaded }: { loaded: LoadedNetwork }) {
  const title = useLandingFocus();
  const { entry, network } = loaded;
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
        ) : (
          <>
            From <code>{loaded.name}</code>, read in your browser and never
            uploaded.
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
