import VersionPicker from "./VersionPicker";
import { buildNav } from "../../lib/docs-source";
import ChapterLinks from "./ChapterLinks";

type Props = {
  versions: string[];
  branch: string;
  onBranch: (branch: string) => void;
  nav: ReturnType<typeof buildNav> | null;
  route: string;
  open: boolean;
};

export default function DocsNavigation({
  versions,
  branch,
  onBranch,
  nav,
  route,
  open,
}: Props) {
  return (
    <aside
      id="docs-sidebar"
      className={`docs-sidebar${open ? " is-open" : ""}`}
      aria-label="Documentation sections"
    >
      <VersionPicker versions={versions} branch={branch} onBranch={onBranch} />
      <ChapterLinks nav={nav} route={route} />
    </aside>
  );
}
