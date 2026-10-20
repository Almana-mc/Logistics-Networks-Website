import Icon from "../../components/Icon";

type Props = { open: boolean; title: string; onToggle: () => void };
export default function DocsBar({ open, title, onToggle }: Props) {
  return (
    <div className={open ? "docs-bar is-open" : "docs-bar"}>
      <button
        type="button"
        className="docs-menu"
        aria-expanded={open}
        aria-controls="docs-sidebar"
        onClick={onToggle}
      >
        <Icon name={open ? "close" : "menu"} size={18} />
        Contents
      </button>
      <span>{title}</span>
    </div>
  );
}
