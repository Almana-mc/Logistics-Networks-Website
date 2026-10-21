type Props = { busy: boolean; error: string; onExample: () => void };
export default function UploadActions({ busy, error, onExample }: Props) {
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
        <p>No export yet?</p>
        <button
          className="button secondary small"
          disabled={busy}
          onClick={onExample}
        >
          Load example network
        </button>
        <a className="button secondary small" href="library.html">
          Browse the library
        </a>
      </div>
    </>
  );
}
