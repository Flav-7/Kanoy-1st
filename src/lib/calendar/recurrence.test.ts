import { describe, expect, it } from "vitest";
import { eventBounds, instantToWallTime } from "./dates";
import { expandOccurrences, parseRule, serializeRule } from "./recurrence";
import type { CalendarEvent, Recurrence } from "./types";

const LISBON = "Europe/Lisbon";

function event(
  times: { allDay?: boolean; start: string; end: string },
  recurrence: Recurrence | null,
  exdates: string[] = [],
): CalendarEvent {
  const allDay = times.allDay ?? false;
  const { startAt, endAt } = eventBounds({
    allDay,
    start: times.start,
    end: times.end,
    timezone: LISBON,
  });
  return {
    id: "e1",
    calendarId: "c1",
    title: "T",
    description: null,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    timezone: LISBON,
    allDay,
    category: null,
    status: "confirmed",
    recurrence,
    exdates,
    participants: [],
    createdBy: "u1",
    createdAt: startAt.toISOString(),
    updatedAt: startAt.toISOString(),
    version: 1,
  };
}

const range = (from: string, to: string) => [new Date(from), new Date(to)] as const;
const localStarts = (e: CalendarEvent, from: string, to: string) =>
  expandOccurrences(e, ...range(from, to)).map((o) => instantToWallTime(o.start, LISBON));

describe("rules", () => {
  it("round-trips and rejects what it doesn't support", () => {
    const r: Recurrence = { freq: "WEEKLY", interval: 2, until: "2026-12-31" };
    expect(serializeRule(r)).toBe("FREQ=WEEKLY;INTERVAL=2;UNTIL=20261231");
    expect(parseRule(serializeRule(r))).toEqual(r);
    expect(parseRule("FREQ=HOURLY;INTERVAL=1")).toBeNull();
    expect(parseRule("FREQ=DAILY;INTERVAL=0")).toBeNull();
    expect(parseRule(null)).toBeNull();
  });
});

describe("expandOccurrences", () => {
  it("returns a one-off event only when it overlaps the range", () => {
    const e = event({ start: "2026-09-27T14:00", end: "2026-09-27T15:00" }, null);
    expect(
      expandOccurrences(e, ...range("2026-09-27T00:00:00Z", "2026-09-28T00:00:00Z")),
    ).toHaveLength(1);
    expect(
      expandOccurrences(e, ...range("2026-09-27T14:00:00Z", "2026-09-28T00:00:00Z")),
    ).toHaveLength(0); // ends 14:00Z
  });

  it("keeps the local time of a weekly meeting across DST", () => {
    const e = event(
      { start: "2026-10-19T09:00", end: "2026-10-19T09:30" }, // Monday, summer time
      { freq: "WEEKLY", interval: 1, until: null },
    );
    const occ = expandOccurrences(e, ...range("2026-10-18T00:00:00Z", "2026-11-03T00:00:00Z"));
    expect(occ.map((o) => instantToWallTime(o.start, LISBON))).toEqual([
      "2026-10-19T09:00",
      "2026-10-26T09:00", // after the 25 Oct change
      "2026-11-02T09:00",
    ]);
    expect(occ.map((o) => o.start.slice(11, 16))).toEqual(["08:00", "09:00", "09:00"]);
  });

  it("steps monthly from the 31st without drifting", () => {
    const e = event(
      { start: "2026-01-31T10:00", end: "2026-01-31T11:00" },
      { freq: "MONTHLY", interval: 1, until: null },
    );
    expect(localStarts(e, "2026-01-01T00:00:00Z", "2026-05-01T00:00:00Z")).toEqual([
      "2026-01-31T10:00",
      "2026-02-28T10:00",
      "2026-03-31T10:00",
      "2026-04-30T10:00",
    ]);
  });

  it("repeats a 29 February event yearly on the last day of February", () => {
    const e = event(
      { allDay: true, start: "2028-02-29", end: "2028-02-29" },
      { freq: "YEARLY", interval: 1, until: null },
    );
    const occ = expandOccurrences(e, ...range("2028-01-01T00:00:00Z", "2032-12-31T00:00:00Z"));
    expect(occ.map((o) => instantToWallTime(o.start, LISBON).slice(0, 10))).toEqual([
      "2028-02-29",
      "2029-02-28",
      "2030-02-28",
      "2031-02-28",
      "2032-02-29",
    ]);
  });

  it("honours interval, an inclusive until date and cancelled occurrences", () => {
    const base = event(
      { start: "2026-09-01T18:00", end: "2026-09-01T19:00" },
      { freq: "DAILY", interval: 2, until: "2026-09-09" },
    );
    const cancelled = expandOccurrences(
      base,
      ...range("2026-09-05T00:00:00Z", "2026-09-06T00:00:00Z"),
    )[0]!.start;
    const e = { ...base, exdates: [cancelled] };
    expect(localStarts(e, "2026-08-01T00:00:00Z", "2026-10-01T00:00:00Z")).toEqual([
      "2026-09-01T18:00",
      "2026-09-03T18:00",
      "2026-09-07T18:00",
      "2026-09-09T18:00",
    ]);
  });

  it("finds occurrences years after the series start", () => {
    const e = event(
      { start: "2020-01-01T08:00", end: "2020-01-01T08:15" },
      { freq: "DAILY", interval: 1, until: null },
    );
    expect(localStarts(e, "2026-09-26T23:00:00Z", "2026-10-03T23:00:00Z")).toHaveLength(7);
  });

  it("repeats multi-day all-day events as whole days", () => {
    const e = event(
      { allDay: true, start: "2026-09-26", end: "2026-09-27" },
      { freq: "WEEKLY", interval: 1, until: null },
    );
    const [first, second] = expandOccurrences(
      e,
      ...range("2026-09-20T00:00:00Z", "2026-10-06T00:00:00Z"),
    );
    expect(instantToWallTime(first!.start, LISBON)).toBe("2026-09-26T00:00");
    expect(instantToWallTime(first!.end, LISBON)).toBe("2026-09-28T00:00");
    expect(instantToWallTime(second!.end, LISBON)).toBe("2026-10-05T00:00");
  });
});
