import type { AdminUser } from "../../lib/admin";

export default function UserBadges({ user }: { user: AdminUser }) {
  return (
    <span className="admin-badges">
      {user.admin && <span className="admin-badge">admin</span>}
      {user.suspendedAt !== null && (
        <span className="admin-badge warn">suspended</span>
      )}
      {user.locked && user.suspendedAt === null && (
        <span className="admin-badge warn">blocked</span>
      )}
      <span className="admin-badge">{user.networks} networks</span>
    </span>
  );
}
