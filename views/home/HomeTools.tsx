import Icon from "../../components/Icon";

const tools = [
  {
    title: "Inspect your network",
    description:
      "Open a .lnet export, trace its connections and check each node’s configuration.",
    href: "visualiser.html",
    action: "Open visualiser",
    tag: "Files stay on your device",
  },
  {
    title: "Find a starting point",
    description: "Browse real community setups for bees, miners and more.",
    href: "library.html",
    action: "Browse the library",
    tag: "Community networks",
  },
  {
    title: "Get the details right",
    description:
      "Read the versioned guide to nodes, channels, filters and upgrades.",
    href: "docs.html",
    action: "Read the docs",
    tag: "From the in-game guide",
  },
];

export default function HomeTools() {
  return (
    <section className="tools-section">
      <div className="shell">
        <div className="section-heading">
          <h2>
            From first node
            <br />
            to full network.
          </h2>
          <p>A few useful places to keep your next build moving.</p>
        </div>
        <div className="tool-list">
          {tools.map((tool) => (
            <a className="tool-row" href={tool.href} key={tool.href}>
              <div>
                <span className="tool-tag">{tool.tag}</span>
                <h3>{tool.title}</h3>
              </div>
              <p>{tool.description}</p>
              <span className="tool-action">
                {tool.action}
                <Icon name="arrow" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
