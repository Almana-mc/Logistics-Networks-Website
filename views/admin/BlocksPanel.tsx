import { useEffect, useState } from "react";
import AccountPanel from "../../components/AccountPanel";
import { fetchBlocks, type Block } from "../../lib/admin";
import { useNotice } from "../../lib/useNotice";
import type { Reauth } from "../../lib/useReauth";
import BlockForm from "./BlockForm";
import BlockRow from "./BlockRow";

export default function BlocksPanel({ guard }: { guard: Reauth["guard"] }) {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [failed, setFailed] = useState(false);
  const notice = useNotice();
  useEffect(() => {
    fetchBlocks().then(setBlocks, () => setFailed(true));
  }, []);
  const removed = (list: Block[], pattern: string) => {
    setBlocks(list);
    notice.show(`Unblocked ${pattern}.`);
  };
  return (
    <AccountPanel title="Blocked emails">
      <BlockForm guard={guard} onAdded={setBlocks} />
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
