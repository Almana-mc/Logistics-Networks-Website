import { useState } from "react";
import FormActions from "../../components/FormActions";
import NetworkFields from "../../components/NetworkFields";
import { useSubmit } from "../../lib/account";
import { editUpload, type Upload } from "../../lib/uploads";

type Props = {
  upload: Upload;
  onSaved: (upload: Upload) => void;
  onCancel: () => void;
};

export default function NetworkEditForm({ upload, onSaved, onCancel }: Props) {
  const [details, setDetails] = useState({
    name: upload.name,
    description: upload.description,
  });
  const form = useSubmit(() => editUpload(upload.id, details).then(onSaved));
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
