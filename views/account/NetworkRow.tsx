import { useEffect, useRef, useState } from "react";
import type { Upload } from "../../lib/uploads";
import NetworkDelete from "./NetworkDelete";
import NetworkEditForm from "./NetworkEditForm";
import NetworkSummary from "./NetworkSummary";

type Action = "edit" | "delete";
type Props = {
  upload: Upload;
  onSaved: (upload: Upload) => void;
  onDeleted: (upload: Upload) => void;
};

export default function NetworkRow({ upload, onSaved, onDeleted }: Props) {
  const [mode, setMode] = useState<Action | "view">("view");
  const buttons = useReturnFocus(mode);
  const view = () => setMode("view");
  const saved = (next: Upload) => {
    onSaved(next);
    view();
  };
  const button = (action: Action, label: string) => (
    <button
      ref={buttons[action]}
      type="button"
      className="button secondary small"
      onClick={() => setMode(action)}
    >
      {label} <span className="sr-only">{upload.name}</span>
    </button>
  );
  return (
    <li className="network-row">
      {mode === "edit" ? (
        <NetworkEditForm upload={upload} onSaved={saved} onCancel={view} />
      ) : (
        <NetworkSummary upload={upload} />
      )}
      {mode === "delete" && (
        <NetworkDelete upload={upload} onDeleted={onDeleted} onCancel={view} />
      )}
      {mode === "view" && (
        <div className="actions">
          {button("edit", "Edit")}
          {button("delete", "Delete")}
        </div>
      )}
    </li>
  );
}

function useReturnFocus(mode: Action | "view") {
  const buttons = {
    edit: useRef<HTMLButtonElement>(null),
    delete: useRef<HTMLButtonElement>(null),
  };
  const last = useRef(mode);
  useEffect(() => {
    if (mode === "view" && last.current !== "view")
      buttons[last.current].current!.focus();
    last.current = mode;
  }, [mode]);
  return buttons;
}
