import Icon from "../../components/Icon";
import CommunitySetups from "./CommunitySetups";
import type { NetworkEntry } from "../../lib/library";

export default function CommunitySection({
  entries,
}: {
  entries: NetworkEntry[];
}) {
  return (
    <section
      id="community"
      className="home-section"
      aria-labelledby="community-title"
    >
      <div className="shell section-inner community-layout">
        <div className="community-head">
          <h2 id="community-title">Built by players.</h2>
          <p>
            Real setups saved from the game. Open any of them and inspect every
            node, channel and filter.
          </p>
          <a className="inline-link" href="library.html">
            Browse the library <Icon name="arrow" size={18} />
          </a>
        </div>
        <CommunitySetups entries={entries} />
        <div className="visualiser-teaser">
          <p>
            <strong>Have your own export?</strong> Open it in the visualiser. It
            is read in your browser and only uploaded if you share a link.
          </p>
          <a className="button secondary" href="visualiser.html">
            Open the visualiser
          </a>
        </div>
      </div>
    </section>
  );
}
