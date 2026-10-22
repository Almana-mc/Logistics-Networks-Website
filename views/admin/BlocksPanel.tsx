import AccountPanel from "../../components/AccountPanel";
import type { Block } from "../../lib/admin";
import { useNotice } from "../../lib/useNotice";
import type { Reauth } from "../../lib/useReauth";
import BlockForm from "./BlockForm";
import BlockRow from "./BlockRow";
import { useBlocks } from "./useBlocks";

export default function BlocksPanel({ guard }: { guard: Reauth["guard"] }) {
  const { blocks, failed, setBlocks } = useBlocks();
  const notice = useNotice();
  const removed = (list: Block[], pattern: string) => {
    setBlocks(list);
    notice.show(`Unblocked ${pattern}.`);
  };
  const added = (list: Block[], pattern: string) => {
    setBlocks(list);
    notice.show(`Blocked ${pattern}.`);
  };
  return (
    <AccountPanel title="Blocked emails">
      <BlockForm guard={guard} onAdded={added} />
      {failed && (
        <p className="error-text" role="alert">
          Couldn't load blocked emails. Reload to try again.
        </p>
      )}
      {blocks?.length === 0 && <p>No blocked emails.</p>}
      {blocks && blocks.length > 0 && (
        <ul className="admin-list">
          {blocks.map((block) => (
            <BlockRow
              key={block.pattern}
              block={block}
              guard={guard}
              onRemoved={removed}
            />
          ))}
        </ul>
      )}
      <p ref={notice.ref} className="account-note" role="status" tabIndex={-1}>
        {notice.text}
      </p>
    </AccountPanel>
  );
}
