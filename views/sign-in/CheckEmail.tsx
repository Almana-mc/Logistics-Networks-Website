import AccountPanel from "../../components/AccountPanel";

export default function CheckEmail() {
  return (
    <AccountPanel title="Email sent">
      <p className="account-note" role="status">
        Check your inbox for an email from Logistics Network. The link inside
        works once and expires in 30 minutes.
      </p>
      <p>Nothing after a few minutes? Check spam, then try again.</p>
    </AccountPanel>
  );
}
