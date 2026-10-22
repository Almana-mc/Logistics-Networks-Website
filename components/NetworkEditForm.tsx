import { useState } from "react";
import FormActions from "./FormActions";
import NetworkFields from "./NetworkFields";
import { useSubmit } from "../lib/account";
import type { Details, Upload } from "../lib/uploads";

type Props = {
  upload: Upload;
  save: (id: string, details: Details) => Promise<Upload>;
  onSaved: (upload: Upload) => void;
  onCancel: () => void;
};

export default function NetworkEditForm({
  upload,
  save,
  onSaved,
  onCancel,
}: Props) {
  const [details, setDetails] = useState({
    name: upload.name,
    description: upload.description,
  });
  const form = useSubmit(() => save(upload.id, details).then(onSaved));
  return (
    <form
      className="account-form"
      aria-label={`Edit ${upload.name}`}
      onSubmit={form.onSubmit}
    >
      <NetworkFields
        id={`edit-${upload.id}`}
        value={details}
        onChange={setDetails}
      />
      <FormActions
        label={form.busy ? "Saving…" : "Save changes"}
        form={form}
        onCancel={onCancel}
      />
    </form>
  );
}
