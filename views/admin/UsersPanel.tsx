import { useState } from "react";
import AccountPanel from "../../components/AccountPanel";
import type { AdminUser } from "../../lib/admin";
import { useNotice } from "../../lib/useNotice";
import { useUserList } from "./useUserList";
import type { Reauth } from "../../lib/useReauth";
import UserDetail from "./UserDetail";
import UserSearch from "./UserSearch";

export default function UsersPanel({ guard }: { guard: Reauth["guard"] }) {
  const list = useUserList();
  const [chosen, setChosen] = useState<number | null>(null);
  const notice = useNotice();
  const choose = (id: number) => {
    setChosen(id);
    list.setFocusId(id);
    notice.clear();
  };
  const back = () => {
    setChosen(null);
    list.load(list.query);
  };
  const deleted = (user: AdminUser) => {
    setChosen(null);
    list.remove(user.id);
    notice.show(`Deleted ${user.username}.`);
  };
  return (
    <AccountPanel title="Users">
      {chosen === null ? (
        <UserSearch list={list} onChoose={choose} />
      ) : (
        <UserDetail
          id={chosen}
          guard={guard}
          onBack={back}
          onDeleted={deleted}
        />
      )}
      <p ref={notice.ref} className="account-note" role="status" tabIndex={-1}>
        {notice.text}
      </p>
    </AccountPanel>
  );
}
