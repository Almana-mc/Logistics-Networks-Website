import { useState } from "react";
import AccountPanel from "../../components/AccountPanel";
import Field from "../../components/Field";
import FormSubmit from "../../components/FormSubmit";
import { accountChanged, api, newPassword, useSubmit } from "../../lib/account";
import type { Reauth } from "../../lib/useReauth";

type Props = { hasPassword: boolean; guard: Reauth["guard"] };

export default function PasswordSection({ hasPassword, guard }: Props) {
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const form = useSubmit(() => {
    setSaved(false);
    return guard(() => api("me/password", "PUT", { password }))
      .then(() => {
        setPassword("");
        setSaved(true);
        accountChanged();
      })
      .finally(() => document.getElementById("account-password")!.focus());
  });
  return (
    <AccountPanel title="Password">
      <form className="account-form" onSubmit={form.onSubmit}>
        <Field
          id="account-password"
          label="New password"
          {...newPassword}
          value={password}
          onValue={setPassword}
        />
        <FormSubmit
          label={hasPassword ? "Change password" : "Set password"}
          form={form}
        />
        <p className="account-note" role="status">
          {saved && "Password saved. Your other devices were signed out."}
        </p>
      </form>
    </AccountPanel>
  );
}
