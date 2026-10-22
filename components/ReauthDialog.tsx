import { useEffect, useId, useRef } from "react";
import ReauthMethods from "./ReauthMethods";

type Props = {
  open: boolean;
  hasPassword: boolean;
  onFinish: (confirmed: boolean) => void;
};

export default function ReauthDialog({ open, hasPassword, onFinish }: Props) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current!.showModal();
    else dialog.current!.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="reauth-dialog"
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-intro`}
      onClose={() => onFinish(false)}
    >
      <h2 id={`${id}-heading`}>Confirm it's you</h2>
      <p id={`${id}-intro`}>
        Changing account security needs a recent sign-in.
      </p>
      {open && (
        <ReauthMethods
          hasPassword={hasPassword}
          onDone={() => onFinish(true)}
        />
      )}
      <button
        type="button"
        className="button secondary"
        onClick={() => onFinish(false)}
      >
        Cancel
      </button>
    </dialog>
  );
}
