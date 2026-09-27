import type { CSSProperties } from "react";
import { format } from "date-fns";
import { Repeat, UserRound } from "lucide-react";
import { toZoned } from "@/lib/calendar/dates";
import type { Occurrence } from "@/lib/calendar/types";
import { CATEGORY_ICONS, chipStyle, eventSwatch } from "./calendar-colors";
import { useCalendarUi, type CalendarUi } from "./CalendarContext";

export function formatTime(iso: string, tz: string): string {
  return format(toZoned(iso, tz), "HH:mm");
}

function timeLabel(occ: Occurrence, ui: CalendarUi): string {
  if (occ.event.allDay) return ui.copy.allDay;
  return `${formatTime(occ.start, ui.tz)} – ${formatTime(occ.end, ui.tz)}`;
}

/** Full description for screen readers; the visible card shows only the essentials. */
function accessibleLabel(occ: Occurrence, ui: CalendarUi): string {
  const cal = ui.calendarsById.get(occ.event.calendarId)?.name;
  const day = format(toZoned(occ.start, occ.event.allDay ? occ.event.timezone : ui.tz), "PPPP", {
    locale: ui.locale,
  });
  const status = occ.event.status === "confirmed" ? null : ui.copy.statusNames[occ.event.status];
  return [occ.event.title, day, timeLabel(occ, ui), cal, status].filter(Boolean).join(", ");
}

function statusStyle(occ: Occurrence, base: CSSProperties): CSSProperties {
  return occ.event.status === "tentative" ? { ...base, borderLeftStyle: "dashed" } : base;
}

function statusClass(occ: Occurrence): string {
  if (occ.event.status === "cancelled") return "line-through opacity-55";
  if (occ.event.status === "tentative") return "italic";
  return "";
}

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

/** One-line chip for month cells and the all-day row. */
export function EventChip({ occ, showTime = true }: { occ: Occurrence; showTime?: boolean }) {
  const ui = useCalendarUi();
  const color = eventSwatch(occ.event, ui.calendarsById.get(occ.event.calendarId)?.color);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        ui.openEvent(occ);
      }}
      aria-label={accessibleLabel(occ, ui)}
      style={statusStyle(occ, chipStyle(color))}
      className={`flex w-full min-w-0 items-center gap-1.5 rounded-[5px] px-1.5 py-0.5 text-left text-[11px] leading-snug text-studio-foreground transition-[filter] hover:brightness-125 ${focusRing} ${statusClass(occ)}`}
    >
      {showTime && !occ.event.allDay && (
        <span className="shrink-0 tabular-nums text-studio-muted">
          {formatTime(occ.start, ui.tz)}
        </span>
      )}
      <span className="truncate font-medium">{occ.event.title}</span>
    </button>
  );
}

/** Positioned block in the week/day time grid. */
export function EventBlock({
  occ,
  style,
  compact,
}: {
  occ: Occurrence;
  style: CSSProperties;
  compact: boolean;
}) {
  const ui = useCalendarUi();
  const color = eventSwatch(occ.event, ui.calendarsById.get(occ.event.calendarId)?.color);
  const count = occ.event.participants.length;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        ui.openEvent(occ);
      }}
      aria-label={accessibleLabel(occ, ui)}
      style={statusStyle(occ, { ...chipStyle(color), ...style })}
      className={`absolute overflow-hidden rounded-md px-2 py-1 text-left text-[11px] leading-tight text-studio-foreground shadow-sm backdrop-blur-sm transition-[filter] hover:brightness-125 ${focusRing} ${statusClass(occ)}`}
    >
      <span className="flex items-baseline gap-1.5">
        <span className="shrink-0 tabular-nums text-studio-muted">
          {formatTime(occ.start, ui.tz)}
        </span>
        <span className="truncate font-medium">{occ.event.title}</span>
      </span>
      {!compact && count > 0 && (
        <span className="mt-0.5 flex items-center gap-1 text-studio-muted">
          <UserRound className="h-3 w-3" aria-hidden />
          {ui.copy.participantsCount(count)}
        </span>
      )}
    </button>
  );
}

/** Row in the agenda list: time, calendar dot, title, category, people. */
export function EventRow({ occ }: { occ: Occurrence }) {
  const ui = useCalendarUi();
  const calendar = ui.calendarsById.get(occ.event.calendarId);
  const Icon = occ.event.category ? CATEGORY_ICONS[occ.event.category] : null;
  const count = occ.event.participants.length;
  return (
    <button
      type="button"
      onClick={() => ui.openEvent(occ)}
      aria-label={accessibleLabel(occ, ui)}
      className={`group flex w-full items-start gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/[0.06] ${focusRing}`}
    >
      <span className="w-24 shrink-0 pt-0.5 text-xs tabular-nums text-studio-muted">
        {timeLabel(occ, ui)}
      </span>
      <span
        aria-hidden
        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: eventSwatch(occ.event, calendar?.color) }}
      />
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm font-medium text-studio-foreground ${statusClass(occ)}`}
        >
          {occ.event.title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-studio-muted">
          {calendar && <span>{calendar.name}</span>}
          {Icon && occ.event.category && (
            <span className="flex items-center gap-1">
              <Icon className="h-3 w-3" aria-hidden />
              {ui.copy.categoryNames[occ.event.category]}
            </span>
          )}
          {count > 0 && (
            <span className="flex items-center gap-1">
              <UserRound className="h-3 w-3" aria-hidden />
              {ui.copy.participantsCount(count)}
            </span>
          )}
          {occ.event.recurrence && (
            <Repeat className="h-3 w-3" aria-label={ui.copy.details.repeats} />
          )}
          {occ.event.status !== "confirmed" && <span>{ui.copy.statusNames[occ.event.status]}</span>}
        </span>
      </span>
    </button>
  );
}
