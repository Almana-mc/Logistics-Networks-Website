import { splitVersion } from "../../lib/release";

export default function VersionPill({ version }: { version: string }) {
  if (!version) return null;
  const parts = splitVersion(version);
  return (
    <span className="version-pill">
      {parts ? `Mod ${parts.mod} · MC ${parts.minecraft}` : `v${version}`}
    </span>
  );
}
