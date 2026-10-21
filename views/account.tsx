import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import PageIntro from "../components/PageIntro";
import AccountSettings from "./account/AccountSettings";
import { useAccount } from "../lib/account";
import "../styles/index.css";
import "../styles/views/account.css";

function AccountPage() {
  const { account, loading } = useAccount();
  useEffect(() => {
    if (!loading && !account) location.replace("sign-in.html");
  }, [account, loading]);
  return (
    <>
      <SiteHeader current="Account" />
      <main id="main" className="shell page-main account-main" tabIndex={-1}>
        <PageIntro
          eyebrow="Account"
          title={account ? account.user.username : "Your account"}
        >
          {account
            ? `Signed in as ${account.user.email}.`
            : "Loading your account…"}
        </PageIntro>
        {account && <AccountSettings account={account} />}
      </main>
      <SiteFooter />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<AccountPage />);
