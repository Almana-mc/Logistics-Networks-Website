import { useState } from "react";
import AccountPanel from "../../components/AccountPanel";
import Field from "../../components/Field";
import FormSubmit from "../../components/FormSubmit";
import { api, useSubmit } from "../../lib/account";

export default function ConfirmSignup({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const form = useSubmit(() =>
    api("signup/verify", "POST", { token, password }).then(() =>
      location.assign("account.html"),
    ),
  );
  return (
    <AccountPanel title="One more step">
      <form className="account-form" onSubmit={form.onSubmit}>
        <Field
          id="confirm-password"
          label="Your password"
          hint="Enter the password you chose when you signed up. This proves the account is yours."
          type="password"
          autoComplete="current-password"
          value={password}
          onValue={setPassword}
        />
        <FormSubmit label="Continue" form={form} />
      </form>
    </AccountPanel>
  );
}
