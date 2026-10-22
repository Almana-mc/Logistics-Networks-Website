import { useEffect, useState } from "react";
import { fetchLog, type LogEntry } from "../../lib/admin";

export function useAuditLog() {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [more, setMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const load = (before?: number) =>
    fetchLog(before).then(
      (page) => {
        setFailed(false);
        setEntries((old) => (before ? [...(old ?? []), ...page] : page));
        setMore(page.length === 100);
      },
      () => setFailed(true),
    );
  useEffect(() => {
    load();
  }, []);
  return { entries, more, failed, load };
}
