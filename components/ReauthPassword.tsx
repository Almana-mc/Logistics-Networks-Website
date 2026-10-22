import { useState } from "react";
import Field from "./Field";
import FormSubmit from "./FormSubmit";
import { api, useSubmit } from "../lib/account";

export default function ReauthPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const form = useSubmit(() =>
    api("reauth/password", "POST", { password }).then(onDone),
  );
  return (
    <form className="account-form" onSubmit={form.onSubmit}>
      <Field
        id="reauth-password"
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={password}
        onValue={setPassword}
      />
      <FormSubmit label="Confirm" form={form} />
    </form>
  );
}
