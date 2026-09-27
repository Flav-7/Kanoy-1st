import { addDays, eventFormTimes } from "./dates";
import type { CalendarEvent, Category, EventInput, EventStatus, Frequency } from "./types";

/**
 * The event form's editable state, kept as the raw strings the inputs hold
 * (date/time inputs speak "YYYY-MM-DD" / "HH:mm"). toEventInput() turns it
 * into what the server validates; nothing here does timezone maths.
 */
export type EventFormState = {
  calendarId: string;
  title: string;
  description: string;
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
  category: Category | "";
  status: EventStatus;
  participants: string[];
  repeat: Frequency | "";
  interval: number;
  until: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "HH:mm" plus minutes, carrying into the next day(s). */
export function addMinutesToWallTime(
  date: string,
  time: string,
  minutes: number,
): { date: string; time: string } {
  const [h, m] = time.split(":").map(Number) as [number, number];
  const total = h * 60 + m + minutes;
  const dayShift = Math.floor(total / 1440);
  const rest = ((total % 1440) + 1440) % 1440;
  return { date: addDays(date, dayShift), time: `${pad(Math.floor(rest / 60))}:${pad(rest % 60)}` };
}

export function newEventForm(opts: {
  calendarId: string;
  timezone: string;
  date: string;
  /** Minutes from midnight; defaults to 09:00. */
  startMinutes?: number;
  allDay?: boolean;
}): EventFormState {
  const minutes = opts.startMinutes ?? 9 * 60;
  const startTime = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  const end = addMinutesToWallTime(opts.date, startTime, 60);
  return {
    calendarId: opts.calendarId,
    title: "",
    description: "",
    allDay: opts.allDay ?? false,
    startDate: opts.date,
    startTime,
    endDate: end.date,
    endTime: end.time,
    timezone: opts.timezone,
    category: "",
    status: "confirmed",
    participants: [],
    repeat: "",
    interval: 1,
    until: "",
  };
}

export function eventToForm(event: CalendarEvent): EventFormState {
  const { start, end } = eventFormTimes(event);
  const [startDate, startTime = "09:00"] = start.split("T") as [string, string?];
  const [endDate, endTime = "10:00"] = end.split("T") as [string, string?];
  return {
    calendarId: event.calendarId,
    title: event.title,
    description: event.description ?? "",
    allDay: event.allDay,
    startDate,
    startTime,
    endDate,
    endTime,
    timezone: event.timezone,
    category: event.category ?? "",
    status: event.status,
    participants: [...event.participants],
    repeat: event.recurrence?.freq ?? "",
    interval: event.recurrence?.interval ?? 1,
    until: event.recurrence?.until ?? "",
  };
}

export function toEventInput(f: EventFormState): EventInput {
  return {
    calendarId: f.calendarId,
    title: f.title.trim(),
    description: f.description.trim(),
    allDay: f.allDay,
    timezone: f.timezone,
    start: f.allDay ? f.startDate : `${f.startDate}T${f.startTime}`,
    end: f.allDay ? f.endDate : `${f.endDate}T${f.endTime}`,
    category: f.category || null,
    status: f.status,
    participants: f.participants,
    recurrence: f.repeat ? { freq: f.repeat, interval: f.interval, until: f.until || null } : null,
  };
}

/** Same event with one field changed, for one-click actions (cancel/restore). */
export function eventToInput(event: CalendarEvent, patch: Partial<EventInput> = {}): EventInput {
  return { ...toEventInput(eventToForm(event)), ...patch };
}

/** Client-side check before sending; the server validates again regardless. */
export function formProblem(f: EventFormState): "title" | "duration" | "until" | null {
  if (!f.title.trim()) return "title";
  const start = f.allDay ? f.startDate : `${f.startDate}T${f.startTime}`;
  const end = f.allDay ? f.endDate : `${f.endDate}T${f.endTime}`;
  if (!f.startDate || !f.endDate || (f.allDay ? end < start : end <= start)) return "duration";
  if (f.repeat && f.until && f.until < f.startDate) return "until";
  return null;
}

/** Keeps the end after the start when the start moves, preserving nothing fancier than that. */
export function withStartChanged(
  f: EventFormState,
  patch: Partial<EventFormState>,
): EventFormState {
  const next = { ...f, ...patch };
  if (next.allDay) {
    if (next.endDate < next.startDate) next.endDate = next.startDate;
  } else if (`${next.endDate}T${next.endTime}` <= `${next.startDate}T${next.startTime}`) {
    const end = addMinutesToWallTime(next.startDate, next.startTime, 60);
    next.endDate = end.date;
    next.endTime = end.time;
  }
  return next;
}
