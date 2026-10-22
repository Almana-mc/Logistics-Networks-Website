import Field from "./Field";
import type { Details } from "../lib/uploads";

type Props = { id: string; value: Details; onChange: (value: Details) => void };

export default function NetworkFields({ id, value, onChange }: Props) {
  return (
    <>
      <Field
        id={`${id}-name`}
        label="Name"
        maxLength={80}
        autoComplete="off"
        autoFocus
        value={value.name}
        onValue={(name) => onChange({ ...value, name })}
      />
      <div className="field">
        <label htmlFor={`${id}-description`}>Description</label>
        <textarea
          id={`${id}-description`}
          required
          rows={3}
          maxLength={300}
          aria-describedby={`${id}-description-hint`}
          value={value.description}
          onChange={(event) =>
            onChange({ ...value, description: event.target.value })
          }
        />
        <p id={`${id}-description-hint`} className="field-hint">
          What it moves and how it is built.
          <span className="field-count">{value.description.length}/300</span>
        </p>
      </div>
    </>
  );
}
