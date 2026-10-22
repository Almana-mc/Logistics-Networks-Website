import logo from "../assets/logistic-icon-80.png";
import Icon from "./Icon";
import AccountLink from "./AccountLink";
import { links } from "../lib/resources";

const pages = [
  ["Library", "library.html"],
  ["Visualiser", "visualiser.html"],
  ["Docs", "docs.html"],
];

export default function SiteHeader({ current }: { current: string }) {
  return (
    <header className="site-header">
      <nav className="site-header__nav" aria-label="Primary">
        <a
          className="brand"
          href="index.html"
          aria-label="Logistics Network home"
          aria-current={current === "Home" ? "page" : undefined}
        >
          <img src={logo} alt="" width="40" height="40" />
          <span className="wordmark">
            Logistics <strong>Network</strong>
          </span>
        </a>
        <div className="site-header__links">
          {pages.map(([label, href]) => (
            <a
              key={label}
              href={href}
              aria-current={label === current ? "page" : undefined}
            >
              {label}
            </a>
          ))}
          {["Library", "Visualiser"].includes(current) && <AccountLink />}
          <a
            className="header-github"
            href={links.github}
            target="_blank"
            rel="noreferrer"
          >
            GitHub <Icon name="external" size={14} />
          </a>
        </div>
      </nav>
    </header>
  );
}
