import { useState } from "react";
import { describeError, useSubmit } from "../../lib/account";
import { deleteUser, type AdminUser } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";

type Props = {
  user: AdminUser;
  guard: Reauth["guard"];
  onDeleted: () => void;
};

export default function UserDelete({ user, guard, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false);
  const form = useSubmit(() =>
    guard(() => deleteUser(user.id)).then(onDeleted),
  );
  if (!confirming)
    return (
      <button
        type="button"
        className="button secondary danger"
        onClick={() => setConfirming(true)}
      >
        Delete account…
      </button>
    );
  return (
    <form className="network-delete" onSubmit={form.onSubmit}>
      <p className="account-note">
        Delete {user.username} and their {user.networks} networks? This can't be
        undone.
      </p>
      <div className="actions">
        <button className="button secondary small danger" disabled={form.busy}>
          {form.busy ? "Deleting…" : "Delete account"}
        </button>
        <button
          type="button"
          className="button secondary small"
          autoFocus
          onClick={() => setConfirming(false)}
        >
          Keep it
        </button>
      </div>
      <p className="error-text" role="alert">
        {form.error && describeError(form.error)}
      </p>
    </form>
  );
}
