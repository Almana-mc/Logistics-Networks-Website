import { useEffect, useState } from "react";
import { fetchLibrary, type NetworkEntry } from "../../lib/library";

export function useLibrary() {
  const [entries, setEntries] = useState<NetworkEntry[]>([]);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setStatus("loading");
    fetchLibrary(abort.signal)
      .then((data) => {
        setEntries(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!abort.signal.aborted) setStatus("error");
      });
    return () => abort.abort();
  }, [attempt]);
  return { entries, status, retry: () => setAttempt(attempt + 1) };
}
