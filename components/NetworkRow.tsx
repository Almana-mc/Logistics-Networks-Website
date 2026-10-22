import { useState, type ReactNode } from "react";
import type { Details, Upload } from "../lib/uploads";
import { useReturnFocus, type Action } from "../lib/useReturnFocus";
import NetworkDelete from "./NetworkDelete";
import NetworkEditForm from "./NetworkEditForm";
import NetworkSummary from "./NetworkSummary";
import RowActions from "./RowActions";

type Props = {
  upload: Upload;
  save: (id: string, details: Details) => Promise<Upload>;
  remove: (id: string) => Promise<unknown>;
  onSaved: (upload: Upload) => void;
  onDeleted: (upload: Upload) => void;
  children?: ReactNode;
};

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
      {mode === "view" && (
        <RowActions buttons={buttons} name={upload.name} onPick={setMode} />
      )}
    </li>
  );
}
