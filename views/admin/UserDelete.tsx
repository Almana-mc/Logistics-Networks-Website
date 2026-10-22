import { useState } from "react";
import type { AdminUser } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";
import UserDeleteConfirm from "./UserDeleteConfirm";

type Props = {
  user: AdminUser;
  guard: Reauth["guard"];
  onDeleted: () => void;
};

export default function UserDelete(props: Props) {
  const [confirming, setConfirming] = useState(false);
  const [reopened, setReopened] = useState(false);
  if (confirming)
    return (
      <UserDeleteConfirm
        {...props}
        onKeep={() => {
          setConfirming(false);
          setReopened(true);
        }}
      />
    );
  return (
    <button
      type="button"
      className="button secondary danger"
      autoFocus={reopened}
      onClick={() => setConfirming(true)}
    >
      Delete account…
    </button>
  );
}
