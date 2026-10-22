import type { ReactNode } from "react";
import CopyField from "./CopyField";

type Props = {
  id: string;
  title: string;
  label: string;
  url: string;
  children: ReactNode;
  onDone: () => void;
};

export default function ShareResult({
  id,
  title,
  label,
  url,
  children,
  onDone,
}: Props) {
  return (
    <>
      <h2 id={`${id}-heading`}>{title}</h2>
      <CopyField id={`${id}-url`} label={label} url={url} />
      {children}
      <button type="button" className="button secondary small" onClick={onDone}>
        Done
      </button>
    </>
  );
}
