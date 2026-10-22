import { useEffect, useState } from "react";
import { fetchUser, type AdminUser, type UserDetails } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";
import UserDetailBody from "./UserDetailBody";

type Props = {
  id: number;
  guard: Reauth["guard"];
  onBack: () => void;
  onDeleted: (user: AdminUser) => void;
};

export default function UserDetail({ id, guard, onBack, onDeleted }: Props) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetchUser(id).then(setUser, () => setFailed(true));
  }, [id]);
  return (
    <>
      <button
        type="button"
        className="button secondary small"
        autoFocus
        onClick={onBack}
      >
        Back to users
      </button>
      {failed && (
        <p className="error-text" role="alert">
          Couldn't load this user. They may have been deleted.
        </p>
      )}
      {!user && !failed && <p className="account-note">Loading user…</p>}
      {user && (
        <UserDetailBody
          user={user}
          guard={guard}
          onDeleted={onDeleted}
          onUser={setUser}
        />
      )}
    </>
  );
}
