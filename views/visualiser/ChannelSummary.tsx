import type { Channel } from "../../lib/network";

const title = (type: string) => type.charAt(0) + type.slice(1).toLowerCase();

export default function ChannelSummary({ channel }: { channel: Channel }) {
  return (
    <summary>
      <span className="channel-head">
        <strong>CH{channel.index + 1}</strong>
        <span className={`mode-chip is-${channel.mode.toLowerCase()}`}>
          {channel.mode}
        </span>
        <span className="channel-type">
          <span className="resource-dot" />
          {title(channel.type)}
        </span>
      </span>
      <span className="channel-meta">
        <span>
          <i>batch</i>
          {channel.batch.toLocaleString("en-US")}
        </span>
        <span>
          <i>delay</i>
          {channel.delay}t
        </span>
        <span>
          <i>side</i>
          {channel.io}
        </span>
      </span>
    </summary>
  );
}
