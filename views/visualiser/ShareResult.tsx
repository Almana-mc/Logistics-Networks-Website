import Icon from "../../components/Icon";
import { expiryText, shareUrl, type Share } from "../../lib/share";
import { useCopy } from "./useCopy";

type Props = { share: Share; onDone: () => void };

export default function ShareResult({ share, onDone }: Props) {
  const copy = useCopy();
  const url = shareUrl(share.id);
  return (
    <>
      <h2 id="share-heading">Link ready</h2>
      <label htmlFor="share-url">Share link</label>
      <div className="share-url">
        <input
          id="share-url"
          type="text"
          readOnly
          autoFocus
          value={url}
          onFocus={(event) => event.currentTarget.select()}
        />
        <button
          type="button"
          className="button secondary small"
          onClick={() =>
            copy.copy(url, "Couldn't copy. Select the link and copy it.")
          }
        >
          <Icon name="copy" size={15} /> Copy
        </button>
      </div>
      <p role="status" className="share-status">
        {copy.status}
      </p>
      <p>Link {expiryText(share.expiresAt)}.</p>
      <button type="button" className="button secondary small" onClick={onDone}>
        Done
      </button>
    </>
  );
}
