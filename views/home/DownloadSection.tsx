import { useDownloadCount } from "../../lib/downloads";
import { useCountUp } from "./useCountUp";
import DownloadCards from "./DownloadCards";

const statusText = {
  loading: "Fetching from CurseForge",
  live: "Live from CurseForge",
  cached: "Last fetched count",
  fallback: "Approximate count",
};
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function DownloadSection({ version }: { version: string }) {
  const count = useDownloadCount();
  const shown = useCountUp(count.value);
  return (
    <section
      id="download"
      className="home-section"
      aria-labelledby="download-title"
    >
      <div className="shell section-inner">
        <div className="download-head">
          <div className="download-total">
            <h2 id="download-title" className="eyebrow">
              Downloads
            </h2>
            <p className="download-number">
              {count.status === "fallback"
                ? `≈${compact.format(count.value)}`
                : shown
                  ? shown.toLocaleString("en-US")
                  : "—"}
            </p>
          </div>
          <p className="download-caption">
            <span>downloads on CurseForge</span>
            <span className="download-status" data-status={count.status}>
              {statusText[count.status]}
            </span>
          </p>
        </div>
        <DownloadCards version={version} />
      </div>
    </section>
  );
}
