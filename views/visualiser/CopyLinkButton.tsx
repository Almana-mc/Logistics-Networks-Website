import Icon from "../../components/Icon";
import { useCopy } from "./useCopy";

export default function CopyLinkButton({ url }: { url: string }) {
  const copy = useCopy();
  const copied = copy.status === "Copied";
  return (
    <>
      <button
        type="button"
        className="button secondary small"
        onClick={() =>
          copy.copy(url, "Couldn't copy. Copy the page address instead.")
        }
      >
        <Icon name="link" size={15} /> {copied ? "Copied" : "Copy link"}
      </button>
      <span
        role="status"
        className={copy.status && !copied ? "share-status" : "sr-only"}
      >
        {copy.status}
      </span>
    </>
  );
}
