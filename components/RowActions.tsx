import type { Action, useReturnFocus } from "../lib/useReturnFocus";

type Props = {
  buttons: ReturnType<typeof useReturnFocus>;
  name: string;
  onPick: (action: Action) => void;
};

export default function RowActions({ buttons, name, onPick }: Props) {
  const button = (action: Action, label: string) => (
    <button
      ref={buttons[action]}
      type="button"
      className="button secondary small"
      onClick={() => onPick(action)}
    >
      {label} <span className="sr-only">{name}</span>
    </button>
  );
  return (
    <div className="actions">
      {button("edit", "Edit")}
      {button("delete", "Delete")}
    </div>
  );
}
