import { useEffect, useState } from "react";
import { searchUsers, type AdminUser } from "./admin";

export function useUserList() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [failed, setFailed] = useState(false);
  const load = (query: string) =>
    searchUsers(query).then(setUsers, () => setFailed(true));
  useEffect(() => {
    load("");
  }, []);
  const remove = (id: number) =>
    setUsers((list) => list && list.filter((user) => user.id !== id));
  return { query, setQuery, users, setUsers, failed, load, remove };
}
export type UserList = ReturnType<typeof useUserList>;
