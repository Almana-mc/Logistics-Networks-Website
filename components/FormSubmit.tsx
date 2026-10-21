import { describeError } from "../lib/account";

type Props = {
  label: string;
  form: { busy: boolean; error: string };
  kind?: "primary" | "secondary";
};

export default function FormSubmit({ label, form, kind = "primary" }: Props) {
  return (
    <>
      <button className={`button ${kind}`} disabled={form.busy}>
        {label}
      </button>
      <p className="error-text" role="alert">
        {form.error && describeError(form.error)}
      </p>
    </>
  );
}
