import Field from "../../components/Field";
import FormSubmit from "../../components/FormSubmit";
import { useSubmit } from "../../lib/account";
import { searchUsers } from "../../lib/admin";
import type { UserListState } from "./useUserList";
import UserList from "./UserList";

type Props = {
  list: UserListState;
  onChoose: (id: number) => void;
};

export default function UserSearch(props: Props) {
  const { list, onChoose } = props;
  const form = useSubmit(() => {
    list.setFocusId(null);
    return searchUsers(list.query).then(list.setUsers);
  });
  return (
    <>
      <form className="account-form" role="search" onSubmit={form.onSubmit}>
        <Field
          id="admin-user-query"
          label="Username or email"
          type="search"
          required={false}
          value={list.query}
          onValue={list.setQuery}
        />
        <FormSubmit label="Search" form={form} kind="secondary" />
      </form>
      {list.failed ? (
        <p className="error-text" role="alert">
          Couldn't load users. Reload to try again.
        </p>
      ) : (
        <UserList
          users={list.users}
          focusId={list.focusId}
          onChoose={onChoose}
        />
      )}
    </>
  );
}
