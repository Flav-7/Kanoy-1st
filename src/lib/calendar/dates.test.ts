import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  eventBounds,
  eventFormTimes,
  layoutColumns,
  occurrenceDays,
  segmentOnDay,
  shiftAnchor,
  startOfWeek,
  viewDays,
  viewFetchRange,
  wallTimeToInstant,
  weekdayIndex,
} from "./dates";

const LISBON = "Europe/Lisbon";

describe("plain date arithmetic", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("handles February in common and leap years", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
    expect(addDays("2100-02-28", 1)).toBe("2100-03-01"); // not a leap year
    expect(addDays("2000-02-28", 1)).toBe("2000-02-29"); // is one
  });

  it("clamps month steps to the last day of shorter months", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
  });

  it("starts weeks on Monday, across a year boundary", () => {
    expect(weekdayIndex("2026-09-28")).toBe(0); // Monday
    expect(weekdayIndex("2026-09-27")).toBe(6); // Sunday
    expect(startOfWeek("2027-01-01")).toBe("2026-12-28");
  });
});

describe("views", () => {
  it("month view is 6 weeks starting on the Monday on/before the 1st", () => {
    const sep = viewDays("month", "2026-09-15");
    expect(sep).toHaveLength(42);
    expect(sep[0]).toBe("2026-08-31");
    const feb = viewDays("month", "2026-02-10");
    expect(feb[0]).toBe("2026-01-26");
  });

  it("agenda covers exactly the anchor's month, leap February included", () => {
    expect(viewDays("agenda", "2028-02-10")).toHaveLength(29);
    expect(viewDays("agenda", "2026-02-10")).toHaveLength(28);
    expect(viewDays("agenda", "2026-12-01").at(-1)).toBe("2026-12-31");
  });

  it("navigates by the view's unit", () => {
    expect(shiftAnchor("month", "2026-12-31", 1)).toBe("2027-01-31");
    expect(shiftAnchor("week", "2026-12-30", 1)).toBe("2027-01-06");
    expect(shiftAnchor("day", "2028-02-29", 1)).toBe("2028-03-01");
  });

  it("fetch range is padded by a day and aligned to local midnight", () => {
    const { from, to } = viewFetchRange("week", "2026-09-30", LISBON);
    // Week of Wed 30 Sep is Mon 28 Sep – Sun 4 Oct; padded to Sun 27 Sep – Tue 6 Oct (WEST, +01).
    expect(from.toISOString()).toBe("2026-09-26T23:00:00.000Z");
    expect(to.toISOString()).toBe("2026-10-05T23:00:00.000Z");
  });
});

describe("time zones and DST", () => {
  it("converts wall times with the offset in force on that date", () => {
    // Lisbon: WET (+00) in winter, WEST (+01) in summer; clocks change 29 Mar and 25 Oct 2026.
    expect(wallTimeToInstant("2026-03-28T14:00", LISBON).toISOString()).toBe(
      "2026-03-28T14:00:00.000Z",
    );
    expect(wallTimeToInstant("2026-03-29T14:00", LISBON).toISOString()).toBe(
      "2026-03-29T13:00:00.000Z",
    );
    expect(wallTimeToInstant("2026-10-25T14:00", LISBON).toISOString()).toBe(
      "2026-10-25T14:00:00.000Z",
    );
  });

  it("moves a wall time inside the spring-forward gap forward", () => {
    // 01:30 doesn't exist on 29 Mar 2026 in Lisbon (01:00 → 02:00).
    expect(wallTimeToInstant("2026-03-29T01:30", LISBON).toISOString()).toBe(
      "2026-03-29T01:30:00.000Z",
    );
  });

  it("keeps a timed event's duration exact across a DST change", () => {
    const { startAt, endAt } = eventBounds({
      allDay: false,
      start: "2026-03-29T00:00",
      end: "2026-03-29T03:00",
      timezone: LISBON,
    });
    expect(+endAt - +startAt).toBe(2 * 3_600_000); // only 2 real hours that night
  });

  it("stores all-day events as whole days of their own timezone", () => {
    const b = eventBounds({
      allDay: true,
      start: "2026-09-27",
      end: "2026-09-27",
      timezone: LISBON,
    });
    expect(b.startAt.toISOString()).toBe("2026-09-26T23:00:00.000Z");
    expect(b.endAt.toISOString()).toBe("2026-09-27T23:00:00.000Z");
  });

  it("round-trips form values, timed and all-day, including multi-day", () => {
    for (const input of [
      { allDay: false, start: "2026-12-31T22:00", end: "2027-01-01T02:00", timezone: LISBON },
      { allDay: true, start: "2028-02-28", end: "2028-03-01", timezone: LISBON },
      { allDay: false, start: "2026-09-27T09:30", end: "2026-09-27T10:15", timezone: "Asia/Tokyo" },
    ]) {
      const { startAt, endAt } = eventBounds(input);
      const back = eventFormTimes({
        allDay: input.allDay,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        timezone: input.timezone,
      });
      expect(back).toEqual({ start: input.start, end: input.end });
    }
  });
});

