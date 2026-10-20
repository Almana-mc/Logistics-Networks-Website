import type { ReactNode } from "react";

type Props = { eyebrow: string; title: string; children: ReactNode };
export default function PageIntro({ eyebrow, title, children }: Props) {
  return (
    <header className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{children}</p>
    </header>
  );
}
