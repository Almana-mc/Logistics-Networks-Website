import { useEffect, useRef } from "react";

type Action = "edit" | "delete";

export function useReturnFocus(mode: Action | "view") {
  const buttons = {
    edit: useRef<HTMLButtonElement>(null),
    delete: useRef<HTMLButtonElement>(null),
  };
  const last = useRef(mode);
  useEffect(() => {
    if (mode === "view" && last.current !== "view")
      buttons[last.current].current!.focus();
    last.current = mode;
  }, [mode]);
  return buttons;
}
