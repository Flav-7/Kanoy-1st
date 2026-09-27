import { z } from "zod";

export const ROLES = ["viewer", "editor", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const CATEGORIES = ["meeting", "call", "delivery", "deadline", "internal", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ["confirmed", "tentative", "cancelled"] as const;
export type EventStatus = (typeof STATUSES)[number];

export const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

/** A calendar's colour is one of these tokens (see calendar-colors.ts), never free-form. */
export const CALENDAR_COLORS = ["cyan", "mint", "violet", "amber", "rose", "blue"] as const;
export type CalendarColor = (typeof CALENDAR_COLORS)[number];

export type Recurrence = {
  freq: Frequency;
  interval: number;
  /** Last day (inclusive, in the event's timezone) an occurrence may start on. */
  until: string | null;
};

export type TeamMember = { id: string; name: string };

export type CalendarSummary = {
  id: string;
  name: string;
  color: CalendarColor;
  role: Role;
  memberIds: string[];
};

/** A stored event (for a recurring one: the series). Instants are UTC ISO strings. */
export type CalendarEvent = {
  id: string;
  calendarId: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  timezone: string;
  allDay: boolean;
  category: Category | null;
  status: EventStatus;
  recurrence: Recurrence | null;
  /** Start instants of cancelled occurrences of a recurring series. */
  exdates: string[];
  participants: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

/** One concrete appearance of an event in a date range (a series expands to many). */
export type Occurrence = {
  key: string;
  event: CalendarEvent;
  start: string;
  end: string;
};

// ── Input validation (shared by the form and the server) ─────────────────

const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function isRealDate(plain: string): boolean {
  const [y, m, d] = plain.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export const recurrenceSchema = z.object({
  freq: z.enum(FREQUENCIES),
  interval: z.number().int().min(1).max(99),
  until: z.string().regex(PLAIN_DATE).refine(isRealDate).nullable(),
});

/**
 * What the event form sends. Times are wall-clock values in `timezone`
 * ("2026-09-27T14:00"), or plain dates for all-day events with an inclusive
 * `end` — the server turns them into absolute instants, so the client never
 * does timezone arithmetic on its own.
 */
export const eventInputSchema = z
  .object({
    calendarId: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000),
    allDay: z.boolean(),
    timezone: z.string().refine(isValidTimeZone, "INVALID_TIMEZONE"),
    start: z.string(),
    end: z.string(),
    category: z.enum(CATEGORIES).nullable(),
    status: z.enum(STATUSES),
    participants: z.array(z.string().uuid()).max(50),
    recurrence: recurrenceSchema.nullable(),
  })
  .superRefine((v, ctx) => {
    const pattern = v.allDay ? PLAIN_DATE : LOCAL_DATE_TIME;
    for (const key of ["start", "end"] as const) {
      if (!pattern.test(v[key]) || !isRealDate(v[key].slice(0, 10))) {
        ctx.addIssue({ code: "custom", path: [key], message: "INVALID_DATE" });
      }
    }
  });

export type EventInput = z.infer<typeof eventInputSchema>;

export const rangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  calendarIds: z.array(z.string().uuid()).max(50).nullable(),
});

// ── Results of mutating actions ──────────────────────────────────────────

export type MutationError =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_EVENT_DURATION"
  | "INVALID_PARTICIPANTS"
  | "INVALID_INPUT";

export type MutationResult =
  | { ok: true; event: CalendarEvent | null }
  | { ok: false; error: MutationError; latest?: CalendarEvent };
