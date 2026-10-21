import { useId, type ReactNode } from "react";

type Props = { title: string; children: ReactNode };

export default function AccountPanel({ title, children }: Props) {
  const id = useId();
  return (
    <section className="account-panel" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}
