import { useState } from "react";
import AccountPanel from "../../components/AccountPanel";
import Field from "../../components/Field";
import FormSubmit from "../../components/FormSubmit";
import { api, useSubmit } from "../../lib/account";

export default function SignInForm({ notice }: { notice: string }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const form = useSubmit(() =>
    api("login", "POST", { login, password }).then(() =>
      location.assign("account.html"),
    ),
  );
  return (
    <AccountPanel title="Sign in with your password">
      {notice && (
        <p className="account-note" role="status">
          {notice}
        </p>
      )}
      <form className="account-form" onSubmit={form.onSubmit}>
        <Field
          id="sign-in-login"
          label="Username or email"
          autoComplete="username"
          value={login}
          onValue={setLogin}
        />
        <Field
          id="sign-in-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onValue={setPassword}
        />
        <FormSubmit label="Sign in" form={form} />
      </form>
    </AccountPanel>
  );
}
