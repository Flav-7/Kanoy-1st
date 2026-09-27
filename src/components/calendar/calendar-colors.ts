import {
  Camera,
  Circle,
  Handshake,
  PencilRuler,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { CalendarColor, Category } from "@/lib/calendar/types";

/**
 * Colour rule: an activity is coloured by its type, which follows the
 * project stage (proposal red → production yellow → closing green; photo
 * visits white). "Other" and untyped activities take their area's colour.
 * All swatches are bright enough to read as a stripe/dot on the dark studio
 * background; event text stays the high-contrast foreground colour.
 */
export const CALENDAR_SWATCHES: Record<CalendarColor, string> = {
  cyan: "#22d3ee",
  mint: "#34d399",
  violet: "#a78bfa",
  amber: "#fbbf24",
  rose: "#fb7185",
  blue: "#60a5fa",
};

export const CATEGORY_SWATCHES: Record<Category, string | null> = {
  proposal_meeting: "#f87171",
  production_meeting: "#facc15",
  closing_meeting: "#4ade80",
  photo_visit: "#f5f5f5",
  other: null,
};

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  proposal_meeting: Presentation,
  production_meeting: PencilRuler,
  closing_meeting: Handshake,
  photo_visit: Camera,
  other: Circle,
};

export function swatch(color: CalendarColor | undefined): string {
  return CALENDAR_SWATCHES[color ?? "cyan"];
}

/** The colour an activity is drawn in: its type's, else its area's. */
export function eventSwatch(
  event: { category: Category | null },
  areaColor: CalendarColor | undefined,
): string {
  return (event.category && CATEGORY_SWATCHES[event.category]) || swatch(areaColor);
}

/** Inline style for an event chip: tinted background, solid left stripe. */
export function chipStyle(color: string): CSSProperties {
  return {
    background: `color-mix(in oklab, ${color} 18%, transparent)`,
    borderLeft: `3px solid ${color}`,
  };
}
