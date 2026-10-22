import { useState } from "react";
import Field from "../../components/Field";
import FormSubmit from "../../components/FormSubmit";
import { useSubmit } from "../../lib/account";
import { addBlock, type Block } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";

type Props = {
  guard: Reauth["guard"];
  onAdded: (blocks: Block[], pattern: string) => void;
};

export default function BlockForm({ guard, onAdded }: Props) {
  const [pattern, setPattern] = useState("");
  const form = useSubmit(() =>
    guard(() => addBlock(pattern)).then((list) => {
      onAdded(list, pattern);
      setPattern("");
    }),
  );
  return (
    <form className="account-form" onSubmit={form.onSubmit}>
      <Field
        id="admin-block"
        label="Email or @domain"
        hint="Matching accounts are signed out and can't sign in. @example.com doesn't cover subdomains."
        autoComplete="off"
        value={pattern}
        onValue={setPattern}
      />
      <FormSubmit label={form.busy ? "Blocking…" : "Block"} form={form} />
    </form>
  );
}
