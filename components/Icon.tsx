type Props = {
  name:
    | "arrow"
    | "external"
    | "upload"
    | "file"
    | "close"
    | "menu"
    | "download"
    | "book"
    | "reset"
    | "link"
    | "copy";
  size?: number;
};

export default function Icon({ name, size = 20 }: Props) {
  const paths = {
    arrow: "M5 12h14m-6-6 6 6-6 6",
    external: "M7 17 17 7M7 7h10v10",
    upload: "M12 16V4m-6 6 6-6 6 6M4 17v3h16v-3",
    file: "M14 3H5v18h14V8l-5-5v5h5M8 13h8m-8 4h5",
    close: "m6 6 12 12M6 18 18 6",
    menu: "M4 6h16M4 12h16M4 18h16",
    download: "M12 4v12m-6-6 6 6 6-6M4 17v3h16v-3",
    book: "M4 19V6a2 2 0 0 1 2-2h11v15H6a2 2 0 0 0-2 2zM17 4v15",
    reset: "M3 12a9 9 0 1 0 3-6.7M3 4v4h4",
    link: "M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1",
    copy: "M8 8h12v12H8zM16 8V4H4v12h4",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
