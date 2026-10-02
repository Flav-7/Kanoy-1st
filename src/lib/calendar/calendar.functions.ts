import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb } from "@/server/db.server";
import { currentUser } from "@/server/session.server";
import {
  createEvent,
  deleteEvent,
  getEvent,
  listCalendars,
  listOccurrences,
  listTeam,
  updateEvent,
} from "@/server/calendar";
import type { Db } from "@/server/db";
import { notifyArea, updateKind, type ChangeKind } from "@/server/push";
import { isManager } from "@/server/team";
import { webPushSender } from "@/server/web-push.server";
import {
  eventInputSchema,
  rangeSchema,
  type CalendarEvent,
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

/**
 * Pushes the change to the area's other members. Best effort: a failure
 * here is logged and never turns a saved change into an error for the user.
 * Awaited (bounded) because a serverless function may be frozen as soon as
 * it has answered.
 */
async function notify(
  db: Db,
  userId: string,
  event: CalendarEvent,
  kind: ChangeKind,
  occurrenceStart?: string,
): Promise<void> {
  const send = webPushSender();
  if (!send) return;
  try {
    await Promise.race([
      notifyArea(db, send, event, userId, kind, occurrenceStart),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  } catch (err) {
    console.error("push notification failed", err);
  }
}

export type CalendarBootstrap =
  | {
      ok: true;
      calendars: CalendarSummary[];
      team: TeamMember[];
      /** May open the team page (create areas, add people). */
      canManageTeam: boolean;
    }
  | Unauthenticated;

export const getCalendarBootstrap = createServerFn({ method: "GET" }).handler(
  (): Promise<CalendarBootstrap> =>
    asUser(async (db, userId) => ({
      ok: true as const,
      calendars: await listCalendars(db, userId),
      team: await listTeam(db, userId),
      canManageTeam: await isManager(db, userId),
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
    asUser(async (db, userId) => {
      const result = await createEvent(db, userId, data);
      if (result.ok && result.event) await notify(db, userId, result.event, "created");
      return result;
    }),
  );

const updateSchema = z.object({
  id: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  input: eventInputSchema,
});

export const updateEventFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => updateSchema.parse(data))
  .handler(({ data }): Promise<MutationResult> =>
    asUser(async (db, userId) => {
      // Read first: the notification says what changed, e.g. tentative → confirmed.
      const before = await getEvent(db, userId, data.id);
      const result = await updateEvent(db, userId, data.id, data.expectedVersion, data.input);
      if (result.ok && result.event) {
        await notify(db, userId, result.event, updateKind(before?.status, result.event.status));
      }
      return result;
    }),
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
    asUser(async (db, userId) => {
      // Read first: after a full delete there's nothing left to describe.
      const before = await getEvent(db, userId, data.id);
      const result = await deleteEvent(
        db,
        userId,
        data.id,
        data.expectedVersion,
        data.occurrenceStart,
      );
      if (result.ok && before) {
        await notify(db, userId, before, "deleted", data.occurrenceStart ?? undefined);
      }
      return result;
    }),
  );
