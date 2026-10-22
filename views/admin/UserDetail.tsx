import { useEffect, useState } from "react";
import { fetchUser, type UserDetails } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";
import UserDetailBody from "./UserDetailBody";

type Props = { id: number; guard: Reauth["guard"]; onBack: () => void };

export default function UserDetail({ id, guard, onBack }: Props) {
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
        <p className="account-note" role="status">
          Couldn't load this user. They may have been deleted.
        </p>
      )}
      {user && (
        <UserDetailBody
          user={user}
          guard={guard}
          onBack={onBack}
          onUser={setUser}
        />
      )}
    </>
  );
}
