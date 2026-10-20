import { useEffect, useState } from "react";

export function useDocsMenu(
  route: { key: string; anchor: string },
  branch: string,
) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open && document.activeElement?.closest("#docs-sidebar"))
      document.getElementById("main")!.focus({ preventScroll: true });
    setOpen(false);
    if (!route.anchor) window.scrollTo(0, 0);
  }, [route.key, branch]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      document.querySelector<HTMLButtonElement>(".docs-menu")!.focus();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return { open, toggle: () => setOpen(!open) };
}
