import ChannelOverview from "./ChannelOverview";

export default function HomeNetwork() {
  return (
    <section className="shell network-section" aria-labelledby="network-title">
      <div className="network-copy">
        <h2 id="network-title">
          More room
          <br />
          for your build.
        </h2>
        <p>
          Attach a node to the blocks you want to move resources between. Set
          its channels, choose an input or output, and connect the machines that
          matter.
        </p>
        <a className="inline-link" href="docs.html#nodes">
          Learn how nodes work <span aria-hidden="true">↗</span>
        </a>
      </div>
      <ChannelOverview />
    </section>
  );
}
