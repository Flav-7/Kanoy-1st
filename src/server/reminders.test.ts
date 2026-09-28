import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrate, type Db } from "./db";
import { createPgliteDb } from "./pglite-db";
import { createCalendar, createUser, setMember } from "./admin";
import { createEvent } from "./calendar";
import { saveSubscription, type PushMessage, type PushSender } from "./push";
import { describeDay, remindersFor, sendDailyReminders } from "./reminders";

let db: Db & { close(): Promise<void> };
let flavio: string;
let dinis: string;
let vivi: string;
let geral: string;

const DAY = "2026-10-05";
const base = {
  description: "",
  timezone: "Europe/Lisbon",
  status: "confirmed",
  recurrence: null,
  category: null,
  allDay: false,
} as const;

function add(title: string, extra: Partial<Parameters<typeof createEvent>[2]> = {}) {
  return createEvent(db, flavio, {
    ...base,
    calendarId: geral,
    title,
    start: `${DAY}T10:00`,
    end: `${DAY}T10:30`,
    participants: [],
    ...extra,
  });
}

beforeEach(async () => {
  db = await createPgliteDb();
  await migrate(db);
  flavio = (await createUser(db, { email: "flavio@kanoy.test", name: "Flávio" })).id;
  dinis = (await createUser(db, { email: "dinis@kanoy.test", name: "Dinis" })).id;
  vivi = (await createUser(db, { email: "vivi@kanoy.test", name: "Vivi" })).id;
  geral = (await createCalendar(db, { name: "Geral", color: "cyan", ownerId: flavio })).id;
  await setMember(db, geral, dinis, "admin");
  await setMember(db, geral, vivi, "viewer");
});

afterEach(async () => {
  await db.close();
});

describe("morning reminders", () => {
  it("goes to the participants, or the whole area when there are none", async () => {
    await add("Rever DMARC", { participants: [flavio, dinis] });
    await add("Reunião geral", { start: `${DAY}T15:00`, end: `${DAY}T16:00` });
    const byUser = await remindersFor(db, DAY);
    expect(byUser.get(flavio)?.map((o) => o.event.title)).toEqual(["Rever DMARC", "Reunião geral"]);
    expect(byUser.get(dinis)?.length).toBe(2);
    expect(byUser.get(vivi)?.map((o) => o.event.title)).toEqual(["Reunião geral"]);
  });

  it("skips other days and cancelled activities", async () => {
    await add("Amanhã", { start: "2026-10-06T10:00", end: "2026-10-06T11:00" });
    await add("Cancelada", { status: "cancelled" });
    expect((await remindersFor(db, DAY)).size).toBe(0);
  });

  it("uses Lisbon time: a 00:30 activity belongs to that Lisbon day", async () => {
    await add("Cedo", { start: `${DAY}T00:30`, end: `${DAY}T01:00` });
    await add("Véspera", { start: "2026-10-04T23:30", end: "2026-10-04T23:45" });
    expect((await remindersFor(db, DAY)).get(flavio)?.map((o) => o.event.title)).toEqual(["Cedo"]);
  });

  it("writes one short message per person", async () => {
    await add("Rever DMARC");
    await add("Visita", { allDay: true, start: DAY, end: DAY });
    const message = describeDay((await remindersFor(db, DAY)).get(flavio)!, DAY);
    expect(message.title).toBe("Hoje · 2 atividades");
    expect(message.body.split("\n").sort()).toEqual(["10:00 Rever DMARC", "Dia inteiro · Visita"]);
  });

  it("sends once per day to every device, and never twice", async () => {
    await add("Rever DMARC", { participants: [flavio, dinis] });
    await saveSubscription(db, flavio, {
      endpoint: "https://push/f1",
      keys: { p256dh: "a", auth: "b" },
    });
    await saveSubscription(db, flavio, {
      endpoint: "https://push/f2",
      keys: { p256dh: "a", auth: "b" },
    });
    await saveSubscription(db, dinis, {
      endpoint: "https://push/d1",
      keys: { p256dh: "a", auth: "b" },
    });
    const sent: { endpoint: string; message: PushMessage }[] = [];
    const send: PushSender = async (sub, message) => {
      sent.push({ endpoint: sub.endpoint, message });
      return sub.endpoint === "https://push/f2" ? "gone" : "sent";
    };

    expect(await sendDailyReminders(db, send, DAY)).toMatchObject({
      status: "sent",
      people: 2,
      notifications: 2,
    });
    expect(sent.map((s) => s.endpoint).sort()).toEqual([
      "https://push/d1",
      "https://push/f1",
      "https://push/f2",
    ]);
    // The device that unsubscribed is forgotten.
    const left = await db.query<{ endpoint: string }>("select endpoint from push_subscriptions");
    expect(left.map((r) => r.endpoint).sort()).toEqual(["https://push/d1", "https://push/f1"]);

    expect(await sendDailyReminders(db, send, DAY)).toEqual({ status: "already_sent", day: DAY });
    expect(sent).toHaveLength(3);
  });

  it("dry run sends nothing and doesn't use up the day", async () => {
    await add("Rever DMARC");
    let calls = 0;
    const send: PushSender = async () => {
      calls += 1;
      return "sent";
    };
    const preview = await sendDailyReminders(db, send, DAY, { dryRun: true });
    expect(preview.status).toBe("sent");
    expect(calls).toBe(0);
    expect((await sendDailyReminders(db, send, DAY)).status).toBe("sent");
  });
});
