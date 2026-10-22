import { useEffect, useRef, useState, type RefObject } from "react";
import { useAccount } from "../../lib/account";
import { entryLink, type NetworkEntry } from "../../lib/library";
import PublishForm from "./PublishForm";
import PublishSignIn from "./PublishSignIn";
import ShareResult from "./ShareResult";
import type { LoadedNetwork } from "./useNetworkFile";

type Props = {
  loaded: LoadedNetwork;
  trigger: RefObject<HTMLButtonElement>;
  onClose: () => void;
};

export default function PublishDialog({ loaded, trigger, onClose }: Props) {
  const dialog = useModal(trigger);
  const { account, loading } = useAccount();
  const [published, setPublished] = useState<NetworkEntry | null>(null);
  const close = () => dialog.current!.close();
  // Published files reopen as library entries
  const closed = () =>
    published ? location.replace(entryLink(published)) : onClose();
  return (
    <dialog
      ref={dialog}
      className="share-dialog"
      aria-labelledby="publish-heading"
      onClose={closed}
    >
      {published ? (
        <ShareResult
          id="publish"
          title="Published"
          label="Library link"
          url={`${location.origin}/${entryLink(published)}`}
          onDone={close}
        >
          <p>{published.name} is in the library now.</p>
        </ShareResult>
      ) : account ? (
        <PublishForm
          loaded={loaded}
          author={account.user.username}
          onPublished={setPublished}
          onCancel={close}
        />
      ) : (
        !loading && <PublishSignIn onCancel={close} />
      )}
    </dialog>
  );
}

function useModal(trigger: RefObject<HTMLButtonElement>) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current!.showModal();
    return () => trigger.current?.focus();
  }, []);
  return dialog;
}
