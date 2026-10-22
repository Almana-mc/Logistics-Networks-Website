import { lazy, Suspense, useState } from "react";
import { useAccount } from "../../lib/account";
import type { NetworkEntry } from "../../lib/library";
import NetworkCardView from "./NetworkCardView";

const AdminCardActions = lazy(() => import("./AdminCardActions"));

export default function NetworkCard({
  entry: listed,
}: {
  entry: NetworkEntry;
}) {
  const { account } = useAccount();
  const [entry, setEntry] = useState<NetworkEntry | null>(listed);
  if (!entry)
    return (
      <article className="network-card">
        <p role="status" tabIndex={-1} ref={(note) => note?.focus()}>
          Deleted {listed.name}.
        </p>
      </article>
    );
  return (
    <NetworkCardView entry={entry}>
      {account?.admin && entry.id && (
        <Suspense>
          <AdminCardActions
            entry={entry}
            hasPassword={account.hasPassword}
            onChange={setEntry}
          />
        </Suspense>
      )}
    </NetworkCardView>
  );
}
