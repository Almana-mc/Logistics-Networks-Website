import Icon from "../../components/Icon";
export default function HeroCopy() {
  return (
    <div className="hero-copy">
      <p className="hero-label">
        <span />
        Wireless logistics for Minecraft
      </p>
      <h1>
        Your base,
        <br />
        connected.
      </h1>
      <p className="hero-lead">
        Move resources between your machines, with nine configurable channels on
        every node. All without a trail of pipes.
      </p>
      <div className="actions">
        <a className="button primary" href="#download">
          Get Logistics Network <Icon name="download" />
        </a>
        <a className="button text-button" href="visualiser.html">
          Open visualiser <Icon name="arrow" />
        </a>
      </div>
      <p className="hero-platform">
        Minecraft Java Edition <span>·</span> NeoForge
      </p>
    </div>
  );
}