describe("occurrenceDays", () => {
  const occ = (start: string, end: string) => ({ start, end });

  it("an event crossing midnight covers both days", () => {
    const d = occurrenceDays(
      occ("2026-09-27T22:00:00Z", "2026-09-28T01:00:00Z"),
      false,
      LISBON,
      LISBON,
    );
    expect(d).toEqual({ first: "2026-09-27", last: "2026-09-28" });
  });

  it("an event ending exactly at midnight stays on its day", () => {
    const d = occurrenceDays(
      occ("2026-09-27T21:00:00Z", "2026-09-27T23:00:00Z"),
      false,
      LISBON,
      LISBON,
    );
    expect(d).toEqual({ first: "2026-09-27", last: "2026-09-27" });
  });

  it("a timed event follows the viewer's clock", () => {
    const late = occ("2026-09-27T22:30:00Z", "2026-09-27T23:30:00Z"); // 23:30 in Lisbon
    expect(occurrenceDays(late, false, LISBON, "America/New_York").first).toBe("2026-09-27");
    expect(occurrenceDays(late, false, LISBON, "Asia/Tokyo").first).toBe("2026-09-28");
  });

  it("an all-day event keeps its planned days for every viewer", () => {
    const b = eventBounds({
      allDay: true,
      start: "2026-12-31",
      end: "2027-01-02",
      timezone: LISBON,
    });
    const o = occ(b.startAt.toISOString(), b.endAt.toISOString());
    for (const viewer of [LISBON, "America/Los_Angeles", "Pacific/Auckland"]) {
      expect(occurrenceDays(o, true, LISBON, viewer)).toEqual({
        first: "2026-12-31",
        last: "2027-01-02",
      });
    }
  });
});

describe("time grid", () => {
  it("clips multi-day events to each day", () => {
    const o = { start: "2026-09-27T20:00:00Z", end: "2026-09-29T08:00:00Z" }; // 21:00 Sun → 09:00 Tue
    expect(segmentOnDay(o, "2026-09-27", LISBON)).toEqual({ top: 21 * 60, bottom: 1440 });
    expect(segmentOnDay(o, "2026-09-28", LISBON)).toEqual({ top: 0, bottom: 1440 });
    expect(segmentOnDay(o, "2026-09-29", LISBON)).toEqual({ top: 0, bottom: 9 * 60 });
    expect(segmentOnDay(o, "2026-09-30", LISBON)).toBeNull();
  });

  it("uses wall-clock positions on a DST day", () => {
    const o = { start: "2026-03-29T00:00:00Z", end: "2026-03-29T02:00:00Z" }; // 00:00 → 03:00 local
    expect(segmentOnDay(o, "2026-03-29", LISBON)).toEqual({ top: 0, bottom: 180 });
  });

  it("puts overlapping events side by side", () => {
    const laid = layoutColumns([
      { id: "a", top: 540, bottom: 600 },
      { id: "b", top: 570, bottom: 630 },
      { id: "c", top: 600, bottom: 660 },
      { id: "d", top: 700, bottom: 760 },
    ]);
    const byId = Object.fromEntries(laid.map((l) => [l.id, l]));
    expect(byId["a"]).toMatchObject({ col: 0, cols: 2 });
    expect(byId["b"]).toMatchObject({ col: 1, cols: 2 });
    expect(byId["c"]).toMatchObject({ col: 0, cols: 2 });
    expect(byId["d"]).toMatchObject({ col: 0, cols: 1 });
  });
});
