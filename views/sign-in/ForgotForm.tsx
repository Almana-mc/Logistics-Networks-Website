import { useState } from "react";
import AccountPanel from "../../components/AccountPanel";
import Field from "../../components/Field";
import FormSubmit from "../../components/FormSubmit";
import { api, useSubmit } from "../../lib/account";

export default function ForgotForm({ onSent }: { onSent: () => void }) {
  const [email, setEmail] = useState("");
  const form = useSubmit(() => api("reset", "POST", { email }).then(onSent));
  return (
    <AccountPanel title="Get a reset link">
      <p>
        Enter your account email. If it has an account, a link to choose a new
        password arrives within a minute.
      </p>
      <form className="account-form" onSubmit={form.onSubmit}>
        <Field
          id="forgot-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onValue={setEmail}
        />
        <FormSubmit label="Email me a link" form={form} />
      </form>
    </AccountPanel>
  );
}
