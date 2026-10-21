import { useAccount } from "../lib/account";

export default function AccountLink({ current }: { current: string }) {
  const { account } = useAccount();
  return (
    <a
      href={account ? "account.html" : "sign-in.html"}
      aria-current={current === "Account" ? "page" : undefined}
    >
      {account ? account.user.username : "Sign in"}
    </a>
  );
}
