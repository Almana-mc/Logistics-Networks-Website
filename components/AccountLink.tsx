import { useAccount } from "../lib/account";

export default function AccountLink() {
  const { account } = useAccount();
  return (
    <a href={account ? "account.html" : "sign-in.html"}>
      {account ? account.user.username : "Sign in"}
    </a>
  );
}
