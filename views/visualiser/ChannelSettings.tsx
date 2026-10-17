import type { Channel } from "../../lib/network";
export default function ChannelSettings({ channel }: { channel: Channel }) {
  return (
    <div className="channel-settings">
      <p className="channel-resource">
        {channel.type}
        {channel.name ? ` · ${channel.name}` : ""}
      </p>
      <dl>
        {[
          ["Batch", channel.batch.toLocaleString()],
          ["Delay", `${channel.delay} ticks`],
          ["Side", channel.io],
          ["Priority", channel.priority],
          ["Redstone", channel.redstone],
          ["Distribution", channel.distribution],
          ["Filter mode", channel.filter_mode],
        ].map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
