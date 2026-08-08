import type { SVGProps } from "react";

export type IconName =
  | "home"
  | "calendar"
  | "paw"
  | "bell"
  | "search"
  | "arrow"
  | "plus"
  | "close"
  | "pin"
  | "menu"
  | "logout"
  | "chevron"
  | "shield"
  | "clock"
  | "check"
  | "tag";

const paths: Record<IconName, string> = {
  home: "M3 10.5 12 3l9 7.5M5.5 9v10h13V9M9 19v-6h6v6",
  calendar:
    "M5 4v3M19 4v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1ZM8 12h2M14 12h2M8 16h2",
  paw: "M8 10c-1.4 0-2.5-1.4-2.5-3S6.6 4.5 8 4.5 10.5 5.9 10.5 7 9.4 10 8 10Zm8 0c1.4 0 2.5-1.4 2.5-3S17.4 4.5 16 4.5 13.5 5.9 13.5 7s1.1 3 2.5 3ZM12 11c-2.5 0-5 3-5 5.5 0 1.8 1.4 2.5 3 2.5.9 0 1.4-.5 2-.5s1.1.5 2 .5c1.6 0 3-.7 3-2.5C17 14 14.5 11 12 11Z",
  bell: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8ZM10 21h4",
  search: "m20 20-4.5-4.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z M12 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  menu: "M4 7h16M4 12h16M4 17h16",
  logout: "M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6",
  chevron: "m6 9 6 6 6-6",
  shield: "M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  check: "m5 12 4 4L19 6",
  tag: "m20 13-7 7-10-10V4h6l10 9ZM7.5 7.5h.01",
};

export function Icon({
  name,
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
