import type { SVGProps } from "react";

/**
 * In-house line-icon set — one consistent grid (24×24), one stroke weight,
 * `currentColor` everywhere. This replaces every emoji in the app so the
 * whole product reads as a single, deliberate, world-class system.
 */

export type IconName =
  | "search"
  | "heart"
  | "heartFilled"
  | "share"
  | "bed"
  | "bath"
  | "area"
  | "mapPin"
  | "home"
  | "building"
  | "key"
  | "waves"
  | "check"
  | "shield"
  | "euro"
  | "sliders"
  | "compare"
  | "chevronLeft"
  | "chevronRight"
  | "chevronDown"
  | "sparkles"
  | "arrowLeft"
  | "arrowRight"
  | "arrowUpRight"
  | "close"
  | "user"
  | "message"
  | "plus"
  | "minus"
  | "star"
  | "trendUp"
  | "flame"
  | "tree"
  | "sofa"
  | "paw"
  | "bolt"
  | "eye"
  | "calendar"
  | "globe"
  | "menu"
  | "compass"
  | "wallet"
  | "bell"
  | "villa"
  | "plot"
  | "store"
  | "briefcase"
  | "factory"
  | "warehouse"
  | "landmark"
  | "sprout";

const PATHS: Record<IconName, JSX.Element> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  heart: <path d="M12 20.5 4.3 13a4.6 4.6 0 0 1 6.4-6.6l1.3 1.2 1.3-1.2A4.6 4.6 0 0 1 19.7 13z" />,
  heartFilled: (
    <path
      d="M12 20.5 4.3 13a4.6 4.6 0 0 1 6.4-6.6l1.3 1.2 1.3-1.2A4.6 4.6 0 0 1 19.7 13z"
      fill="currentColor"
      stroke="none"
    />
  ),
  share: (
    <>
      <path d="M12 3v13" />
      <path d="m8 7 4-4 4 4" />
      <path d="M6 13v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5" />
    </>
  ),
  bed: (
    <>
      <path d="M3 18v-7a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v6" />
      <path d="M3 14h18" />
      <path d="M7 9V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
      <path d="M3 18v2M21 18v2" />
    </>
  ),
  bath: (
    <>
      <path d="M4 12V6a2 2 0 0 1 3.5-1.3" />
      <path d="M6 6h.01" />
      <path d="M3 12h18v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
      <path d="M7 18l-1 2M17 18l1 2" />
    </>
  ),
  area: (
    <>
      <path d="M4 4h16v16H4z" />
      <path d="M4 9h4M4 15h4M9 4v4M15 4v4" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  home: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  building: (
    <>
      <path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16" />
      <path d="M14 21V9h4a1 1 0 0 1 1 1v11" />
      <path d="M8 8h2M8 12h2M8 16h2M3 21h18" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="m10.8 10.8 8.2 8.2" />
      <path d="m15 15 2-2M18 18l2-2" />
    </>
  ),
  waves: (
    <>
      <path d="M2 7c2 0 2 1.5 4 1.5S8 7 10 7s2 1.5 4 1.5S16 7 18 7s2 1.5 4 1.5" />
      <path d="M2 12c2 0 2 1.5 4 1.5S8 12 10 12s2 1.5 4 1.5S16 12 18 12s2 1.5 4 1.5" />
      <path d="M2 17c2 0 2 1.5 4 1.5S8 17 10 17s2 1.5 4 1.5S16 17 18 17s2 1.5 4 1.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.4 3 8 7 10 4-2 7-5.6 7-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  euro: (
    <>
      <path d="M17 6.5A6 6 0 0 0 7.5 11M17 17.5A6 6 0 0 1 7.5 13" />
      <path d="M4 10.5h8M4 13.5h7" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </>
  ),
  compare: (
    <>
      <rect x="4" y="7" width="6" height="13" rx="1.2" />
      <rect x="14" y="4" width="6" height="16" rx="1.2" />
    </>
  ),
  chevronLeft: <path d="m14 6-6 6 6 6" />,
  chevronRight: <path d="m10 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  sparkles: (
    <>
      <path d="M12 3 13.6 8.4 19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M20 12H4" />
      <path d="m10 6-6 6 6 6" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4 12h16" />
      <path d="m14 6 6 6-6 6" />
    </>
  ),
  arrowUpRight: (
    <>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" />
    </>
  ),
  message: <path d="M4 5h16v11H9l-5 4z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  star: <path d="M12 3.5 14.6 9l5.9.6-4.4 4 1.3 5.8L12 16.6 6.6 19.4 7.9 13.6 3.5 9.6 9.4 9z" />,
  trendUp: (
    <>
      <path d="M3 17 9 11l4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  flame: <path d="M12 3c.5 3-2 4-2 7a2 2 0 0 0 4 0c0 1.5 2 2.5 2 5a4 4 0 0 1-8 0c0-4 4-5 4-12z" />,
  tree: (
    <>
      <path d="M12 3 6 11h3l-3 4h12l-3-4h3z" />
      <path d="M12 15v6" />
    </>
  ),
  sofa: (
    <>
      <path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" />
      <path d="M3 12a2 2 0 0 1 2 2v3h14v-3a2 2 0 0 1 2-2" />
      <path d="M5 17v2M19 17v2" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="9" r="1.6" />
      <circle cx="12" cy="7" r="1.6" />
      <circle cx="17" cy="9" r="1.6" />
      <path d="M12 12c-2.5 0-4.5 2-4.5 4 0 1.5 1.5 2.5 4.5 2.5s4.5-1 4.5-2.5c0-2-2-4-4.5-4z" />
    </>
  ),
  bolt: <path d="M13 3 5 13h5l-1 8 8-10h-5z" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 9h16M8 3v4M16 3v4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v2" />
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M16 13h2" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10.5 19a1.6 1.6 0 0 0 3 0" />
    </>
  ),
  // Kategória-ikonok — a 3D matricák helyett, egységes vonalnyelven.
  villa: (
    <>
      <path d="M2.5 21h19" />
      <path d="M4 21v-8M20 21v-8" />
      <path d="M2.5 13 12 5.5 21.5 13" />
      <path d="M9.5 21v-5.5h5V21" />
    </>
  ),
  plot: (
    <>
      <path d="M4 4h4M16 4h4M4 20h4M16 20h4" />
      <path d="M4 4v4M4 16v4M20 4v4M20 16v4" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
  store: (
    <>
      <path d="m5 7 1.5-4h11L19 7" />
      <path d="M4 7h16v2.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0z" />
      <path d="M5 13v8h14v-8" />
      <path d="M9.5 21v-5h5v5" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </>
  ),
  factory: (
    <>
      <path d="M3 21V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v9l5-3.5V13l6-4v12" />
      <path d="M2.5 21h19" />
      <path d="M7 17h2M12.5 17h2" />
    </>
  ),
  warehouse: (
    <>
      <path d="M3 21V9.5L12 4l9 5.5V21" />
      <path d="M7 21v-8h10v8" />
      <path d="M7 16.5h10" />
    </>
  ),
  landmark: (
    <>
      <path d="M3 21h18" />
      <path d="M12 3 3.5 9h17z" />
      <path d="M5.5 9v9M10 9v9M14 9v9M18.5 9v9" />
      <path d="M4.5 18h15" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-7.5" />
      <path d="M12 13.5A5.5 5.5 0 0 0 6.5 8H4a5.5 5.5 0 0 0 5.5 5.5z" />
      <path d="M12 11a5.5 5.5 0 0 1 5.5-5.5H20A5.5 5.5 0 0 1 14.5 11z" />
    </>
  )
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export default function Icon({ name, size = 20, strokeWidth = 1.8, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
