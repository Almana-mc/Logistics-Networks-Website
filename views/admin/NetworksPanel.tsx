import { useEffect, useState } from "react";
import AccountPanel from "../../components/AccountPanel";
import Field from "../../components/Field";
import { fetchNetworks, type AdminNetwork } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";
import AdminNetworkList from "./AdminNetworkList";

export default function NetworksPanel({ guard }: { guard: Reauth["guard"] }) {
  const [networks, setNetworks] = useState<AdminNetwork[] | null>(null);
  const [filter, setFilter] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetchNetworks().then(setNetworks, () => setFailed(true));
  }, []);
  return (
    <AccountPanel title="Networks">
      <Field
        id="admin-network-filter"
        label="Filter by name or author"
        type="search"
        required={false}
        value={filter}
        onValue={setFilter}
      />
      {failed && (
        <p className="error-text" role="alert">
          Couldn't load networks. Reload to try again.
        </p>
      )}
      {!failed && !networks && (
        <p className="account-note">Loading networks…</p>
      )}
      {networks && (
        <AdminNetworkList
          networks={networks}
          filter={filter}
          guard={guard}
          onChange={setNetworks}
        />
      )}
    </AccountPanel>
  );
}
