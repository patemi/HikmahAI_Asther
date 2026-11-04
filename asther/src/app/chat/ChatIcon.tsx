import type { CSSProperties } from "react";
const paths = {
  menu: "M4 5h16M4 12h16M4 19h16",
  panel: "M9 4v16M4 4h16v16H4z",
  plus: "M12 5v14M5 12h14",
  search: "m20 20-4.5-4.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  send: "m6 12 6-6 6 6M12 6v14",
  stop: "M7 7h10v10H7z",
  close: "m6 6 12 12M6 18 18 6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  edit: "m15 5 4 4M4 20l4-1L20 7l-4-4L4 15z",
  pin: "m15 4 5 5-4 2-3 5-5-5 5-3zM9 15l-5 5",
  trash: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7",
  copy: "M8 8h12v13H8zM16 8V3H3v13h5",
  check: "m5 12 4 4L19 6",
  refresh: "M20 8a8 8 0 1 0 0 8M20 3v5h-5",
  book: "M12 5v16M3 4c4-1 6-1 9 1 3-2 5-2 9-1v15c-4-1-6-1-9 1-3-2-5-2-9-1z",
  moon: "M20 15A9 9 0 0 1 9 3 9 9 0 1 0 20 15",
  sun: "M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  arrow: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  flag: "M5 21V3h13l-3 4 3 4H5",
  logout: "M9 4H4v16h5M9 12h12m-5-5 5 5-5 5",
  history: "M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v6l4 2",
  chat: "M21 11a8 8 0 0 1-8 8H6l-4 3V11a9 9 0 0 1 19 0z",
  temporary: "M4 6v4M4 14v4M8 3h4M16 4l3 3M21 11v4M17 20h-4M9 20l-4 1 1-4",
  share: "M12 16V3m-5 5 5-5 5 5M5 12v8h14v-8",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  archive: "M3 3h18v5H3zM5 8v13h14V8M9 12h6",
  restore: "M4 9V4m0 0h5M4 4l6 6M5 14v7h14V8h-5",
  settings:
    "M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0zM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8",
  volume: "M4 9h4l5-5v16l-5-5H4zM17 8a7 7 0 0 1 0 8M20 4a12 12 0 0 1 0 16",
  file: "M14 2H5v20h14V7zM14 2v5h5M8 12h8M8 16h6",
  thumbUp: "M7 10v11H3V10zM7 11l5-9c3 0 2 5 1 7h6c2 0 2 1 1 4l-2 8H7",
  thumbDown: "M7 14V3H3v11zM7 13l5 9c3 0 2-5 1-7h6c2 0 2-1 1-4l-2-8H7",
  external: "M14 3h7v7M21 3 10 14M10 3H3v18h18v-7",
} as const;
export type IconName = keyof typeof paths;
export default function ChatIcon({
  name,
  size = 18,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
