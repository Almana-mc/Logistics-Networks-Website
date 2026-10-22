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
  const [saved, setSaved] = useState("");
  const form = useSubmit(() => {
    setSaved("");
    return guard(() => saveUser(user.id, values)).then((next) => {
      const changed =
        next.username !== user.username || next.email !== user.email;
      setValues({ username: next.username, email: next.email });
      onSaved(next);
      setSaved(
        changed ? "Saved. The user was emailed." : "No changes to save.",
      );
    });
  });
  return (
    <form
      className="account-form"
      aria-label="Edit user"
      onSubmit={form.onSubmit}
    >
      <UserFields values={values} onValues={setValues} />
      <FormSubmit label={form.busy ? "Saving…" : "Save user"} form={form} />
      <p className="account-note" role="status">
        {saved}
      </p>
    </form>
  );
}
