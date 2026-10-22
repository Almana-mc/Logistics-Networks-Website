import { describeError, formatDate, useSubmit } from "../../lib/account";
import { removeBlock, type Block } from "../../lib/admin";
import type { Reauth } from "../../lib/useReauth";

type Props = {
  block: Block;
  guard: Reauth["guard"];
  onRemoved: (blocks: Block[], pattern: string) => void;
};

export default function BlockRow({ block, guard, onRemoved }: Props) {
  const form = useSubmit(() =>
    guard(() => removeBlock(block.pattern)).then((list) =>
      onRemoved(list, block.pattern),
    ),
  );
  return (
    <li className="admin-row">
      <form onSubmit={form.onSubmit}>
        <span>
          <strong>{block.pattern}</strong> · {block.accounts}{" "}
          {block.accounts === 1 ? "account" : "accounts"} · since{" "}
          {formatDate(block.createdAt)}
        </span>
        <button className="button secondary small" disabled={form.busy}>
          Unblock <span className="sr-only">{block.pattern}</span>
        </button>
        <p className="error-text" role="alert">
          {form.error && describeError(form.error)}
        </p>
      </form>
    </li>
  );
}
