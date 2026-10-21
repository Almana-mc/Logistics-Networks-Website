import { useState } from "react";
import {
  createShare,
  shareError,
  shareLimit,
  shareMessages,
  type Share,
} from "../../lib/share";

export function useShare(name: string, raw: string) {
  const [created, setCreated] = useState<Share | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const create = async () => {
    if (new Blob([raw]).size > shareLimit)
      return setError(shareMessages["too-large"]);
    setError("");
    setBusy(true);
    try {
      setCreated(await createShare(name, raw));
    } catch (failure) {
      setError(
        shareError(
          failure,
          "Couldn't create a link right now. Try again in a few minutes.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  return { created, busy, error, create };
}
