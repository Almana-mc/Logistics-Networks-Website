import { useState } from "react";
import AccountPanel from "../../components/AccountPanel";
import Field from "../../components/Field";
import FormSubmit from "../../components/FormSubmit";
import { api, newPassword, useSubmit } from "../../lib/account";

type Props = { token: string; onDone: () => void };

export default function ResetForm({ token, onDone }: Props) {
  const [password, setPassword] = useState("");
  const form = useSubmit(() =>
    api("reset/complete", "POST", { token, password }).then(onDone),
  );
  return (
    <AccountPanel title="New password">
      <p>Saving signs out every device, including this one.</p>
      <form className="account-form" onSubmit={form.onSubmit}>
        <Field
          id="reset-password"
          label="New password"
          {...newPassword}
          value={password}
          onValue={setPassword}
        />
        <FormSubmit label="Save password" form={form} />
      </form>
    </AccountPanel>
  );
}
