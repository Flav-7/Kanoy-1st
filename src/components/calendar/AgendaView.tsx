import { useEffect, useMemo, useRef } from "react";
import { CalendarX2 } from "lucide-react";
import { formatPlainDate, type PlainDate } from "@/lib/calendar/dates";
import { occurrencesByDay } from "@/lib/calendar/grouping";
import type { Occurrence } from "@/lib/calendar/types";
import { useCalendarUi } from "./CalendarContext";
import { EventRow } from "./EventCard";

/** Chronological list, grouped by day; the default view on phones. */
export function AgendaView({
  days,
  occurrences,
}: {
  days: PlainDate[];
  occurrences: Occurrence[];
}) {
  const ui = useCalendarUi();
  const groups = useMemo(() => {
    const byDay = occurrencesByDay(occurrences, days, ui.tz);
    return days
      .map((day) => ({ day, list: byDay.get(day) ?? [] }))
      .filter((g) => g.list.length > 0);
  }, [occurrences, days, ui.tz]);

  // Open on today (or the next day with events) rather than the 1st of the month.
  const listRef = useRef<HTMLOListElement>(null);
  const focusDay = groups.find((g) => g.day >= ui.today)?.day;
  useEffect(() => {
    if (!focusDay || !listRef.current) return;
    listRef.current
      .querySelector<HTMLElement>(`[data-day="${focusDay}"]`)
      ?.scrollIntoView({ block: "start" });
    // Only when the month/filter set changes, not on every background refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days[0], focusDay]);

  if (groups.length === 0) return <EmptyState />;

  return (
    <ol ref={listRef} className="no-scrollbar h-full overflow-y-auto px-2 py-4 md:px-6">
      {groups.map(({ day, list }) => (
        <li key={day} data-day={day} className="mb-6">
          <h3 className="sticky top-0 z-10 flex items-baseline gap-3 bg-studio/95 px-3 py-2 backdrop-blur">
            <span
              className={`font-display text-2xl tabular-nums ${day === ui.today ? "text-accent" : "text-studio-foreground"}`}
            >
              {Number(day.slice(8))}
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-studio-muted">
              {formatPlainDate(day, "EEEE", ui.locale)}
            </span>
            {day === ui.today && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-accent">
                {ui.copy.today}
              </span>
            )}
          </h3>
          <ul>
            {list.map((o) => (
              <li key={o.key}>
                <EventRow occ={o} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export function EmptyState() {
  const ui = useCalendarUi();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <CalendarX2 className="h-8 w-8 text-studio-muted" aria-hidden />
      <p className="text-sm text-studio-foreground">{ui.copy.noEvents}</p>
      {ui.canCreate && <p className="text-xs text-studio-muted">{ui.copy.noEventsHint}</p>}
    </div>
  );
}
