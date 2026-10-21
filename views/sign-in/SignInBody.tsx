import { useState } from "react";
import { accountChanged } from "../../lib/account";
import CheckEmail from "./CheckEmail";
import ConfirmSignup from "./ConfirmSignup";
import ForgotForm from "./ForgotForm";
import ResetForm from "./ResetForm";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

export type Mode =
  "sign-in" | "sign-up" | "forgot" | "sent" | "confirm" | "reset";
type Props = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  link: { signup: string; reset: string };
};

export default function SignInBody({ mode, setMode, link }: Props) {
  const [notice, setNotice] = useState("");
  const sent = () => setMode("sent");
  const saved = () => {
    setNotice("Password saved. Sign in with your new password.");
    accountChanged();
    setMode("sign-in");
  };
  switch (mode) {
    case "sign-up":
      return <SignUpForm onSent={sent} />;
    case "forgot":
      return <ForgotForm onSent={sent} />;
    case "sent":
      return <CheckEmail />;
    case "confirm":
      return <ConfirmSignup token={link.signup} />;
    case "reset":
      return <ResetForm token={link.reset} onDone={saved} />;
    default:
      return <SignInForm notice={notice} />;
  }
}
