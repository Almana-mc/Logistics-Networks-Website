import { describeError } from "../lib/account";

type Props = {
  label: string;
  form: { busy: boolean; error: string };
  onCancel: () => void;
};

export default function FormActions({ label, form, onCancel }: Props) {
  return (
    <>
      <div className="actions">
        <button className="button primary small" disabled={form.busy}>
          {label}
        </button>
        <button
          type="button"
          className="button secondary small"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
      <p className="error-text" role="alert">
        {form.error && describeError(form.error)}
      </p>
    </>
  );
}
