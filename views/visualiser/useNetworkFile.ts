import { useEffect, useRef, useState } from "react";
import {
  entryFile,
  fetchLibrary,
  libraryFile,
  type NetworkEntry,
} from "../../lib/library";
import { fetchUploads } from "../../lib/uploads";
import { parseNetwork, type Network } from "../../lib/network";
import { fetchShare, shareError, type Share } from "../../lib/share";

export type LoadedNetwork = {
  network: Network;
  name: string;
  raw: string;
  entry?: NetworkEntry;
  share?: Share;
};

type Read = () => Promise<Omit<LoadedNetwork, "network">>;

const readLibrary =
  (name: string): Read =>
  async () => {
    const [response, entries] = await Promise.all([
      fetch(libraryFile(name)),
      fetchLibrary().catch(() => []),
    ]);
    if (!response.ok)
      throw new Error(
        `Could not find ${name} in the library. It may have been renamed or removed.`,
      );
    const entry = entries.find((e) => e.file === name);
    return { raw: await response.text(), name, entry };
  };

// ponytail: whole list, add a by-id route when it grows
const readUpload =
  (id: string): Read =>
  async () => {
    const entries = await fetchUploads().catch(() => {
      throw new Error(
        "Couldn't reach the library right now. Try again in a few minutes.",
      );
    });
    const entry = entries.find((e) => e.id === id);
    const response = entry && (await fetch(entryFile(entry)));
    if (!entry || !response?.ok)
      throw new Error(
        "This network was deleted by its author, or the link is wrong.",
      );
    return { raw: await response.text(), name: entry.file, entry };
  };

const readShare =
  (id: string): Read =>
  async () => {
    const shared = await fetchShare(id).catch((failure: unknown) => {
      throw new Error(
        shareError(
          failure,
          "Couldn't open this share link right now. Try again in a few minutes.",
        ),
      );
    });
    const share = { id, expiresAt: shared.expiresAt };
    return { raw: shared.lnet, name: shared.name, share };
  };

function readFromUrl() {
  const params = new URLSearchParams(location.search);
  const share = params.get("share");
  const upload = params.get("network");
  const name = params.get("net");
  if (share) return readShare(share);
  if (upload) return readUpload(upload);
  if (name) return readLibrary(name);
}

export function useNetworkFile() {
  const reader = useNetworkReader();
  const { open, request } = reader;
  const openLibrary = (name: string) => {
    history.replaceState(null, "", `?net=${encodeURIComponent(name)}`);
    return open(readLibrary(name));
  };
  useEffect(() => {
    const read = readFromUrl();
    if (read) void open(read);
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
    openLibrary,
    openFile: (file: File) => {
      local();
      return open(async () => {
        if (!/\.lnet$/i.test(file.name))
          throw new Error(
            "Only .lnet files can be opened. Export one from the in-game Computer screen.",
          );
        return { raw: await file.text(), name: file.name };
      });
    },
  };
}

function useNetworkReader() {
  const [loaded, setLoaded] = useState<LoadedNetwork | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);
  const open = async (read: Read) => {
    const id = ++request.current;
    setError("");
    setBusy(true);
    try {
      const file = await read();
      if (request.current === id)
        setLoaded({ ...file, network: parseNetwork(file.raw) });
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
