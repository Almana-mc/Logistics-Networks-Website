import { formatDate } from "../../lib/account";
import type { AdminUser, UserDetails } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";
import AdminNetworkList from "./AdminNetworkList";
import UserActions from "./UserActions";
import UserBadges from "./UserBadges";
import UserEditForm from "./UserEditForm";

type Props = {
  user: UserDetails;
  guard: Reauth["guard"];
  onDeleted: (user: AdminUser) => void;
  onUser: (user: UserDetails) => void;
};

export default function UserDetailBody(props: Props) {
  const { user, guard, onDeleted, onUser } = props;
  const changed = (next: AdminUser) => onUser({ ...user, ...next });
  return (
    <>
      <h3>{user.username}</h3>
      <UserBadges user={user} />
      <p className="admin-email">
        {user.email} · joined {formatDate(user.createdAt)}
      </p>
      <UserEditForm user={user} guard={guard} onSaved={changed} />
      <UserActions
        user={user}
        guard={guard}
        onChanged={changed}
        onDeleted={() => onDeleted(user)}
      />
      <h4>Networks</h4>
      <AdminNetworkList
        networks={user.networkList}
        guard={guard}
        onChange={(networkList) =>
          onUser({ ...user, networkList, networks: networkList.length })
        }
      />
    </>
  );
}
