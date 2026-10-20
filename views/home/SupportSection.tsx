import Icon from "../../components/Icon";
import BrandIcon, { type Brand } from "./BrandIcon";
import { links } from "../../lib/resources";

const options: [Brand, string, string, string][] = [
  ["kofi", "Ko-fi", "One-off tip", links.kofi],
  ["patreon", "Patreon", "Monthly membership", links.patreon],
  ["paypal", "PayPal", "Send directly", links.paypal],
];

export default function SupportSection() {
  return (
    <section
      id="support"
      className="home-section"
      aria-labelledby="support-title"
    >
      <div className="shell section-inner support-layout">
        <div className="support-copy">
          <p className="eyebrow">Support</p>
          <h2 id="support-title">Keep the network running.</h2>
          <p>
            Logistics Network is free. If it has earned a place in your pack,
            you can help keep updates coming.
          </p>
        </div>
        <div className="support-links">
          {options.map(([icon, name, kind, href]) => (
            <a key={name} href={href} target="_blank" rel="noreferrer">
              <BrandIcon name={icon} />
              <span className="support-name">
                <strong>{name}</strong>
                <span>{kind}</span>
              </span>
              <span className="support-handle">
                {href.replace("https://", "")}
              </span>
              <Icon name="external" size={18} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
