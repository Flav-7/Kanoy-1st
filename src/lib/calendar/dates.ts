import { TZDate } from "@date-fns/tz";
import { format, type Locale } from "date-fns";

/**
 * Date logic for the calendar. Two kinds of values, never mixed:
 *  - instants (Date / UTC ISO strings): a moment in time, as stored;
 *  - plain dates ("2026-09-27") and wall times ("2026-09-27T14:00"): a
 *    calendar day / clock reading that only means something with a timezone.
 * Plain-date arithmetic runs on UTC-midnight Dates, which have no DST, so
 * adding days/months is exact. Conversions to instants go through TZDate,
 * which resolves DST gaps/overlaps for the given zone.
 */

export type PlainDate = string;
export type View = "month" | "week" | "day" | "agenda";

export const VIEWS: View[] = ["month", "week", "day", "agenda"];

function parts(date: PlainDate): [number, number, number] {
  const [y, m, d] = date.split("-").map(Number);
  return [y!, m!, d!];
}

function fromUtc(date: Date): PlainDate {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: PlainDate, n: number): PlainDate {
  const [y, m, d] = parts(date);
  return fromUtc(new Date(Date.UTC(y, m - 1, d + n)));
}

/** Same day-of-month n months later, clamped to that month's last day. */
export function addMonths(date: PlainDate, n: number): PlainDate {
  const [y, m, d] = parts(date);
  const lastDay = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  return fromUtc(new Date(Date.UTC(y, m - 1 + n, Math.min(d, lastDay))));
}

