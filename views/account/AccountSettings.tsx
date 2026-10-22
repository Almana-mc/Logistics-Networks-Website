import type { Account } from "../../lib/account";
import AccountSummary from "./AccountSummary";
import NetworksSection from "./NetworksSection";
import PasswordSection from "./PasswordSection";
import ReauthDialog from "./ReauthDialog";
import { useReauth } from "./useReauth";

export default function AccountSettings({ account }: { account: Account }) {
  const reauth = useReauth();
  return (
    <div className="account-settings">
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
