import partner from "../../assets/kinetic-host.webp";
import Icon from "../../components/Icon";
export default function HostingPartner() {
  return (
    <a
      className="partner"
      href="https://billing.kinetichosting.com/aff.php?aff=1285"
      target="_blank"
      rel="noreferrer sponsored"
    >
      <img
        src={partner}
        width="52"
        height="52"
        alt="Kinetic Host"
        loading="lazy"
      />
      <div>
        <span>Our hosting partner</span>
        <p>
          Bring your friends. Kinetic Host provides servers for your modded
          Minecraft world.
        </p>
      </div>
      <Icon name="external" />
    </a>
  );
}