/** 0 = Monday … 6 = Sunday (the week starts on Monday, as in Portugal). */
export function weekdayIndex(date: PlainDate): number {
  const [y, m, d] = parts(date);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function startOfWeek(date: PlainDate): PlainDate {
  return addDays(date, -weekdayIndex(date));
}

export function startOfMonth(date: PlainDate): PlainDate {
  return `${date.slice(0, 7)}-01`;
}

export function daysBetween(from: PlainDate, to: PlainDate): number {
  const [y1, m1, d1] = parts(from);
  const [y2, m2, d2] = parts(to);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

// ── Instants ↔ calendar days / wall times ────────────────────────────────

/** The instant a calendar day starts in `tz`. */
export function startOfDayInstant(date: PlainDate, tz: string): Date {
  const [y, m, d] = parts(date);
  return new Date(+new TZDate(y, m - 1, d, 0, 0, tz));
}

/** "2026-09-27T14:00" in `tz` → instant. Times inside a DST gap move forward. */
export function wallTimeToInstant(wallTime: string, tz: string): Date {
  const [date, time] = wallTime.split("T") as [string, string];
  const [y, m, d] = parts(date);
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  return new Date(+new TZDate(y, m - 1, d, hh, mm, tz));
}

export function toZoned(instant: Date | string, tz: string): TZDate {
  return new TZDate(typeof instant === "string" ? Date.parse(instant) : +instant, tz);
}

export function instantToPlainDate(instant: Date | string, tz: string): PlainDate {
  return format(toZoned(instant, tz), "yyyy-MM-dd");
}

export function instantToWallTime(instant: Date | string, tz: string): string {
  return format(toZoned(instant, tz), "yyyy-MM-dd'T'HH:mm");
}

/** Formats a calendar day (e.g. "segunda, 28 set") without any timezone shifting it. */
export function formatPlainDate(date: PlainDate, pattern: string, locale: Locale): string {
  const [y, m, d] = parts(date);
  return format(new TZDate(y, m - 1, d, "UTC"), pattern, { locale });
}

export function todayIn(tz: string): PlainDate {
  return instantToPlainDate(new Date(), tz);
}

export function viewerTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Lisbon";
}

// ── Event times ──────────────────────────────────────────────────────────

/**
 * Absolute bounds of an event from the form's values. All-day events span
 * whole days of their own timezone: `end` is the last day, inclusive, so
 * the stored end is the start of the following day.
 */
export function eventBounds(input: {
  allDay: boolean;
  start: string;
  end: string;
  timezone: string;
}): { startAt: Date; endAt: Date } {
  if (input.allDay) {
    return {
      startAt: startOfDayInstant(input.start, input.timezone),
      endAt: startOfDayInstant(addDays(input.end, 1), input.timezone),
    };
  }
  return {
    startAt: wallTimeToInstant(input.start, input.timezone),
    endAt: wallTimeToInstant(input.end, input.timezone),
  };
}

/** The inverse of eventBounds(): what the edit form shows for a stored event. */
export function eventFormTimes(event: {
  allDay: boolean;
  startAt: string;
  endAt: string;
  timezone: string;
}): { start: string; end: string } {
  if (event.allDay) {
    return {
      start: instantToPlainDate(event.startAt, event.timezone),
      end: addDays(instantToPlainDate(event.endAt, event.timezone), -1),
    };
  }
  return {
    start: instantToWallTime(event.startAt, event.timezone),
    end: instantToWallTime(event.endAt, event.timezone),
  };
}

/**
 * First and last calendar day (inclusive) an occurrence covers for the viewer.
 * All-day events keep the days they were planned on, whatever the viewer's
 * zone; timed events are shown on the viewer's own clock.
 */
export function occurrenceDays(
  occ: { start: string; end: string },
  allDay: boolean,
  eventTz: string,
  viewerTz: string,
): { first: PlainDate; last: PlainDate } {
  if (allDay) {
    return {
      first: instantToPlainDate(occ.start, eventTz),
      last: addDays(instantToPlainDate(occ.end, eventTz), -1),
    };
  }
  return {
    first: instantToPlainDate(occ.start, viewerTz),
    // end is exclusive: an event ending exactly at midnight doesn't touch the next day.
    last: instantToPlainDate(new Date(Date.parse(occ.end) - 1), viewerTz),
  };
}

// ── Views ────────────────────────────────────────────────────────────────

/** The days a view shows around `anchor`. Month is always 6 full weeks. */
export function viewDays(view: View, anchor: PlainDate): PlainDate[] {
  const range = (first: PlainDate, count: number) =>
    Array.from({ length: count }, (_, i) => addDays(first, i));
  switch (view) {
    case "month":
      return range(startOfWeek(startOfMonth(anchor)), 42);
    case "week":
      return range(startOfWeek(anchor), 7);
    case "day":
      return [anchor];
    case "agenda": {
      const first = startOfMonth(anchor);
      return range(first, daysBetween(first, addMonths(first, 1)));
    }
  }
}

/**
 * The instant range to fetch for a view. Padded by a day on each side so
 * all-day events planned in another timezone, whose days can sit a few hours
 * off the viewer's midnight, are never cut off at the edges.
 */
export function viewFetchRange(
  view: View,
  anchor: PlainDate,
  tz: string,
): { from: Date; to: Date } {
  const days = viewDays(view, anchor);
  return {
    from: startOfDayInstant(addDays(days[0]!, -1), tz),
    to: startOfDayInstant(addDays(days[days.length - 1]!, 2), tz),
  };
}

export function shiftAnchor(view: View, anchor: PlainDate, direction: 1 | -1): PlainDate {
  switch (view) {
    case "month":
    case "agenda":
      return addMonths(anchor, direction);
    case "week":
      return addDays(anchor, 7 * direction);
    case "day":
      return addDays(anchor, direction);
  }
}

// ── Time grid (week/day views) ───────────────────────────────────────────

export const MINUTES_PER_DAY = 24 * 60;

function wallMinutes(instant: Date, tz: string): number {
  const z = toZoned(instant, tz);
  return z.getHours() * 60 + z.getMinutes();
}

/**
 * The part of [start, end) that falls on `day` for the viewer, as minutes
 * from the top of that day's column (0–1440). Null if it misses the day.
 */
export function segmentOnDay(
  occ: { start: string; end: string },
  day: PlainDate,
  tz: string,
): { top: number; bottom: number } | null {
  const dayStart = startOfDayInstant(day, tz);
  const dayEnd = startOfDayInstant(addDays(day, 1), tz);
  const start = new Date(occ.start);
  const end = new Date(occ.end);
  if (end <= dayStart || start >= dayEnd) return null;
  const top = start <= dayStart ? 0 : wallMinutes(start, tz);
  const bottom = end >= dayEnd ? MINUTES_PER_DAY : wallMinutes(end, tz);
  // Only on a DST fall-back day can the wall clock run backwards inside one event.
  return { top, bottom: Math.max(bottom, top + 1) };
}

/**
 * Places overlapping items side by side: each gets a column and the number
 * of columns in its overlap group, so its width is 1/cols of the day.
 */
export function layoutColumns<T extends { top: number; bottom: number }>(
  items: T[],
): (T & { col: number; cols: number })[] {
  const sorted = [...items].sort((a, b) => a.top - b.top || b.bottom - a.bottom);
  const result: (T & { col: number; cols: number })[] = [];
  let group: (T & { col: number; cols: number })[] = [];
  let groupEnd = -1;

  const closeGroup = () => {
    const cols = Math.max(1, ...group.map((g) => g.col + 1));
    for (const g of group) g.cols = cols;
    result.push(...group);
    group = [];
  };

  for (const item of sorted) {
    if (item.top >= groupEnd && group.length) closeGroup();
    const taken = new Set(group.filter((g) => g.bottom > item.top).map((g) => g.col));
    let col = 0;
    while (taken.has(col)) col++;
    group.push({ ...item, col, cols: 1 });
    groupEnd = Math.max(groupEnd, item.bottom);
  }
  if (group.length) closeGroup();
  return result;
}
