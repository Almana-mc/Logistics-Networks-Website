import { useEffect, useRef, useState } from "react";
import { fetchLog, type LogEntry } from "../../lib/admin";

export function useAuditLog() {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [more, setMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  const load = (before?: number) => {
    const call = ++latest.current;
    return fetchLog(before).then(
      (page) => {
        if (call !== latest.current) return;
        setFailed(false);
        setEntries((old) => (before ? [...(old ?? []), ...page] : page));
        setMore(page.length === 100);
      },
      () => {
        if (call === latest.current) setFailed(true);
      },
    );
  };
  useEffect(() => {
    load();
  }, []);
  return { entries, more, failed, load };
}
