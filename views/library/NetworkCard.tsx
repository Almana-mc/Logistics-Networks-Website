import { lazy, Suspense } from "react";
import { useAccount } from "../../lib/account";
import type { NetworkEntry } from "../../lib/library";
import NetworkCardView from "./NetworkCardView";

const AdminCardActions = lazy(() => import("./AdminCardActions"));

type Props = {
  entry: NetworkEntry;
  onChange?: (entry: NetworkEntry, next: NetworkEntry | null) => void;
};

export default function NetworkCard({ entry, onChange }: Props) {
  const { account } = useAccount();
  return (
    <NetworkCardView entry={entry}>
      {account?.admin && entry.id && (
        <Suspense>
          <AdminCardActions
            entry={entry}
            hasPassword={account.hasPassword}
            onChange={(next) => onChange?.(entry, next)}
          />
        </Suspense>
      )}
    </NetworkCardView>
  );
}
