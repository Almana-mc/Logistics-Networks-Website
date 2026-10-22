import { useEffect, useRef, useState } from "react";
import AccountPanel from "../../components/AccountPanel";
import NetworkRow from "../../components/NetworkRow";
import {
  deleteUpload,
  editUpload,
  fetchOwnUploads,
  type Upload,
} from "../../lib/uploads";

export default function NetworksSection() {
  const { uploads, notice, note, saved, deleted } = useOwnUploads();
  return (
    <AccountPanel title="Your networks">
      {uploads?.length === 0 && (
        <p>
          Nothing published yet. Open an export in the{" "}
          <a href="visualiser.html">visualiser</a> and choose Publish.
        </p>
      )}
      {!!uploads?.length && (
        <ul className="network-rows">
          {uploads.map((upload) => (
            <NetworkRow
              key={upload.id}
              upload={upload}
              save={editUpload}
              remove={deleteUpload}
              onSaved={saved}
              onDeleted={deleted}
            />
          ))}
        </ul>
      )}
      <p ref={note} className="account-note" role="status" tabIndex={-1}>
        {notice}
      </p>
    </AccountPanel>
  );
}

function useOwnUploads() {
  const [uploads, setUploads] = useState<Upload[] | null>(null);
  const [notice, setNotice] = useState("Loading your networks…");
  const note = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    fetchOwnUploads().then(
      (list) => {
        setUploads(list);
        setNotice("");
      },
      () => setNotice("Couldn't load your networks. Reload to try again."),
    );
  }, []);
  return {
    uploads,
    notice,
    note,
    saved: (next: Upload) =>
      setUploads(uploads!.map((old) => (old.id === next.id ? next : old))),
    deleted: (gone: Upload) => {
      setUploads(uploads!.filter((old) => old.id !== gone.id));
      setNotice(`Deleted ${gone.name}.`);
      note.current!.focus();
    },
  };
}
