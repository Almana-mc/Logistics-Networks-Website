import { filterEntries, useLibrary } from "../../lib/library";

type Props = {
  busy: boolean;
  error: string;
  onLibrary: (file: string) => void;
};
export default function UploadActions({ busy, error, onLibrary }: Props) {
  const { entries } = useLibrary();
  const recent = filterEntries(entries, "", [], "new").slice(0, 3);
  return (
    <>
      <p id="file-privacy" className="file-privacy">
        Parsed entirely in your browser. Nothing is uploaded unless you create a
        share link.
      </p>
      {busy && <p role="status">Reading network…</p>}
      <p
        id="file-error"
        className="error-text"
        role={error ? "alert" : undefined}
      >
        {error}
      </p>
      <div className="upload-alternatives">
        <p>No export yet? Open one from the library:</p>
        {recent.map((entry) => (
          <button
            key={entry.file}
            className="button secondary small"
            disabled={busy}
            onClick={() => onLibrary(entry.file)}
          >
            {entry.name}
          </button>
        ))}
        <a className="button secondary small" href="library.html">
          Browse the library
        </a>
      </div>
    </>
  );
}
