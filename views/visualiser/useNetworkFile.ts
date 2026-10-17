import { useEffect, useRef, useState } from "react";
import { libraryFile } from "../../lib/library";
import { parseNetwork, type Network } from "../../lib/network";

export type LoadedNetwork = { network: Network; name: string; raw: string };

export function useNetworkFile() {
  const reader = useNetworkReader();
  const { open, request } = reader;
  const openLibrary = (name: string) =>
    open(async () => {
      const response = await fetch(libraryFile(name));
      if (!response.ok)
        throw new Error(
          "Could not load that saved network. Choose a local file or try the example.",
        );
      return response.text();
    }, name);
  useEffect(() => {
    const name = new URLSearchParams(location.search).get("net");
    if (name) void openLibrary(name);
    return () => {
      request.current++;
    };
  }, []);
  return {
    loaded: reader.loaded,
    busy: reader.busy,
    error: reader.error,
    reset: () => {
      reader.reset();
      history.replaceState(null, "", location.pathname);
    },
    openExample: () => openLibrary("pilpohs-bee-setup.lnet"),
    openFile: (file: File) => open(() => file.text(), file.name),
  };
}

function useNetworkReader() {
  const [loaded, setLoaded] = useState<LoadedNetwork | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);
  const open = async (read: () => Promise<string>, name: string) => {
    const id = ++request.current;
    setError("");
    setBusy(true);
    try {
      const raw = await read();
      if (request.current === id)
        setLoaded({ network: parseNetwork(raw), raw, name });
    } catch (failure) {
      if (request.current === id)
        setError(
          failure instanceof Error
            ? failure.message
            : "Could not read that network.",
        );
    } finally {
      if (request.current === id) setBusy(false);
    }
  };
  const reset = () => {
    request.current++;
    setLoaded(null);
    setError("");
    setBusy(false);
  };
  return { loaded, busy, error, request, open, reset };
}
