import logo from "../../assets/logistic-icon-72.png";
import Icon from "../../components/Icon";

const pages = [
  ["Home", "index.html"],
  ["Download", "index.html#download"],
  ["Library", "library.html"],
  ["Visualiser", "visualiser.html"],
  ["Docs", "docs.html"],
];

type Props = { menuOpen: boolean; onMenu: () => void };
export default function DocsHeader({ menuOpen, onMenu }: Props) {
  return (
    <header className="docs-header">
      <nav className="docs-header__nav" aria-label="Primary">
        <a
          className="docs-brand"
          href="index.html"
          aria-label="Logistics Network home"
        >
          <img src={logo} alt="" width="36" height="36" />
          <span className="docs-wordmark">
            Logistics <strong>Network</strong>
          </span>
        </a>
        <div className="docs-header__links">
          {pages.map(([label, href]) => (
            <a
              key={label}
              href={href}
              aria-current={label === "Docs" ? "page" : undefined}
            >
              {label}
            </a>
          ))}
          <button
            type="button"
            className="docs-menu"
            aria-expanded={menuOpen}
            aria-controls="docs-sidebar"
            onClick={onMenu}
          >
            <Icon name="menu" size={18} />
            Contents
          </button>
        </div>
      </nav>
    </header>
  );
}
