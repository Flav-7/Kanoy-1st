import { describe, expect, it } from "vitest";
import { applyFilters, toggleFilter } from "./filters";
import {
  addMinutesToWallTime,
  eventToForm,
  formProblem,
  newEventForm,
  toEventInput,
  withStartChanged,
} from "./form";
import type { CalendarEvent, Occurrence } from "./types";

const base = newEventForm({ calendarId: "c1", timezone: "Europe/Lisbon", date: "2026-09-28" });

describe("event form", () => {
  it("starts at 09:00 for an hour, or at the clicked slot", () => {
    expect(base).toMatchObject({ startTime: "09:00", endTime: "10:00", endDate: "2026-09-28" });
    const late = newEventForm({
      calendarId: "c1",
      timezone: "Europe/Lisbon",
      date: "2026-12-31",
      startMinutes: 23 * 60 + 30,
    });
    expect(late).toMatchObject({ startTime: "23:30", endDate: "2027-01-01", endTime: "00:30" });
  });

  it("carries wall-clock minutes across days", () => {
    expect(addMinutesToWallTime("2028-02-28", "23:45", 30)).toEqual({
      date: "2028-02-29",
      time: "00:15",
    });
  });

  it("keeps the end after the start when the start moves", () => {
    const moved = withStartChanged(base, { startTime: "11:00" });
    expect(moved).toMatchObject({ startTime: "11:00", endTime: "12:00" });
    const allDay = withStartChanged({ ...base, allDay: true }, { startDate: "2026-10-02" });
    expect(allDay.endDate).toBe("2026-10-02");
  });

  it("flags missing titles, inverted times and an until before the start", () => {
    expect(formProblem(base)).toBe("title");
    expect(formProblem({ ...base, title: "x", endTime: "09:00" })).toBe("duration");
    expect(formProblem({ ...base, title: "x", repeat: "WEEKLY", until: "2026-09-01" })).toBe(
      "until",
    );
    expect(formProblem({ ...base, title: "x" })).toBeNull();
  });

  it("builds server input and round-trips a stored event", () => {
    const input = toEventInput({ ...base, title: " Daily ", repeat: "DAILY", interval: 1 });
    expect(input).toMatchObject({
      title: "Daily",
      start: "2026-09-28T09:00",
      end: "2026-09-28T10:00",
      category: null,
      recurrence: { freq: "DAILY", interval: 1, until: null },
    });
    const stored: CalendarEvent = {
      id: "e1",
      calendarId: "c1",
      title: "Daily",
      description: null,
      startAt: "2026-09-28T08:00:00.000Z",
      endAt: "2026-09-28T09:00:00.000Z",
      timezone: "Europe/Lisbon",
      allDay: false,
      category: "proposal_meeting",
      status: "tentative",
      recurrence: null,
      exdates: [],
      participants: ["u1"],
      createdBy: "u1",
      createdAt: "",
      updatedAt: "",
      version: 3,
    };
    expect(eventToForm(stored)).toMatchObject({
      startDate: "2026-09-28",
      startTime: "09:00",
      endTime: "10:00",
      category: "proposal_meeting",
    });
  });
});

describe("filters", () => {
  const occ = (
    calendarId: string,
    category: CalendarEvent["category"],
    people: string[],
  ): Occurrence =>
    ({
      key: Math.random().toString(),
      start: "",
      end: "",
      event: { calendarId, category, createdBy: people[0]!, participants: people.slice(1) },
    }) as unknown as Occurrence;

  it("filters by calendar, category (incl. none) and person involved", () => {
    const list = [
      occ("a", "proposal_meeting", ["u1"]),
      occ("b", null, ["u2", "u3"]),
      occ("a", "photo_visit", ["u2"]),
    ];
    expect(applyFilters(list, { calendars: ["a"], people: null, categories: null })).toHaveLength(
      2,
    );
    expect(
      applyFilters(list, { calendars: null, people: null, categories: ["none"] }),
    ).toHaveLength(1);
    expect(applyFilters(list, { calendars: null, people: ["u3"], categories: null })).toHaveLength(
      1,
    );
  });

  it("collapses a full selection back to 'all'", () => {
    expect(toggleFilter(null, "a", ["a", "b"])).toEqual(["b"]);
    expect(toggleFilter(["b"], "a", ["a", "b"])).toBeNull();
  });
});
