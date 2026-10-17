import ResourceLegend from "../../components/ResourceLegend";
export default function ChannelOverview() {
  return (
    <div className="channel-overview">
      <div className="channel-heading">
        <h3>One node, nine channels</h3>
        <span>Configured independently</span>
      </div>
      <ol className="channel-slots" aria-label="Nine configurable channels">
        {Array.from({ length: 9 }, (_, index) => (
          <li key={index}>
            <span className="sr-only">Channel </span>
            {index + 1}
          </li>
        ))}
      </ol>
      <p>
        Choose the resource, transfer direction, batch size and delay for each
        channel. Fine-tune the setup as your base grows.
      </p>
      <ResourceLegend />
      <a className="inline-link" href="docs.html#nodes/channel-settings">
        Explore channel settings <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
