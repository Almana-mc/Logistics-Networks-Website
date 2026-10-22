import FormSubmit from "../../components/FormSubmit";
import { useSubmit } from "../../lib/account";
import { signOutUser, type AdminUser } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";

type Props = {
  user: AdminUser;
  guard: Reauth["guard"];
  onDone: () => void;
};

export default function UserSignOut({ user, guard, onDone }: Props) {
  const form = useSubmit(() => guard(() => signOutUser(user.id)).then(onDone));
  return (
    <form onSubmit={form.onSubmit}>
      <FormSubmit label="Sign out everywhere" form={form} kind="secondary" />
    </form>
  );
}
