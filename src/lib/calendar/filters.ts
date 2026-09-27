import type { Category, Occurrence } from "./types";

/** null in any field means "no filter" (everything shown). */
export type CalendarFilters = {
  calendars: string[] | null;
  people: string[] | null;
  categories: (Category | "none")[] | null;
};

export const NO_FILTERS: CalendarFilters = { calendars: null, people: null, categories: null };

/**
 * Filtering runs on the already-loaded range, so toggling a filter is
 * instant and never refetches. A person matches events they take part in
 * or created.
 */
export function applyFilters(occurrences: Occurrence[], f: CalendarFilters): Occurrence[] {
  return occurrences.filter(({ event }) => {
    if (f.calendars && !f.calendars.includes(event.calendarId)) return false;
    if (f.categories && !f.categories.includes(event.category ?? "none")) return false;
    if (f.people) {
      const involved = [event.createdBy, ...event.participants];
      if (!involved.some((id) => f.people!.includes(id))) return false;
    }
    return true;
  });
}

/** Toggles one value in a filter list; an empty or complete selection collapses back to "all". */
export function toggleFilter<T>(current: T[] | null, value: T, allValues: T[]): T[] | null {
  const base = current ?? allValues;
  const next = base.includes(value) ? base.filter((v) => v !== value) : [...base, value];
  return next.length === allValues.length ? null : next;
}
