import { Building2, Circle, Flag, PackageCheck, Phone, Users, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import type { CalendarColor, Category } from "@/lib/calendar/types";

/**
 * Colour identifies the calendar an event belongs to — the one consistent
 * colour rule. Categories get an icon, never a colour of their own. Each
 * swatch is bright enough to read as a stripe/dot on the dark studio
 * background; event text itself stays the high-contrast foreground colour.
 */
export const CALENDAR_SWATCHES: Record<CalendarColor, string> = {
  cyan: "#22d3ee",
  mint: "#34d399",
  violet: "#a78bfa",
  amber: "#fbbf24",
  rose: "#fb7185",
  blue: "#60a5fa",
};

export function swatch(color: CalendarColor | undefined): string {
  return CALENDAR_SWATCHES[color ?? "cyan"];
}

/** Inline style for an event chip: tinted background, solid left stripe. */
export function chipStyle(color: CalendarColor | undefined): CSSProperties {
  const c = swatch(color);
  return {
    background: `color-mix(in oklab, ${c} 18%, transparent)`,
    borderLeft: `3px solid ${c}`,
  };
}

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  meeting: Users,
  call: Phone,
  delivery: PackageCheck,
  deadline: Flag,
  internal: Building2,
  other: Circle,
};
