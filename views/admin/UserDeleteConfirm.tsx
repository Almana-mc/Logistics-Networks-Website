import { describeError, useSubmit } from "../../lib/account";
import { deleteUser, type AdminUser } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";

type Props = {
  user: AdminUser;
  guard: Reauth["guard"];
  onDeleted: () => void;
  onKeep: () => void;
};

export default function UserDeleteConfirm(props: Props) {
  const { user, guard, onDeleted, onKeep } = props;
  const form = useSubmit(() =>
    guard(() => deleteUser(user.id)).then(onDeleted),
  );
  return (
    <form className="network-delete" onSubmit={form.onSubmit}>
      <p className="account-note">
        Delete {user.username} and their {user.networks}{" "}
        {user.networks === 1 ? "network" : "networks"}? This can't be undone.
      </p>
      <div className="actions">
        <button className="button secondary small danger" disabled={form.busy}>
          {form.busy ? "Deleting…" : "Delete account"}
        </button>
        <button
          type="button"
          className="button secondary small"
          autoFocus
          onClick={onKeep}
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
