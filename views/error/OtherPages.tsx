import Icon from "../../components/Icon";

const pages = [
  ["Library", "/library.html", "Community setups to browse and open."],
  ["Visualiser", "/visualiser.html", "Inspect a .lnet export on your device."],
  ["Docs", "/docs.html", "The in-game guide, for each mod version."],
  [
    "Downloads",
    "/index.html#download",
    "CurseForge, GitHub Releases and Maven.",
  ],
];

export default function OtherPages() {
  return (
    <section className="error-pages" aria-labelledby="error-pages-title">
      <h2 id="error-pages-title">Other pages</h2>
      <ul>
        {pages.map(([name, href, text]) => (
          <li key={name}>
            <a href={href}>
              <span>
                <strong>{name}</strong>
                {text}
              </span>
              <Icon name="arrow" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
