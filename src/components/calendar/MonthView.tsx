import { useMemo } from "react";
import { Plus } from "lucide-react";
import { formatPlainDate, type PlainDate } from "@/lib/calendar/dates";
import { occurrencesByDay } from "@/lib/calendar/grouping";
import type { Occurrence } from "@/lib/calendar/types";
import { eventSwatch } from "./calendar-colors";
import { useCalendarUi } from "./CalendarContext";
import { EventChip } from "./EventCard";

const MAX_CHIPS = 3;

/**
 * Six-week month grid. On desktop each day lists its first few events; on
 * mobile (`compact`) days show coloured dots and tapping one selects it —
 * the page lists that day's events underneath, so nothing is squeezed into
 * unreadable 45-px cells.
 */
export function MonthView({
  days,
  anchor,
  occurrences,
  compact,
  selectedDay,
  onSelectDay,
}: {
  days: PlainDate[];
  anchor: PlainDate;
  occurrences: Occurrence[];
  compact: boolean;
  selectedDay: PlainDate;
  onSelectDay: (day: PlainDate) => void;
}) {
  const ui = useCalendarUi();
  const byDay = useMemo(
    () => occurrencesByDay(occurrences, days, ui.tz),
    [occurrences, days, ui.tz],
  );
  const month = anchor.slice(0, 7);

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b border-white/10" aria-hidden>
        {days.slice(0, 7).map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-studio-muted md:text-left"
          >
            {formatPlainDate(d, compact ? "EEEEE" : "EEE", ui.locale)}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const list = byDay.get(day) ?? [];
          const inMonth = day.startsWith(month);
          const isToday = day === ui.today;
          const fullDate = formatPlainDate(day, "PPPP", ui.locale);
          const dayNumber = (
            <span
              className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs tabular-nums ${
                isToday
                  ? "bg-accent font-semibold text-ink"
                  : inMonth
                    ? "text-studio-foreground"
                    : "text-studio-muted/50"
              }`}
            >
              {Number(day.slice(8))}
            </span>
          );

          if (compact) {
            const selected = day === selectedDay;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelectDay(day)}
                aria-pressed={selected}
                aria-label={
                  list.length ? `${fullDate}, ${ui.copy.eventsCount(list.length)}` : fullDate
                }
                className={`flex min-h-14 flex-col items-center gap-1.5 border-b border-r border-white/[0.06] pt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                  selected ? "bg-accent/15 ring-2 ring-inset ring-accent" : ""
                } ${inMonth ? "" : "bg-black/20"}`}
              >
                {dayNumber}
                <span className="flex flex-wrap justify-center gap-1 px-0.5" aria-hidden>
                  {list.slice(0, 4).map((o) => (
                    <span
                      key={o.key}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background: eventSwatch(
                          o.event,
                          ui.calendarsById.get(o.event.calendarId)?.color,
                        ),
                      }}
                    />
                  ))}
                </span>
              </button>
            );
          }

          const hidden = list.length - MAX_CHIPS;
          return (
            <div
              key={day}
              onClick={() => ui.canCreate && ui.openCreate({ date: day })}
              className={`group relative flex min-h-24 min-w-0 flex-col gap-1 border-b border-r border-white/[0.06] p-1.5 ${
                inMonth ? "" : "bg-black/20"
              } ${ui.canCreate ? "cursor-pointer" : ""} hover:bg-white/[0.03]`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    ui.showDay(day);
                  }}
                  aria-label={fullDate}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {dayNumber}
                </button>
                {ui.canCreate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      ui.openCreate({ date: day });
                    }}
                    aria-label={`${ui.copy.newEvent}: ${fullDate}`}
                    className="rounded p-0.5 text-studio-muted opacity-0 transition-opacity hover:text-accent focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent group-hover:opacity-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {list.slice(0, MAX_CHIPS).map((o) => (
                <EventChip key={o.key} occ={o} />
              ))}
              {hidden > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    ui.showDay(day);
                  }}
                  className="self-start rounded px-1.5 text-[11px] text-studio-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {ui.copy.more(hidden)}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
