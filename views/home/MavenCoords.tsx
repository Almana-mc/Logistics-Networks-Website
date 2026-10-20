import { useEffect, useState } from "react";

const coordinates = "me.almana:logisticsnetworks";

export default function MavenCoords() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = () =>
    navigator.clipboard.writeText(coordinates).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  return (
    <>
      <span className="maven-coords">
        <code>{coordinates}</code>
        <button type="button" onClick={copy}>
          {copied ? "Copied" : "Copy"}
          <span className="sr-only"> Maven coordinates</span>
        </button>
      </span>
      <span className="sr-only" role="status">
        {copied ? "Maven coordinates copied" : ""}
      </span>
    </>
  );
}
