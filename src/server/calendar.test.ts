import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrate, type Db } from "./db";
import { createPgliteDb } from "./pglite-db";
import { createCalendar, createUser, setMember } from "./admin";
import { createEvent, deleteEvent, getEvent, listOccurrences, updateEvent } from "./calendar";
import type { CalendarEvent, EventInput } from "@/lib/calendar/types";

const LISBON = "Europe/Lisbon";

let db: Db & { close(): Promise<void> };
let ana: string; // admin of "Geral"
let bruno: string; // editor of "Geral"
let carla: string; // viewer of "Geral"
let dani: string; // not in "Geral"; admin of "Privado"
let geral: string;
let privado: string;

beforeEach(async () => {
  db = await createPgliteDb();
  await migrate(db);
  ana = (await createUser(db, { email: "ana@kanoy.test", name: "Ana" })).id;
  bruno = (await createUser(db, { email: "bruno@kanoy.test", name: "Bruno" })).id;
  carla = (await createUser(db, { email: "carla@kanoy.test", name: "Carla" })).id;
  dani = (await createUser(db, { email: "dani@kanoy.test", name: "Dani" })).id;
  geral = (await createCalendar(db, { name: "Geral", color: "cyan", ownerId: ana })).id;
  privado = (await createCalendar(db, { name: "Privado", color: "rose", ownerId: dani })).id;
  await setMember(db, geral, bruno, "editor");
  await setMember(db, geral, carla, "viewer");
});

afterEach(async () => {
  await db.close();
});

function input(overrides: Partial<EventInput> = {}): EventInput {
  return {
    calendarId: geral,
    title: "Reunião",
    description: "",
    allDay: false,
    timezone: LISBON,
    start: "2026-09-28T14:00",
    end: "2026-09-28T15:00",
    category: "meeting",
    status: "confirmed",
    participants: [],
    recurrence: null,
    ...overrides,
  };
}

async function created(
  userId: string,
  overrides: Partial<EventInput> = {},
): Promise<CalendarEvent> {
  const res = await createEvent(db, userId, input(overrides));
  if (!res.ok || !res.event) throw new Error(`create failed: ${JSON.stringify(res)}`);
  return res.event;
}

const range = (from: string, to: string, calendarIds: string[] | null = null) => ({
  from: new Date(from),
  to: new Date(to),
  calendarIds,
});

