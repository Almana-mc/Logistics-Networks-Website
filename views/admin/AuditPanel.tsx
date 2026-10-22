import AccountPanel from "../../components/AccountPanel";
import AuditEntries from "./AuditEntries";
import { useAuditLog } from "./useAuditLog";

export default function AuditPanel() {
  const { entries, more, failed, load } = useAuditLog();
  return (
    <AccountPanel title="Audit log">
      <button
        type="button"
        className="button secondary small"
        onClick={() => load()}
      >
        Refresh
      </button>
      {failed && (
        <p className="error-text" role="alert">
          Couldn't load the log. Try Refresh.
        </p>
      )}
      {entries?.length === 0 && <p>No admin actions yet.</p>}
      {entries && entries.length > 0 && <AuditEntries entries={entries} />}
      {more && (
        <button
          type="button"
          className="button secondary small"
          onClick={() => load(entries!.at(-1)!.id)}
        >
          Older entries
        </button>
      )}
    </AccountPanel>
  );
}
