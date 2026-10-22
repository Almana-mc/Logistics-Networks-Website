import { useState } from "react";
import Field from "../../components/Field";
import FormActions from "../../components/FormActions";
import { accountChanged, api, useSubmit } from "../../lib/account";

export default function PublishSignIn({ onCancel }: { onCancel: () => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const form = useSubmit(() =>
    api("login", "POST", { login, password }).then(accountChanged),
  );
  return (
    <>
      <h2 id="publish-heading">Sign in to publish</h2>
      <p>
        Published networks carry your username. This file stays open while you
        sign in. No account yet?{" "}
        <a href="sign-in.html" target="_blank" rel="noopener">
          Create one in a new tab
        </a>
        .
      </p>
      <form className="publish-form" onSubmit={form.onSubmit}>
        <Field
          id="publish-login"
          label="Username or email"
          autoComplete="username"
          autoFocus
          value={login}
          onValue={setLogin}
        />
        <Field
          id="publish-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onValue={setPassword}
        />
        <FormActions label="Sign in" form={form} onCancel={onCancel} />
      </form>
    </>
  );
}
