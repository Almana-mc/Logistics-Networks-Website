type Props = {
  versions: string[];
  branch: string;
  onBranch: (branch: string) => void;
};
export default function VersionPicker({ versions, branch, onBranch }: Props) {
  return (
    <div className="docs-version">
      <label className="docs-label" htmlFor="guide-version">
        Minecraft version
      </label>
      <select
        id="guide-version"
        value={branch}
        onChange={(event) => onBranch(event.target.value)}
        disabled={!versions.length}
      >
        {versions.length ? (
          versions.map((version) => <option key={version}>{version}</option>)
        ) : (
          <option>Loading versions…</option>
        )}
      </select>
    </div>
  );
}
