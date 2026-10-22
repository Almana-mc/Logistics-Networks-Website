import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import PageIntro from "../components/PageIntro";
import AdminTools from "./admin/AdminTools";
import { useAccount } from "../lib/account";
import "../styles/index.css";
import "../styles/views/account.css";
import "../styles/views/admin.css";

function AdminPage() {
  const { account, loading } = useAccount();
  useEffect(() => {
    if (loading || account?.admin) return;
    location.replace(account ? "account.html" : "sign-in.html");
  }, [account, loading]);
  return (
    <>
      <SiteHeader current="Admin" />
      <main id="main" className="shell page-main account-main" tabIndex={-1}>
        <PageIntro eyebrow="Admin" title="Admin tools">
          Users, published networks, blocked emails and every admin change.
        </PageIntro>
        {account?.admin && <AdminTools account={account} />}
      </main>
      <SiteFooter />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<AdminPage />);
