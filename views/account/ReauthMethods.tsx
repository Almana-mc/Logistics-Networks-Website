import { useState } from "react";
import ReauthCode from "./ReauthCode";
import ReauthPassword from "./ReauthPassword";

type Props = { hasPassword: boolean; onDone: () => void };

export default function ReauthMethods({ hasPassword, onDone }: Props) {
  const [byEmail, setByEmail] = useState(!hasPassword);
  return (
    <>
      {byEmail ? (
        <ReauthCode onDone={onDone} />
      ) : (
        <ReauthPassword onDone={onDone} />
      )}
      {hasPassword && (
        <button
          type="button"
          className="button text-button"
          onClick={() => setByEmail(!byEmail)}
        >
          {byEmail ? "Use my password instead" : "Email me a code instead"}
        </button>
      )}
    </>
  );
}
