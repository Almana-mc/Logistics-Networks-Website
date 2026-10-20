import { useEffect, useRef, useState } from "react";
import {
  fetchLibrary,
  libraryFile,
  type NetworkEntry,
} from "../../lib/library";
import { parseNetwork, type Network } from "../../lib/network";

export type LoadedNetwork = {
  network: Network;
  name: string;
  raw: string;
  entry?: NetworkEntry;
};

export function useNetworkFile() {
  const reader = useNetworkReader();
  const { open, request } = reader;
  const openLibrary = (name: string) => {
    history.replaceState(null, "", `?net=${encodeURIComponent(name)}`);
    return open(async () => {
      const [response, entries] = await Promise.all([
        fetch(libraryFile(name)),
        fetchLibrary().catch(() => []),
      ]);
      if (!response.ok)
        throw new Error(
          `Could not find ${name} in the library. It may have been renamed or removed.`,
        );
      return [await response.text(), entries.find((e) => e.file === name)];
    }, name);
  };
  useEffect(() => {
    const name = new URLSearchParams(location.search).get("net");
    if (name) void openLibrary(name);
    return () => {
      request.current++;
    };
  }, []);
  const local = () => history.replaceState(null, "", location.pathname);
  return {
    loaded: reader.loaded,
    busy: reader.busy,
    error: reader.error,
    reset: () => {
      reader.reset();
      local();
    },
    openExample: () => openLibrary("pilpohs-bee-setup.lnet"),
    openFile: (file: File) => {
      local();
      return open(async () => [await file.text()], file.name);
    },
  };
}

type Read = () => Promise<[string, NetworkEntry?]>;

function useNetworkReader() {
  const [loaded, setLoaded] = useState<LoadedNetwork | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);
  const open = async (read: Read, name: string) => {
    const id = ++request.current;
    setError("");
    setBusy(true);
    try {
      const [raw, entry] = await read();
      if (request.current === id)
        setLoaded({ network: parseNetwork(raw), raw, name, entry });
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
