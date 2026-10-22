import { links } from "../lib/resources";

const pages = [
  ["Home", "/index.html"],
  ["Library", "/library.html"],
  ["Visualiser", "/visualiser.html"],
  ["Docs", "/docs.html"],
];
const external = [
  ["CurseForge", links.curseforge],
  ["GitHub", links.github],
  ["Maven", links.maven],
  ["Discord", links.discord],
  ["almanax21.com", links.site],
];

export default function SiteFooter({ note = "" }: { note?: string }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span className="wordmark">
          Logistics <strong>Network</strong>
        </span>
        <nav aria-label="Footer">
          {pages.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
          {external.map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer">
              {label}
            </a>
          ))}
        </nav>
        <p>
          {note} Not an official Minecraft product. Not approved by or
          associated with Mojang or Microsoft.
        </p>
      </div>
    </footer>
  );
}
