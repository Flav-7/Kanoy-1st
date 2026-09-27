import { createContext, useContext } from "react";
import type { Locale } from "date-fns";
import type { CALENDAR_COPY } from "./calendar-i18n";
import type { PlainDate } from "@/lib/calendar/dates";
import type { CalendarSummary, Occurrence, TeamMember } from "@/lib/calendar/types";

export type CreateRequest = { date: PlainDate; startMinutes?: number; allDay?: boolean };

/** What every calendar view needs; provided once by CalendarPage. */
export type CalendarUi = {
  copy: (typeof CALENDAR_COPY)["pt"];
  locale: Locale;
  /** The viewer's timezone: timed events are shown on this clock. */
  tz: string;
  today: PlainDate;
  calendarsById: Map<string, CalendarSummary>;
  teamById: Map<string, TeamMember>;
  canCreate: boolean;
  openEvent: (occurrence: Occurrence) => void;
  openCreate: (request: CreateRequest) => void;
  showDay: (date: PlainDate) => void;
};

export const CalendarUiContext = createContext<CalendarUi | null>(null);

export function useCalendarUi(): CalendarUi {
  const ctx = useContext(CalendarUiContext);
  if (!ctx) throw new Error("useCalendarUi must be used inside CalendarPage");
  return ctx;
}
