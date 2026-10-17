import { useEffect, useRef, useState } from "react";
import PrimaryNavigation from "./PrimaryNavigation";
import logo from "../assets/logistic-icon-104.png";
import Icon from "./Icon";

export default function Header({ current }: { current: string }) {
  const { open, setOpen, button } = useMenu();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a
          className="brand"
          href="index.html"
          aria-label="Logistics Network home"
        >
          <img src={logo} alt="" width="52" height="52" />
          <span>
            Logistics
            <br />
            <strong>Network</strong>
          </span>
        </a>
        <button
          ref={button}
          className="menu-toggle button secondary"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "close" : "menu"} />
          Menu
        </button>
        <PrimaryNavigation
          current={current}
          open={open}
          onClose={() => setOpen(false)}
        />
      </div>
    </header>
  );
}

function useMenu() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return { open, setOpen, button };
}
