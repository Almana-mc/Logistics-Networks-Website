import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import PageIntro from "../components/PageIntro";
import SignInBody, { type Mode } from "./sign-in/SignInBody";
import SignInSwitch from "./sign-in/SignInSwitch";
import { useAccount } from "../lib/account";
import "../styles/index.css";
import "../styles/views/account.css";

const params = new URLSearchParams(location.hash.slice(1));
if (location.hash) history.replaceState(null, "", location.pathname);
const link = {
  signup: params.get("signup") || "",
  reset: params.get("reset") || "",
};
const start: Mode = link.signup ? "confirm" : link.reset ? "reset" : "sign-in";
const titles: Record<Mode, string> = {
  "sign-in": "Sign in",
  "sign-up": "Create an account",
  forgot: "Forgot your password?",
  sent: "Check your inbox",
  confirm: "Confirm your email",
  reset: "Choose a new password",
};

function SignInPage() {
  const [mode, setMode] = useState<Mode>(start);
  const { account } = useAccount();
  const first = useRef(true);
  useEffect(() => {
    if (start === "sign-in" && account && mode === "sign-in")
      location.replace("account.html");
  }, [account, mode]);
  useEffect(() => {
    document.title = `${titles[mode]} | Logistics Network`;
    if (first.current) first.current = false;
    else document.getElementById("main")!.focus();
  }, [mode]);
  return (
    <>
      <SiteHeader current="Account" />
      <main id="main" className="shell page-main account-main" tabIndex={-1}>
        <PageIntro eyebrow="Account" title={titles[mode]}>
          Save and share networks under your own name.
        </PageIntro>
        <SignInBody mode={mode} setMode={setMode} link={link} />
        <SignInSwitch mode={mode} onMode={setMode} />
      </main>
      <SiteFooter />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<SignInPage />);
