import { useRef, useState } from "react";

export function useNotice() {
  const [text, setText] = useState("");
  const ref = useRef<HTMLParagraphElement>(null);
  const show = (message: string) => {
    setText(message);
    ref.current!.focus();
  };
  return { text, ref, show, clear: () => setText("") };
}
