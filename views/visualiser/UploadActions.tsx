import Icon from "../../components/Icon";
type Props = { busy: boolean; error: string; onExample: () => void };
export default function UploadActions({ busy, error, onExample }: Props) {
  return (
    <>
      <p id="file-privacy" className="file-privacy">
        Read on your device. Your file is not uploaded.
      </p>
      {busy && <p role="status">Reading network…</p>}
      <p
        id="file-error"
        className="error-text"
        role={error ? "alert" : undefined}
      >
        {error}
      </p>
      <div className="upload-example">
        <span>Just looking around?</span>
        <button
          className="button secondary"
          disabled={busy}
          onClick={onExample}
        >
          Load example network <Icon name="arrow" size={18} />
        </button>
      </div>
    </>
  );
}
