import ReauthDialog from "../../components/ReauthDialog";
import type { Account } from "../../lib/account";
import { useReauth } from "../../lib/useReauth";
import AuditPanel from "./AuditPanel";
import BlocksPanel from "./BlocksPanel";
import NetworksPanel from "./NetworksPanel";
import UsersPanel from "./UsersPanel";

export default function AdminTools({ account }: { account: Account }) {
  const reauth = useReauth();
  return (
    <div className="account-settings">
      <UsersPanel guard={reauth.guard} />
      <NetworksPanel guard={reauth.guard} />
      <BlocksPanel guard={reauth.guard} />
      <AuditPanel />
      <ReauthDialog
        open={reauth.open}
        hasPassword={account.hasPassword}
        onFinish={reauth.finish}
      />
    </div>
  );
}
