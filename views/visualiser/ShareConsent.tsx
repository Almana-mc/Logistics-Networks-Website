type Props = {
  name: string;
  busy: boolean;
  error: string;
  onCreate: () => void;
  onCancel: () => void;
};

export default function ShareConsent({
  name,
  busy,
  error,
  onCreate,
  onCancel,
}: Props) {
  return (
    <>
      <h2 id="share-heading">Share this network</h2>
      <p>
        Uploads <code>{name}</code> to the Logistics Network server. Anyone with
        the link can view and download it for 12 hours. Links can't be removed
        early.
      </p>
      <div className="actions">
        <button
          type="button"
          className="button primary small"
          aria-disabled={busy}
          onClick={busy ? undefined : onCreate}
        >
          {busy ? "Creating link…" : "Create link"}
        </button>
        <button
          type="button"
          className="button secondary small"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
      <p className="error-text" role={error ? "alert" : undefined}>
        {error}
      </p>
    </>
  );
}
