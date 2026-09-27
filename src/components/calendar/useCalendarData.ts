import { useCallback } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEventFn,
  deleteEventFn,
  getCalendarBootstrap,
  getEvents,
  updateEventFn,
} from "@/lib/calendar/calendar.functions";
import type { EventInput, MutationResult } from "@/lib/calendar/types";

/**
 * Server state for the calendar, through React Query:
 *  - each visible range is its own cache entry, so flicking quickly between
 *    months never lets a slow old response overwrite the current one;
 *  - the previous range stays on screen while the next one loads;
 *  - "live" updates are polling (every 20 s while the tab is visible, and on
 *    focus). The site runs on serverless functions, which can't hold the
 *    long-lived connections WebSockets/SSE need; polling gives near-real-time
 *    without extra infrastructure.
 */

const POLL_MS = 20_000;

export const calendarKeys = {
  all: ["calendar"] as const,
  bootstrap: ["calendar", "bootstrap"] as const,
  events: (from: string, to: string) => ["calendar", "events", from, to] as const,
};

export function useCalendarBootstrap() {
  return useQuery({
    queryKey: calendarKeys.bootstrap,
    queryFn: () => getCalendarBootstrap(),
    staleTime: 60_000,
  });
}

export function useOccurrences(range: { from: Date; to: Date }) {
  const from = range.from.toISOString();
  const to = range.to.toISOString();
  return useQuery({
    queryKey: calendarKeys.events(from, to),
    queryFn: () => getEvents({ data: { from, to, calendarIds: null } }),
    placeholderData: keepPreviousData,
    staleTime: 5_000,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export type ActionResult =
  | MutationResult
  | { ok: false; error: "UNAUTHENTICATED" }
  | { ok: false; error: "NETWORK" | "UNKNOWN" };

async function attempt(call: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await call();
  } catch (err) {
    console.error(err);
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    return { ok: false, error: offline || err instanceof TypeError ? "NETWORK" : "UNKNOWN" };
  }
}

/**
 * Create/update/delete. After any answer that means "the server's copy
 * differs from yours" (success, conflict, gone) the visible events are
 * refetched, so the screen always converges on what the database holds.
 */
export function useEventActions() {
  const queryClient = useQueryClient();

  const settle = useCallback(
    async (result: ActionResult) => {
      if (result.ok || result.error === "CONFLICT" || result.error === "NOT_FOUND") {
        await queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
      }
      return result;
    },
    [queryClient],
  );

  return {
    create: (input: EventInput) => attempt(() => createEventFn({ data: input })).then(settle),
    update: (id: string, expectedVersion: number, input: EventInput) =>
      attempt(() => updateEventFn({ data: { id, expectedVersion, input } })).then(settle),
    remove: (id: string, expectedVersion: number, occurrenceStart: string | null) =>
      attempt(() => deleteEventFn({ data: { id, expectedVersion, occurrenceStart } })).then(settle),
  };
}
