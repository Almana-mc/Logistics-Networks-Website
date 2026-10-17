import ChannelSettings from "./ChannelSettings";
import type { Channel } from "../../lib/network";
import { resourceStyle } from "../../lib/resources";

export default function NodeChannels({ channels }: { channels: Channel[] }) {
  return (
    <section className="node-channels">
      <h3>Active channels</h3>
      {!channels.length && <p>No active channels.</p>}
      {channels.map((channel) => (
        <details
          className="node-channel"
          key={channel.index}
          style={resourceStyle(channel.type)}
        >
          <summary>
            <span className="resource-dot" />
            <strong>Channel {channel.index + 1}</strong>
            <span>{channel.mode}</span>
          </summary>
          <ChannelSettings channel={channel} />
        </details>
      ))}
    </section>
  );
}
