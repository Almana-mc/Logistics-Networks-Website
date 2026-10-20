type Props = { busy: boolean; error: string; onExample: () => void };
export default function UploadActions({ busy, error, onExample }: Props) {
  return (
    <>
      <p id="file-privacy" className="file-privacy">
        Parsed entirely in your browser, nothing is uploaded.
      </p>
      {busy && <p role="status">Reading network…</p>}
      <p
        id="file-error"
        className="error-text"
        role={error ? "alert" : undefined}
      >
        {error}
      </p>
      <button
        className="button secondary small"
        disabled={busy}
        onClick={onExample}
      >
        Load example network
      </button>
    </>
  );
}
