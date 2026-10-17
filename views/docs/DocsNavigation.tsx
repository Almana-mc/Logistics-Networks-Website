import VersionPicker from "./VersionPicker";
import { useEffect, useState } from "react";
import { buildNav } from "../../lib/docs-source";
import ChapterLinks from "./ChapterLinks";

type Props = {
  versions: string[];
  branch: string;
  onBranch: (branch: string) => void;
  nav: ReturnType<typeof buildNav> | null;
  route: string;
};

export default function DocsNavigation({
  versions,
  branch,
  onBranch,
  nav,
  route,
}: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [route, branch]);
  return (
    <aside className="docs-sidebar">
      <VersionPicker versions={versions} branch={branch} onBranch={onBranch} />
      <button
        className="button secondary docs-browse"
        aria-expanded={open}
        aria-controls="guide-chapters"
        onClick={() => setOpen(!open)}
      >
        Browse documentation <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div
        className={`docs-chapters${open ? " is-open" : ""}`}
        id="guide-chapters"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            document.querySelector<HTMLButtonElement>(".docs-browse")?.focus();
          }
        }}
      >
        <ChapterLinks nav={nav} route={route} />
      </div>
    </aside>
  );
}
