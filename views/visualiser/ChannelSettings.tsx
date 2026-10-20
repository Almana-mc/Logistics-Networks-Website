import type { Channel } from "../../lib/network";
export default function ChannelSettings({ channel }: { channel: Channel }) {
  return (
    <div className="channel-settings">
      {channel.name && <p className="channel-resource">{channel.name}</p>}
      <dl>
        {[
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
