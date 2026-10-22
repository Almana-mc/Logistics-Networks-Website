import { useState, type ReactNode } from "react";
import type { Details, Upload } from "../lib/uploads";
import { useReturnFocus } from "../lib/useReturnFocus";
import NetworkDelete from "./NetworkDelete";
import NetworkEditForm from "./NetworkEditForm";
import NetworkSummary from "./NetworkSummary";

type Action = "edit" | "delete";
type Props = {
  upload: Upload;
  save: (id: string, details: Details) => Promise<Upload>;
  remove: (id: string) => Promise<unknown>;
  onSaved: (upload: Upload) => void;
  onDeleted: (upload: Upload) => void;
  children?: ReactNode;
};

function rowActions(
  buttons: ReturnType<typeof useReturnFocus>,
  name: string,
  setMode: (mode: Action) => void,
) {
  const button = (action: Action, label: string) => (
    <button
      ref={buttons[action]}
      type="button"
      className="button secondary small"
      onClick={() => setMode(action)}
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

export default function NetworkRow(props: Props) {
  const { upload, save, remove, onSaved, onDeleted, children } = props;
  const [mode, setMode] = useState<Action | "view">("view");
  const buttons = useReturnFocus(mode);
  const view = () => setMode("view");
  const saved = (next: Upload) => {
    onSaved(next);
    view();
  };
  return (
    <li className="network-row">
      {mode === "edit" ? (
        <NetworkEditForm
          upload={upload}
          save={save}
          onSaved={saved}
          onCancel={view}
        />
      ) : (
        <>
          <NetworkSummary upload={upload} />
          {children}
        </>
      )}
      {mode === "delete" && (
        <NetworkDelete
          upload={upload}
          remove={remove}
          onDeleted={onDeleted}
          onCancel={view}
        />
      )}
      {mode === "view" && rowActions(buttons, upload.name, setMode)}
    </li>
  );
}
