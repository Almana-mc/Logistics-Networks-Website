import { useState, type DragEvent } from "react";
import NetworkFileInput from "./NetworkFileInput";
import UploadActions from "./UploadActions";
import Icon from "../../components/Icon";

type Props = {
  busy: boolean;
  error: string;
  onFile: (file: File) => void;
  onExample: () => void;
};

export default function UploadNetwork({
  busy,
  error,
  onFile,
  onExample,
}: Props) {
  const dropTarget = useDropTarget(onFile);
  return (
    <div {...dropTarget}>
      <div className="upload-rings" aria-hidden="true">
        <span>
          <Icon name="upload" size={28} />
        </span>
      </div>
      <h2>Drop a .lnet file here</h2>
      <NetworkFileInput busy={busy} onFile={onFile} />
      <UploadActions busy={busy} error={error} onExample={onExample} />
    </div>
  );
}

function useDropTarget(onFile: (file: File) => void) {
  const [drag, setDrag] = useState(false);
  return {
    className: `stage upload-zone${drag ? " is-dragging" : ""}`,
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDrag(true);
    },
    onDragLeave: (event: DragEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node))
        setDrag(false);
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDrag(false);
      if (event.dataTransfer.files[0]) onFile(event.dataTransfer.files[0]);
    },
  };
}
