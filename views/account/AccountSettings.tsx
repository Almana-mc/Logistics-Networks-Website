import type { Account } from "../../lib/account";
import AccountPanel from "../../components/AccountPanel";
import AccountSummary from "./AccountSummary";
import NetworksSection from "./NetworksSection";
import PasswordSection from "./PasswordSection";
import ReauthDialog from "../../components/ReauthDialog";
import { useReauth } from "../../lib/useReauth";

export default function AccountSettings({ account }: { account: Account }) {
  const reauth = useReauth();
  return (
    <div className="account-settings">
      {account.admin && (
        <AccountPanel title="Admin">
          <p>
            <a href="admin.html">Open admin tools</a>
          </p>
        </AccountPanel>
      )}
      <NetworksSection />
      <PasswordSection hasPassword={account.hasPassword} guard={reauth.guard} />
      <AccountSummary account={account} />
      <ReauthDialog
        open={reauth.open}
        hasPassword={account.hasPassword}
        onFinish={reauth.finish}
      />
    </div>
  );
}
