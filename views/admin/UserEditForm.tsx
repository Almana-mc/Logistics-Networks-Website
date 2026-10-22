import { useState } from "react";
import FormSubmit from "../../components/FormSubmit";
import { useSubmit } from "../../lib/account";
import { saveUser, type AdminUser } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";
import UserFields from "./UserFields";

type Props = {
  user: AdminUser;
  guard: Reauth["guard"];
  onSaved: (user: AdminUser) => void;
};

export default function UserEditForm({ user, guard, onSaved }: Props) {
  const [values, setValues] = useState({
    username: user.username,
    email: user.email,
  });
  const [saved, setSaved] = useState(false);
  const form = useSubmit(() => {
    setSaved(false);
    return guard(() => saveUser(user.id, values)).then((next) => {
      onSaved(next);
      setSaved(true);
    });
  });
  return (
    <form
      className="account-form"
      aria-label="Edit user"
      onSubmit={form.onSubmit}
    >
      <UserFields values={values} onValues={setValues} />
       <FormSubmit label={form.busy ? "Saving…" : "Save user"} form={form} />
      <p className="account-note" role="status">
        {saved && "Saved. The user was emailed."}
      </p>
    </form>
  );
}
