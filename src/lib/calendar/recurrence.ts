import { addDays as addDaysZ, addMonths as addMonthsZ, addWeeks, addYears } from "date-fns";
import type { TZDate } from "@date-fns/tz";
import { addDays, daysBetween, instantToPlainDate, startOfDayInstant, toZoned } from "./dates";
import { FREQUENCIES, type CalendarEvent, type Occurrence, type Recurrence } from "./types";

/**
 * Recurring events are one row with an RRULE-style rule; occurrences are
 * generated per requested range, never stored. Supported subset:
 * FREQ=DAILY|WEEKLY|MONTHLY|YEARLY, INTERVAL, UNTIL (a date). Cancelling a
 * single occurrence adds its start to the event's exdates. Editing a single
 * occurrence (an override row) is not supported yet: edits apply to the series.
 *
 * Occurrence n is computed from the series start (start + n·interval), not
 * from the previous one, in the event's own timezone: 09:00 stays 09:00
 * across DST, and a monthly event on the 31st lands on the last day of
 * shorter months without drifting afterwards.
 */

export function serializeRule(r: Recurrence): string {
  const until = r.until ? `;UNTIL=${r.until.replaceAll("-", "")}` : "";
  return `FREQ=${r.freq};INTERVAL=${r.interval}${until}`;
}

export function parseRule(rule: string | null): Recurrence | null {
  if (!rule) return null;
  const fields = new Map(
    rule.split(";").map((part) => part.split("=") as [string, string | undefined]),
  );
  const freq = fields.get("FREQ");
  const interval = Number(fields.get("INTERVAL") ?? "1");
  const until = fields.get("UNTIL");
  if (!FREQUENCIES.includes(freq as Recurrence["freq"])) return null;
  if (!Number.isInteger(interval) || interval < 1) return null;
  if (until !== undefined && !/^\d{8}$/.test(until)) return null;
  return {
    freq: freq as Recurrence["freq"],
    interval,
    until: until ? `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}` : null,
  };
}

/** Exclusive bound on occurrence starts: the start of the day after UNTIL. */
export function recurrenceEnd(r: Recurrence, tz: string): Date | null {
  return r.until ? startOfDayInstant(addDays(r.until, 1), tz) : null;
}

function step(start: TZDate, r: Recurrence, n: number): TZDate {
  const k = n * r.interval;
  switch (r.freq) {
    case "DAILY":
      return addDaysZ(start, k);
    case "WEEKLY":
      return addWeeks(start, k);
    case "MONTHLY":
      return addMonthsZ(start, k);
    case "YEARLY":
      return addYears(start, k);
  }
}

const MAX_OCCURRENCES = 500;
const MAX_STEPS = 50_000;

/** Occurrences of `event` that overlap [from, to). */
export function expandOccurrences(event: CalendarEvent, from: Date, to: Date): Occurrence[] {
  const start = Date.parse(event.startAt);
  const end = Date.parse(event.endAt);

  if (!event.recurrence) {
    return end > +from && start < +to
      ? [{ key: event.id, event, start: event.startAt, end: event.endAt }]
      : [];
  }

  const r = event.recurrence;
  const tz = event.timezone;
  const zonedStart = toZoned(event.startAt, tz);
  const until = recurrenceEnd(r, tz);
  const excluded = new Set(event.exdates.map((d) => Date.parse(d)));
  const durationMs = end - start;
  const allDayLength = event.allDay
    ? daysBetween(instantToPlainDate(event.startAt, tz), instantToPlainDate(event.endAt, tz))
    : 0;

  // Daily/weekly steps are near-fixed length: jump close to the range instead
  // of walking years of past occurrences (2 steps of slack absorb DST hours).
  let n = 0;
  if (r.freq === "DAILY" || r.freq === "WEEKLY") {
    const stepMs = (r.freq === "DAILY" ? 1 : 7) * 86_400_000 * r.interval;
    n = Math.max(0, Math.floor((+from - end) / stepMs) - 2);
  }

  const out: Occurrence[] = [];
  for (let steps = 0; steps < MAX_STEPS && out.length < MAX_OCCURRENCES; steps++, n++) {
    const occStart = step(zonedStart, r, n);
    if (+occStart >= +to || (until && +occStart >= +until)) break;
    const occEnd = event.allDay
      ? startOfDayInstant(addDays(instantToPlainDate(occStart, tz), allDayLength), tz)
      : new Date(+occStart + durationMs);
    if (+occEnd > +from && !excluded.has(+occStart)) {
      const startIso = new Date(+occStart).toISOString();
      out.push({
        key: `${event.id}:${startIso}`,
        event,
        start: startIso,
        end: occEnd.toISOString(),
      });
    }
  }
  return out;
}
