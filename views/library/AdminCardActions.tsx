import { useState } from "react";
import NetworkDelete from "../../components/NetworkDelete";
import NetworkEditForm from "../../components/NetworkEditForm";
import ReauthDialog from "../../components/ReauthDialog";
import RowActions from "../../components/RowActions";
import { deleteNetwork, editNetwork } from "../../lib/admin";
import type { NetworkEntry } from "../../lib/library";
import { uploadEntry } from "../../lib/uploads";
import { useReauth } from "../../lib/useReauth";
import { useReturnFocus, type Action } from "../../lib/useReturnFocus";

type Props = {
  entry: NetworkEntry;
  hasPassword: boolean;
  onChange: (entry: NetworkEntry | null) => void;
};

function toUpload(entry: NetworkEntry) {
  return {
    id: entry.id!,
    name: entry.name,
    description: entry.desc,
    author: entry.author,
    types: entry.types,
    createdAt: Date.parse(entry.added),
  };
}

export default function AdminCardActions(props: Props) {
  const { entry, hasPassword, onChange } = props;
  const [mode, setMode] = useState<Action | "view">("view");
  const buttons = useReturnFocus(mode);
  const reauth = useReauth();
  const view = () => setMode("view");
  const upload = toUpload(entry);
  return (
    <div className="network-card-admin">
      {mode === "view" && (
        <RowActions buttons={buttons} name={entry.name} onPick={setMode} />
      )}
      {mode === "edit" && (
        <NetworkEditForm
          upload={upload}
          save={(id, details) => reauth.guard(() => editNetwork(id, details))}
          onSaved={(next) => {
            onChange(uploadEntry(next));
            view();
          }}
          onCancel={view}
        />
      )}
      {mode === "delete" && (
        <NetworkDelete
          upload={upload}
          remove={(id) => reauth.guard(() => deleteNetwork(id))}
          onDeleted={() => onChange(null)}
          onCancel={view}
        />
      )}
      <ReauthDialog
        open={reauth.open}
        hasPassword={hasPassword}
        onFinish={reauth.finish}
      />
    </div>
  );
}
