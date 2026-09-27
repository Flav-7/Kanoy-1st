import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  MINUTES_PER_DAY,
  formatPlainDate,
  layoutColumns,
  segmentOnDay,
  toZoned,
  type PlainDate,
} from "@/lib/calendar/dates";
import { occurrencesByDay } from "@/lib/calendar/grouping";
import type { Occurrence } from "@/lib/calendar/types";
import { useCalendarUi } from "./CalendarContext";
import { EventBlock, EventChip } from "./EventCard";

const HOUR_PX = 48;
const SLOT_MINUTES = 30;
const SCROLL_TO_HOUR = 7.5;

function useNowMinutes(tz: string): number {
  const read = () => {
    const z = toZoned(new Date(), tz);
    return z.getHours() * 60 + z.getMinutes();
  };
  const [minutes, setMinutes] = useState(read);
  useEffect(() => {
    const id = setInterval(() => setMinutes(read()), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tz]);
  return minutes;
}

/**
 * Week and day views: an all-day strip on top, then a 24-hour grid where
 * timed events are placed by their start/end on the viewer's clock, side by
 * side when they overlap. Clicking an empty slot starts a new event there.
 */
export function TimeGridView({
  days,
  occurrences,
}: {
  days: PlainDate[];
  occurrences: Occurrence[];
}) {
  const ui = useCalendarUi();
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = useNowMinutes(ui.tz);

  const byDay = useMemo(
    () => occurrencesByDay(occurrences, days, ui.tz),
    [occurrences, days, ui.tz],
  );

  const columns = useMemo(
    () =>
      days.map((day) => {
        const list = byDay.get(day) ?? [];
        const allDay = list.filter((o) => o.event.allDay);
        const timed = layoutColumns(
          list
            .filter((o) => !o.event.allDay)
            .flatMap((occ) => {
              const seg = segmentOnDay(occ, day, ui.tz);
              return seg ? [{ occ, ...seg }] : [];
            }),
        );
        return { day, allDay, timed };
      }),
    [byDay, days, ui.tz],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: SCROLL_TO_HOUR * HOUR_PX });
  }, []);

  const hasAllDay = columns.some((c) => c.allDay.length > 0);
  const gridCols = { gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` };

  const createAt = (day: PlainDate) => (e: MouseEvent<HTMLDivElement>) => {
    if (!ui.canCreate) return;
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const minutes = Math.floor((y / HOUR_PX) * (60 / SLOT_MINUTES)) * SLOT_MINUTES;
    ui.openCreate({
      date: day,
      startMinutes: Math.min(Math.max(minutes, 0), MINUTES_PER_DAY - 60),
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Day headers */}
      <div className="grid border-b border-white/10" style={gridCols}>
        <div />
        {days.map((day) => {
          const isToday = day === ui.today;
          return (
            <button
              key={day}
              type="button"
              onClick={() => ui.showDay(day)}
              disabled={days.length === 1}
              aria-label={formatPlainDate(day, "PPPP", ui.locale)}
              className="flex flex-col items-center gap-0.5 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-studio-muted">
                {formatPlainDate(day, "EEE", ui.locale)}
              </span>
              <span
                className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm tabular-nums ${
                  isToday ? "bg-accent font-semibold text-ink" : "text-studio-foreground"
                }`}
              >
                {Number(day.slice(8))}
              </span>
            </button>
          );
        })}
      </div>

      {/* All-day strip */}
      {hasAllDay && (
        <div className="grid border-b border-white/10" style={gridCols}>
          <div className="px-1 py-1.5 text-right text-[10px] leading-tight text-studio-muted">
            {ui.copy.allDay}
          </div>
          {columns.map(({ day, allDay }) => (
            <div key={day} className="flex min-w-0 flex-col gap-1 border-l border-white/[0.06] p-1">
              {allDay.map((o) => (
                <EventChip key={o.key} occ={o} showTime={false} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Hours */}
      <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="relative grid" style={{ ...gridCols, height: 24 * HOUR_PX }}>
          <div className="relative" aria-hidden>
            {Array.from({ length: 23 }, (_, i) => (
              <span
                key={i}
                className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-studio-muted"
                style={{ top: (i + 1) * HOUR_PX }}
              >
                {String(i + 1).padStart(2, "0")}:00
              </span>
            ))}
          </div>
          {columns.map(({ day, timed }) => (
            <div
              key={day}
              onClick={createAt(day)}
              className={`relative border-l border-white/[0.06] ${ui.canCreate ? "cursor-pointer" : ""}`}
              style={{
                backgroundImage: `repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0 1px, transparent 1px ${HOUR_PX}px)`,
              }}
            >
              {timed.map(({ occ, top, bottom, col, cols }) => {
                const height = Math.max(((bottom - top) / 60) * HOUR_PX, 20);
                return (
                  <EventBlock
                    key={`${occ.key}:${day}`}
                    occ={occ}
                    compact={height < 44}
                    style={{
                      top: (top / 60) * HOUR_PX + 1,
                      height: height - 2,
                      left: `calc(${(col / cols) * 100}% + 2px)`,
                      width: `calc(${100 / cols}% - 4px)`,
                    }}
                  />
                );
              })}
              {day === ui.today && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 z-10 h-px bg-accent"
                  style={{ top: (now / 60) * HOUR_PX, boxShadow: "0 0 6px var(--accent)" }}
                >
                  <span className="absolute -left-1 -top-[3px] h-[7px] w-[7px] rounded-full bg-accent" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
