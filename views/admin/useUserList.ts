import { useEffect, useState } from "react";
import { searchUsers, type AdminUser } from "../../lib/admin";

export function useUserList() {
  const [query, setQuery] = useState("");
  const [users, setRows] = useState<AdminUser[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [focusId, setFocusId] = useState<number | null>(null);
  const setUsers = (next: AdminUser[]) => {
    setFailed(false);
    setRows(next);
  };
  const load = (query: string) =>
    searchUsers(query).then(setUsers, () => setFailed(true));
  useEffect(() => {
    load("");
  }, []);
  const remove = (id: number) =>
    setRows((list) => list && list.filter((user) => user.id !== id));
  return {
    query,
    setQuery,
    users,
    setUsers,
    failed,
    load,
    remove,
    focusId,
    setFocusId,
  };
}
export type UserListState = ReturnType<typeof useUserList>;
