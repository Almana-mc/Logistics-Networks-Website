import { useState } from "react";
import FormSubmit from "../../components/FormSubmit";
import { api, useSubmit } from "../../lib/account";
import ReauthCodeEntry from "./ReauthCodeEntry";

export default function ReauthCode({ onDone }: { onDone: () => void }) {
  const [token, setToken] = useState("");
  const request = useSubmit(() =>
    api<{ token: string }>("reauth/email", "POST").then((sent) =>
      setToken(sent.token),
    ),
  );
  if (token)
    return (
      <ReauthCodeEntry
        token={token}
        onDone={onDone}
        onResend={() => setToken("")}
      />
    );
  return (
    <form className="account-form" onSubmit={request.onSubmit}>
      <p>We will email a 6-digit code to your account address.</p>
      <FormSubmit label="Email me a code" form={request} />
    </form>
  );
}
