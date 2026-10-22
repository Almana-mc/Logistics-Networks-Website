import { useState } from "react";
import FormSubmit from "../../components/FormSubmit";
import { useSubmit } from "../../lib/account";
import { suspendUser, type AdminUser } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";
import UserDelete from "./UserDelete";
import UserSignOut from "./UserSignOut";

type Props = {
  user: AdminUser;
  guard: Reauth["guard"];
  onChanged: (user: AdminUser) => void;
  onDeleted: () => void;
};

const lockedNote = (
  <p className="account-note">
    Admin accounts can't be suspended, signed out or deleted.
  </p>
);

export default function UserActions(props: Props) {
  const { user, guard, onChanged, onDeleted } = props;
  const [notice, setNotice] = useState("");
  const suspended = user.suspendedAt !== null;
  const suspend = useSubmit(() =>
    guard(() => suspendUser(user.id, !suspended)).then((next) => {
      onChanged(next);
      setNotice(
        suspended
          ? "Suspension lifted. The user was emailed."
          : "Suspended. The user was emailed.",
      );
    }),
  );
  if (user.admin) return lockedNote;
  return (
    <div className="admin-actions">
      <form onSubmit={suspend.onSubmit}>
        <FormSubmit
          label={suspended ? "Lift suspension" : "Suspend"}
          form={suspend}
          kind="secondary"
        />
      </form>
      <UserSignOut
        user={user}
        guard={guard}
        onDone={() => setNotice("Signed out everywhere. The user was emailed.")}
      />
      <UserDelete user={user} guard={guard} onDeleted={onDeleted} />
      <p className="account-note" role="status">
        {notice}
      </p>
    </div>
  );
}
