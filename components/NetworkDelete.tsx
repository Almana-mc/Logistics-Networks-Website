import { describeError, useSubmit } from "../lib/account";
import type { Upload } from "../lib/uploads";

type Props = {
  upload: Upload;
  remove: (id: string) => Promise<unknown>;
  onDeleted: (upload: Upload) => void;
  onCancel: () => void;
};

export default function NetworkDelete({
  upload,
  remove,
  onDeleted,
  onCancel,
}: Props) {
  const form = useSubmit(() => remove(upload.id).then(() => onDeleted(upload)));
  return (
    <form className="network-delete" onSubmit={form.onSubmit}>
      <p className="account-note">
        Delete it for everyone? Its library card and links stop working.
      </p>
      <div className="actions">
        <button className="button secondary small danger" disabled={form.busy}>
          {form.busy ? "Deleting…" : "Delete network"}
        </button>
        <button
          type="button"
          className="button secondary small"
          autoFocus
          onClick={onCancel}
        >
          Keep it
        </button>
      </div>
      <p className="error-text" role="alert">
        {form.error && describeError(form.error)}
      </p>
    </form>
  );
}
