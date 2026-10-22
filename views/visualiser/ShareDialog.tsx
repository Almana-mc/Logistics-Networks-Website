import { useEffect, useRef, type RefObject } from "react";
import ShareConsent from "./ShareConsent";
import ShareResult from "./ShareResult";
import { useShare } from "./useShare";
import { expiryText, shareUrl } from "../../lib/share";
import type { LoadedNetwork } from "./useNetworkFile";

type Props = {
  open: boolean;
  loaded: LoadedNetwork;
  trigger: RefObject<HTMLButtonElement>;
  onClose: () => void;
};

export default function ShareDialog({ open, loaded, trigger, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const share = useShare(loaded.name, loaded.raw);
  useEffect(() => {
    if (!open) return;
    dialog.current!.showModal();
    return () => {
      dialog.current?.close();
      trigger.current?.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="share-dialog"
      aria-labelledby="share-heading"
      onClose={onClose}
    >
      {share.created ? (
        <ShareResult
          id="share"
          title="Link ready"
          label="Share link"
          url={shareUrl(share.created.id)}
          onDone={onClose}
        >
          <p>Link {expiryText(share.created.expiresAt)}.</p>
        </ShareResult>
      ) : (
        <ShareConsent
          name={loaded.name}
          busy={share.busy}
          error={share.error}
          onCreate={share.create}
          onCancel={onClose}
        />
      )}
    </dialog>
  );
}