describe("creating events", () => {
  it("stores an editor's event with exact instants and participants", async () => {
    const e = await created(bruno, { participants: [ana, carla] });
    expect(e.startAt).toBe("2026-09-28T13:00:00.000Z"); // 14:00 WEST
    expect(e.endAt).toBe("2026-09-28T14:00:00.000Z");
    expect(e.participants.sort()).toEqual([ana, carla].sort());
    expect(e.createdBy).toBe(bruno);
    expect(e.version).toBe(1);
  });

  it("refuses viewers and hides calendars from non-members", async () => {
    expect(await createEvent(db, carla, input())).toEqual({ ok: false, error: "FORBIDDEN" });
    expect(await createEvent(db, dani, input())).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("rejects an end before (or at) the start", async () => {
    const res = await createEvent(db, ana, input({ end: "2026-09-28T14:00" }));
    expect(res).toEqual({ ok: false, error: "INVALID_EVENT_DURATION" });
  });

  it("only accepts participants who are members of the calendar", async () => {
    const res = await createEvent(db, ana, input({ participants: [dani] }));
    expect(res).toEqual({ ok: false, error: "INVALID_PARTICIPANTS" });
  });
});

describe("range queries", () => {
  it("returns only events overlapping the range, from calendars the user belongs to", async () => {
    await created(ana, { title: "Dentro" });
    await created(ana, { title: "Fora", start: "2026-11-02T10:00", end: "2026-11-02T11:00" });
    await created(dani, { calendarId: privado, title: "Privado" });

    const sept = await listOccurrences(
      db,
      carla,
      range("2026-08-30T23:00:00Z", "2026-10-05T23:00:00Z"),
    );
    expect(sept.map((o) => o.event.title)).toEqual(["Dentro"]);

    // Asking for someone else's calendar by id yields nothing (no IDOR).
    const probe = await listOccurrences(
      db,
      carla,
      range("2026-08-30T23:00:00Z", "2026-10-05T23:00:00Z", [privado]),
    );
    expect(probe).toEqual([]);
  });

  it("shows an event spanning New Year in both December and January", async () => {
    await created(ana, { start: "2026-12-31T23:00", end: "2027-01-01T01:00" });
    const dec = await listOccurrences(
      db,
      ana,
      range("2026-12-01T00:00:00Z", "2027-01-01T00:00:00Z"),
    );
    const jan = await listOccurrences(
      db,
      ana,
      range("2027-01-01T00:00:00Z", "2027-02-01T00:00:00Z"),
    );
    expect(dec).toHaveLength(1);
    expect(jan).toHaveLength(1);
  });

  it("finds a multi-day all-day event from any day it covers, including 29 February", async () => {
    await created(ana, { allDay: true, start: "2028-02-28", end: "2028-03-01" });
    const leapDay = await listOccurrences(
      db,
      ana,
      range("2028-02-29T00:00:00Z", "2028-03-01T00:00:00Z"),
    );
    expect(leapDay).toHaveLength(1);
  });

  it("expands recurring events and refuses oversized ranges", async () => {
    await created(ana, { recurrence: { freq: "WEEKLY", interval: 1, until: null } });
    const month = await listOccurrences(
      db,
      ana,
      range("2026-09-30T23:00:00Z", "2026-10-31T23:59:59Z"),
    );
    expect(month).toHaveLength(4); // Mondays 5, 12, 19, 26 Oct
    await expect(
      listOccurrences(db, ana, range("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z")),
    ).rejects.toThrow("INVALID_RANGE");
  });
});

describe("editing", () => {
  it("bumps the version and syncs participants", async () => {
    const e = await created(ana, { participants: [bruno] });
    const res = await updateEvent(
      db,
      bruno,
      e.id,
      1,
      input({ title: "Novo", participants: [carla] }),
    );
    expect(res.ok).toBe(true);
    const after = await getEvent(db, ana, e.id);
    expect(after).toMatchObject({ title: "Novo", version: 2, participants: [carla] });
  });

  it("does not let a stale edit overwrite a newer one (João/Maria)", async () => {
    const e = await created(ana);
    // Both open version 1. Bruno moves it 14:00 → 15:00 first.
    const moved = await updateEvent(
      db,
      bruno,
      e.id,
      1,
      input({ start: "2026-09-28T15:00", end: "2026-09-28T16:00" }),
    );
    expect(moved.ok).toBe(true);
    // Ana, still on version 1, only meant to change the description.
    const stale = await updateEvent(db, ana, e.id, 1, input({ description: "Notas" }));
    expect(stale).toMatchObject({ ok: false, error: "CONFLICT", latest: { version: 2 } });
    expect((await getEvent(db, ana, e.id))!.startAt).toBe("2026-09-28T14:00:00.000Z"); // still 15:00 local
  });

  it("lets exactly one of two simultaneous edits win", async () => {
    const e = await created(ana);
    const results = await Promise.all([
      updateEvent(db, ana, e.id, 1, input({ title: "A" })),
      updateEvent(db, bruno, e.id, 1, input({ title: "B" })),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.error === "CONFLICT")).toHaveLength(1);
    expect((await getEvent(db, ana, e.id))!.version).toBe(2);
  });

  it("enforces permissions on the event's calendar and on the target calendar", async () => {
    const e = await created(ana);
    expect(await updateEvent(db, carla, e.id, 1, input({ title: "x" }))).toEqual({
      ok: false,
      error: "FORBIDDEN",
    });
    expect(await updateEvent(db, dani, e.id, 1, input({ title: "x" }))).toEqual({
      ok: false,
      error: "NOT_FOUND",
    });
    // Bruno edits Geral but has no role in Privado: he can't move the event there.
    expect(await updateEvent(db, bruno, e.id, 1, input({ calendarId: privado }))).toEqual({
      ok: false,
      error: "FORBIDDEN",
    });
  });
});

describe("deleting", () => {
  it("deletes with the current version only", async () => {
    const e = await created(ana);
    await updateEvent(db, ana, e.id, 1, input({ title: "v2" }));
    expect(await deleteEvent(db, bruno, e.id, 1, null)).toMatchObject({
      ok: false,
      error: "CONFLICT",
    });
    expect(await deleteEvent(db, carla, e.id, 2, null)).toEqual({ ok: false, error: "FORBIDDEN" });
    expect(await deleteEvent(db, bruno, e.id, 2, null)).toEqual({ ok: true, event: null });
    expect(await getEvent(db, ana, e.id)).toBeNull();
  });

  it("cancels a single occurrence of a series", async () => {
    const e = await created(ana, {
      recurrence: { freq: "DAILY", interval: 1, until: "2026-10-02" },
    });
    const week = range("2026-09-27T23:00:00Z", "2026-10-04T23:00:00Z");
    const before = await listOccurrences(db, ana, week);
    expect(before).toHaveLength(5); // 28 Sep – 2 Oct
    const res = await deleteEvent(db, ana, e.id, 1, before[2]!.start);
    expect(res).toMatchObject({ ok: true, event: { version: 2 } });
    const after = await listOccurrences(db, ana, week);
    expect(after.map((o) => o.start)).not.toContain(before[2]!.start);
    expect(after).toHaveLength(4);
  });
});
