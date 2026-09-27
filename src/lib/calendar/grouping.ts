import { addDays, occurrenceDays, type PlainDate } from "./dates";
import type { Occurrence } from "./types";

/**
 * Buckets occurrences into the days they touch (multi-day events appear on
 * every day they cover). Within a day: all-day first, then longer first, then
 * by start time, so spanning events line up at the top of month cells.
 */
export function occurrencesByDay(
  occurrences: Occurrence[],
  days: PlainDate[],
  viewerTz: string,
): Map<PlainDate, Occurrence[]> {
  const map = new Map<PlainDate, Occurrence[]>(days.map((d) => [d, []]));
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) return map;

  for (const occ of occurrences) {
    const span = occurrenceDays(occ, occ.event.allDay, occ.event.timezone, viewerTz);
    let day = span.first < first ? first : span.first;
    const end = span.last > last ? last : span.last;
    while (day <= end) {
      map.get(day)?.push(occ);
      day = addDays(day, 1);
    }
  }

  const duration = (o: Occurrence) => Date.parse(o.end) - Date.parse(o.start);
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        Number(b.event.allDay) - Number(a.event.allDay) ||
        (a.event.allDay ? duration(b) - duration(a) : 0) ||
        a.start.localeCompare(b.start) ||
        a.event.title.localeCompare(b.event.title),
    );
  }
  return map;
}
