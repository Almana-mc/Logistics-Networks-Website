import { useState } from "react";
import Field from "./Field";
import FormSubmit from "./FormSubmit";
import { api, useSubmit } from "../lib/account";

type Props = { token: string; onDone: () => void; onResend: () => void };

export default function ReauthCodeEntry({ token, onDone, onResend }: Props) {
  const [code, setCode] = useState("");
  const verify = useSubmit(() =>
    api("reauth/code", "POST", { token, code }).then(onDone),
  );
  return (
    <form className="account-form" onSubmit={verify.onSubmit}>
      <p role="status">We emailed a code to your account address.</p>
      <Field
        id="reauth-code"
        label="Code from your email"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        autoFocus
        value={code}
        onValue={setCode}
      />
      <FormSubmit label="Confirm" form={verify} />
      <button type="button" className="button text-button" onClick={onResend}>
        Email me a new code
      </button>
    </form>
  );
}
