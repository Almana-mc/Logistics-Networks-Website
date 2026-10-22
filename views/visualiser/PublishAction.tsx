import { useRef, useState } from "react";
import Icon from "../../components/Icon";
import PublishDialog from "./PublishDialog";
import type { LoadedNetwork } from "./useNetworkFile";

export default function PublishAction({ loaded }: { loaded: LoadedNetwork }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={button}
        type="button"
        className="button primary small"
        onClick={() => setOpen(true)}
      >
        <Icon name="upload" size={15} /> Publish
      </button>
      {open && (
        <PublishDialog
          loaded={loaded}
          trigger={button}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
