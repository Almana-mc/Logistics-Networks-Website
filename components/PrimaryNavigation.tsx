import Icon from "./Icon";
const pages = [
  ["Home", "index.html"],
  ["Library", "library.html"],
  ["Docs", "docs.html"],
  ["Visualiser", "visualiser.html"],
];

type Props = { current: string; open: boolean; onClose: () => void };
export default function PrimaryNavigation({ current, open, onClose }: Props) {
  return (
    <nav
      id="site-nav"
      className={`site-nav${open ? " is-open" : ""}`}
      aria-label="Primary"
    >
      {pages.map(([label, href]) => (
        <a
          key={href}
          href={href}
          aria-current={current === label ? "page" : undefined}
          onClick={onClose}
        >
          {label}
        </a>
      ))}
      <a
        className="button primary nav-download"
        href="index.html#download"
        onClick={onClose}
      >
        Get the mod <Icon name="download" size={17} />
      </a>
    </nav>
  );
}
