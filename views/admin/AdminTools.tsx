import ReauthDialog from "../../components/ReauthDialog";
import type { Account } from "../../lib/account";
import { useReauth } from "../../lib/useReauth";
import UsersPanel from "./UsersPanel";

export default function AdminTools({ account }: { account: Account }) {
  const reauth = useReauth();
  return (
    <div className="account-settings">
      <UsersPanel guard={reauth.guard} />
      <ReauthDialog
        open={reauth.open}
        hasPassword={account.hasPassword}
        onFinish={reauth.finish}
      />
    </div>
  );
}
