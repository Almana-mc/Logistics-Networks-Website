import logo from "../../assets/logistic-icon-no-bg.png";
import HeroCopy from "./HeroCopy";
import ResourceLegend from "../../components/ResourceLegend";

export default function HomeHero() {
  return (
    <section className="home-hero">
      <div className="shell hero-layout">
        <HeroCopy />
        <div className="hero-art">
          <img
            src={logo}
            alt="Logistics Network, a charcoal block frame with stone-colored pixel lettering"
            width="400"
            height="400"
            fetchPriority="high"
          />
        </div>
      </div>
      <div className="hero-resources shell">
        <span>One network. Five resources.</span>
        <ResourceLegend />
      </div>
    </section>
  );
}
