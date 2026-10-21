import { useState } from "react";
import AccountPanel from "../../components/AccountPanel";
import Field from "../../components/Field";
import FormSubmit from "../../components/FormSubmit";
import { api, newPassword, useSubmit } from "../../lib/account";

export default function SignUpForm({ onSent }: { onSent: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const form = useSubmit(() =>
    api("signup", "POST", { username, email, password }).then(onSent),
  );
  return (
    <AccountPanel title="Create your account">
      <form className="account-form" onSubmit={form.onSubmit}>
        <Field
          id="sign-up-username"
          label="Username"
          autoComplete="username"
          hint="Shown on networks you share. 3 to 24 letters, numbers, _ or -."
          pattern="[A-Za-z0-9_\-]{3,24}"
          value={username}
          onValue={setUsername}
        />
        <Field
          id="sign-up-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onValue={setEmail}
        />
        <Field
          id="sign-up-password"
          label="Password"
          {...newPassword}
          value={password}
          onValue={setPassword}
        />
        <FormSubmit label="Create account" form={form} />
      </form>
    </AccountPanel>
  );
}
