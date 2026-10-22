import { useRef, useState } from "react";
import NetworkRow from "../../components/NetworkRow";
import { deleteNetwork, editNetwork, type AdminNetwork } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";

type Props = {
  networks: AdminNetwork[];
  filter?: string;
  guard: Reauth["guard"];
  onChange: (networks: AdminNetwork[]) => void;
};

const matches = (filter: string) => (network: AdminNetwork) =>
  `${network.name} ${network.author}`
    .toLowerCase()
    .includes(filter.trim().toLowerCase());

const byline = (network: AdminNetwork) => (
  <p className="network-row-date">
    By {network.author}{" "}
    {network.hidden && <span className="admin-badge warn">hidden</span>}
  </p>
);

export default function AdminNetworkList(props: Props) {
  const { networks, filter = "", guard, onChange } = props;
  const [notice, setNotice] = useState("");
  const note = useRef<HTMLParagraphElement>(null);
  const shown = networks.filter(matches(filter));
  return (
    <>
      {!shown.length && <p>No networks.</p>}
      <ul className="network-rows">
        {shown.map((network) => (
          <NetworkRow
            key={network.id}
            upload={network}
            save={(id, details) => guard(() => editNetwork(id, details))}
            remove={(id) => guard(() => deleteNetwork(id))}
            onSaved={(next) =>
              onChange(
                networks.map((old) =>
                  old.id === next.id ? { ...old, ...next } : old,
                ),
              )
            }
            onDeleted={(gone) => {
              onChange(networks.filter((old) => old.id !== gone.id));
              setNotice(`Deleted ${gone.name}.`);
              note.current!.focus();
            }}
          >
            {byline(network)}
          </NetworkRow>
        ))}
      </ul>
      <p ref={note} className="account-note" role="status" tabIndex={-1}>
        {notice}
      </p>
    </>
  );
}
