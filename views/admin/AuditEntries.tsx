import type { LogEntry } from "../../lib/admin";

const detail = (entry: LogEntry) => JSON.stringify(entry.detail);

export default function AuditEntries({ entries }: { entries: LogEntry[] }) {
  return (
    <ol className="admin-log">
      {entries.map((entry) => (
        <li key={entry.id}>
          <time dateTime={new Date(entry.createdAt).toISOString()}>
            {new Date(entry.createdAt).toLocaleString()}
          </time>
          <span>
            {entry.admin ?? "Deleted admin"} · {entry.action} · {entry.target}
          </span>
          {detail(entry) !== "{}" && <code>{detail(entry)}</code>}
        </li>
      ))}
    </ol>
  );
}
