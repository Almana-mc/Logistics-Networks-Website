import { useEffect, useState } from "react";

export function useCopy() {
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (status !== "Copied") return;
    const timer = setTimeout(() => setStatus(""), 1600);
    return () => clearTimeout(timer);
  }, [status]);
  const copy = (text: string, failure: string) =>
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(text))
      .then(
        () => setStatus("Copied"),
        () => setStatus(failure),
      );
  return { status, copy };
}
