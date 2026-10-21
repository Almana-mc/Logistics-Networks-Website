import type { Mode } from "./SignInBody";

type Props = { mode: Mode; onMode: (mode: Mode) => void };

export default function SignInSwitch({ mode, onMode }: Props) {
  const choices: [string, Mode][] =
    mode === "sign-in"
      ? [
          ["Forgot password?", "forgot"],
          ["Create an account", "sign-up"],
        ]
      : [["Back to sign in", "sign-in"]];
  return (
    <div className="account-switch">
      {choices.map(([label, target]) => (
        <button
          key={target}
          type="button"
          className="button text-button"
          onClick={() => onMode(target)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
