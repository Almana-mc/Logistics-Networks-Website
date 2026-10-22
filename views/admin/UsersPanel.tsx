import { useEffect, useState } from "react";
import AccountPanel from "../../components/AccountPanel";
import Field from "../../components/Field";
import FormSubmit from "../../components/FormSubmit";
import { useSubmit } from "../../lib/account";
import { searchUsers, type AdminUser } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";
import UserDetail from "./UserDetail";
import UserList from "./UserList";

export default function UsersPanel({ guard }: { guard: Reauth["guard"] }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const form = useSubmit(() => searchUsers(query).then(setUsers));
  useEffect(() => {
    searchUsers("").then(setUsers, () => setUsers([]));
  }, []);
  const back = () => {
    setChosen(null);
    searchUsers(query).then(setUsers);
  };
  return (
    <AccountPanel title="Users">
      {chosen === null ? (
        <>
          <form className="account-form" role="search" onSubmit={form.onSubmit}>
            <Field
              id="admin-user-query"
              label="Username or email"
              type="search"
              required={false}
              value={query}
              onValue={setQuery}
            />
            <FormSubmit label="Search" form={form} kind="secondary" />
          </form>
          <UserList users={users} onChoose={setChosen} />
        </>
      ) : (
        <UserDetail id={chosen} guard={guard} onBack={back} />
      )}
    </AccountPanel>
  );
}
