import type { AdminUser } from "../../lib/admin";
import UserBadges from "./UserBadges";

type Props = {
  users: AdminUser[] | null;
  focusId: number | null;
  onChoose: (id: number) => void;
};

export default function UserList({ users, focusId, onChoose }: Props) {
  if (!users) return <p className="account-note">Loading users…</p>;
  if (!users.length) return <p className="account-note">No users match.</p>;
  return (
    <ul className="admin-list">
      {users.map((user) => (
        <li key={user.id}>
          <button
            type="button"
            className="admin-pick"
            autoFocus={user.id === focusId}
            onClick={() => onChoose(user.id)}
          >
            <strong>{user.username}</strong>
            <span>{user.email}</span>
            <UserBadges user={user} />
          </button>
        </li>
      ))}
    </ul>
  );
}
