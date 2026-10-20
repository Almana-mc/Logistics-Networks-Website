import ChannelSettings from "./ChannelSettings";
import ChannelSummary from "./ChannelSummary";
import type { Channel } from "../../lib/network";
import { resourceStyle } from "../../lib/resources";

export default function NodeChannels({ channels }: { channels: Channel[] }) {
  return (
    <section className="node-channels">
      <h3 className="detail-label">Channels</h3>
      {!channels.length && <p>No active channels.</p>}
      {channels.map((channel) => (
        <details
          className="node-channel"
          key={channel.index}
          style={resourceStyle(channel.type)}
        >
          <ChannelSummary channel={channel} />
          <ChannelSettings channel={channel} />
        </details>
      ))}
    </section>
  );
}
