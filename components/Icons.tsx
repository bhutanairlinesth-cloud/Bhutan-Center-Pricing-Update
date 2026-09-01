import type { ReactNode } from "react";

export function Icon({ name }: { name: "plane" | "visa" | "hotel" | "guide" | "car" | "route" | "shield" | "calendar" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, ReactNode> = {
    plane: <><path {...common} d="m3 11 18-7-7 18-3-8-8-3Z"/><path {...common} d="m11 14 10-10M7 16l-2 5 5-2"/></>,
    visa: <><rect {...common} x="4" y="3" width="16" height="18" rx="2"/><path {...common} d="M8 8h8M8 12h5M8 16h7"/></>,
    hotel: <><path {...common} d="M4 21V7h16v14M8 7V3h8v4M8 12h2M14 12h2M8 16h2M14 16h2"/></>,
    guide: <><circle {...common} cx="12" cy="7" r="3"/><path {...common} d="M6 21v-3a6 6 0 0 1 12 0v3M8 14l4 3 4-3"/></>,
    car: <><path {...common} d="m5 16 2-6h10l2 6M3 16h18v4H3z"/><circle {...common} cx="7" cy="20" r="1"/><circle {...common} cx="17" cy="20" r="1"/></>,
    route: <><circle {...common} cx="6" cy="18" r="2"/><circle {...common} cx="18" cy="6" r="2"/><path {...common} d="M7.5 16.5 16.5 7.5M9 6h4M11 4v4"/></>,
    shield: <><path {...common} d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/><path {...common} d="m9 12 2 2 4-5"/></>,
    calendar: <><rect {...common} x="3" y="5" width="18" height="16" rx="2"/><path {...common} d="M7 3v4M17 3v4M3 10h18"/></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}
