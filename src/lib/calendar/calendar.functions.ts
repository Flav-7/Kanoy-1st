import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb } from "@/server/db.server";
import { currentUser } from "@/server/session.server";
import {
  createEvent,
  deleteEvent,
  listCalendars,
  listOccurrences,
  listTeam,
  updateEvent,
} from "@/server/calendar";
import type { Db } from "@/server/db";
import {
  eventInputSchema,
  rangeSchema,
  type CalendarSummary,
  type MutationResult,
  type Occurrence,
  type TeamMember,
} from "./types";

/**
 * The calendar's RPC surface. Each handler resolves the user from the session
 * cookie and hands their id to the service in server/calendar.ts, which does
 * all permission checks — nothing here trusts ids beyond "which one is asked for".
 */

type Unauthenticated = { ok: false; error: "UNAUTHENTICATED" };

async function asUser<T>(
  run: (db: Db, userId: string) => Promise<T>,
): Promise<T | Unauthenticated> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "UNAUTHENTICATED" };
  return run(await getDb(), user.id);
}

export type CalendarBootstrap =
  { ok: true; calendars: CalendarSummary[]; team: TeamMember[] } | Unauthenticated;

export const getCalendarBootstrap = createServerFn({ method: "GET" }).handler(
  (): Promise<CalendarBootstrap> =>
    asUser(async (db, userId) => ({
      ok: true as const,
      calendars: await listCalendars(db, userId),
      team: await listTeam(db, userId),
    })),
);

export type EventsResult = { ok: true; occurrences: Occurrence[] } | Unauthenticated;

export const getEvents = createServerFn({ method: "GET" })
  .validator((data: unknown) => rangeSchema.parse(data))
  .handler(({ data }): Promise<EventsResult> =>
    asUser(async (db, userId) => ({
      ok: true as const,
      occurrences: await listOccurrences(db, userId, {
        from: new Date(data.from),
        to: new Date(data.to),
        calendarIds: data.calendarIds,
      }),
    })),
  );

export const createEventFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => eventInputSchema.parse(data))
  .handler(({ data }): Promise<MutationResult> =>
    asUser((db, userId) => createEvent(db, userId, data)),
  );

const updateSchema = z.object({
  id: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  input: eventInputSchema,
});

export const updateEventFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => updateSchema.parse(data))
  .handler(({ data }): Promise<MutationResult> =>
    asUser((db, userId) => updateEvent(db, userId, data.id, data.expectedVersion, data.input)),
  );

const deleteSchema = z.object({
  id: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  /** Set to cancel one occurrence of a recurring event instead of the series. */
  occurrenceStart: z.string().datetime().nullable(),
});

export const deleteEventFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => deleteSchema.parse(data))
  .handler(({ data }): Promise<MutationResult> =>
    asUser((db, userId) =>
      deleteEvent(db, userId, data.id, data.expectedVersion, data.occurrenceStart),
    ),
  );
