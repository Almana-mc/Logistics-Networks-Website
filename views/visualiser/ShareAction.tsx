import { useRef, useState } from "react";
import Icon from "../../components/Icon";
import { entryLink } from "../../lib/library";
import { shareUrl } from "../../lib/share";
import CopyLinkButton from "./CopyLinkButton";
import ShareDialog from "./ShareDialog";
import type { LoadedNetwork } from "./useNetworkFile";

export default function ShareAction({ loaded }: { loaded: LoadedNetwork }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  if (loaded.entry)
    return (
      <CopyLinkButton url={`${location.origin}/${entryLink(loaded.entry)}`} />
    );
  if (loaded.share) return <CopyLinkButton url={shareUrl(loaded.share.id)} />;
  return (
    <>
      <button
        ref={button}
        type="button"
        className="button secondary small"
        onClick={() => setOpen(true)}
      >
        <Icon name="link" size={15} /> Share link
      </button>
      <ShareDialog
        open={open}
        loaded={loaded}
        trigger={button}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
