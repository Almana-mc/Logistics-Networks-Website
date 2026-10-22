import Icon from "../../components/Icon";
import { useCopy } from "./useCopy";

type Props = { id: string; label: string; url: string };

export default function CopyField({ id, label, url }: Props) {
  const copy = useCopy();
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="share-url">
        <input
          id={id}
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
    </>
  );
}
