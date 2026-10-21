import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  onValue: (value: string) => void;
};

export default function Field({ id, label, hint, onValue, ...input }: Props) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        required
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onValue(event.target.value)}
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}
