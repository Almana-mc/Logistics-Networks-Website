type Props = {
  name:
    "arrow" | "external" | "upload" | "file" | "close" | "menu" | "download";
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
