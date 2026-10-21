import AccountPanel from "../../components/AccountPanel";
import FormSubmit from "../../components/FormSubmit";
import {
  accountChanged,
  api,
  formatDate,
  useSubmit,
  type Account,
} from "../../lib/account";

export default function AccountSummary({ account }: { account: Account }) {
  const form = useSubmit(() => api("logout", "POST").then(accountChanged));
  return (
    <AccountPanel title="This device">
      <p>Member since {formatDate(account.user.createdAt)}.</p>
      <form className="account-form" onSubmit={form.onSubmit}>
        <FormSubmit label="Sign out" form={form} kind="secondary" />
      </form>
    </AccountPanel>
  );
}
