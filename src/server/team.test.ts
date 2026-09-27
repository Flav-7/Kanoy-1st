import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrate, type Db } from "./db";
import { createPgliteDb } from "./pglite-db";
import { createCalendar, createUser, setMember } from "./admin";
import { createEvent } from "./calendar";
import {
  addAreaMember,
  createArea,
  listManagedAreas,
  reissueInvite,
  removeAreaMember,
  updateProfile,
} from "./team";
import {
  describeChange,
  notifyArea,
  recipientsFor,
  saveSubscription,
  type PushSender,
} from "./push";

let db: Db & { close(): Promise<void> };
let flavio: string; // admin of Websites
let dinis: string; // admin of Websites
let cliente: string; // viewer of Websites
let outsider: string; // not in Websites
let websites: string;

beforeEach(async () => {
  db = await createPgliteDb();
  await migrate(db);
  flavio = (
    await createUser(db, { email: "flavio@kanoy.test", name: "Flávio", password: "x-password-1" })
  ).id;
  dinis = (
    await createUser(db, { email: "dinis@kanoy.test", name: "Dinis", password: "x-password-2" })
  ).id;
  cliente = (await createUser(db, { email: "cliente@kanoy.test", name: "Cliente" })).id;
  outsider = (await createUser(db, { email: "outsider@kanoy.test", name: "Outsider" })).id;
  websites = (await createCalendar(db, { name: "Websites", color: "cyan", ownerId: flavio })).id;
  await setMember(db, websites, dinis, "admin");
  await setMember(db, websites, cliente, "viewer");
});

afterEach(async () => {
  await db.close();
});

describe("areas", () => {
  it("lets managers create areas and refuses everyone else", async () => {
    const created = await createArea(db, dinis, { name: "Redes sociais", color: "violet" });
    expect(created.ok).toBe(true);
    expect(await createArea(db, cliente, { name: "X", color: "cyan" })).toEqual({
      ok: false,
      error: "FORBIDDEN",
    });
    expect(await createArea(db, dinis, { name: "X", color: "pink" })).toEqual({
      ok: false,
      error: "INVALID_INPUT",
    });
  });

  it("shows members and emails only to that area's admins", async () => {
    const [area] = await listManagedAreas(db, flavio);
    expect(area?.members.map((m) => m.email).sort()).toEqual([
      "cliente@kanoy.test",
      "dinis@kanoy.test",
      "flavio@kanoy.test",
    ]);
    expect(await listManagedAreas(db, cliente)).toEqual([]);
    expect(await listManagedAreas(db, outsider)).toEqual([]);
  });
});

describe("people", () => {
  it("creates new people with a one-time invite and adds existing ones directly", async () => {
    const fresh = await addAreaMember(db, flavio, websites, {
      email: "Nova@Kanoy.test",
      name: "Nova",
      role: "viewer",
    });
    expect(fresh).toMatchObject({ ok: true, value: { inviteToken: expect.any(String) } });

    const existing = await addAreaMember(db, flavio, websites, {
      email: "outsider@kanoy.test",
      role: "editor",
    });
    expect(existing).toMatchObject({ ok: true, value: { userId: outsider, inviteToken: null } });

    expect(
      await addAreaMember(db, flavio, websites, { email: "ghost@kanoy.test", role: "viewer" }),
    ).toEqual({
      ok: false,
      error: "INVALID_INPUT", // new person without a name
    });
  });

  it("only admins of the area manage it; others don't learn it exists", async () => {
    expect(
      await addAreaMember(db, cliente, websites, { email: "a@b.pt", name: "A", role: "admin" }),
    ).toEqual({
      ok: false,
      error: "NOT_FOUND",
    });
    expect(await removeAreaMember(db, outsider, websites, cliente)).toEqual({
      ok: false,
      error: "NOT_FOUND",
    });
  });

  it("never leaves an area without an admin", async () => {
    await removeAreaMember(db, flavio, websites, dinis);
    expect(await removeAreaMember(db, flavio, websites, flavio)).toEqual({
      ok: false,
      error: "LAST_ADMIN",
    });
    expect(
      await addAreaMember(db, flavio, websites, { email: "flavio@kanoy.test", role: "viewer" }),
    ).toEqual({
      ok: false,
      error: "LAST_ADMIN",
    });
  });

  it("reissues invites only for people who haven't set a password", async () => {
    expect((await reissueInvite(db, flavio, websites, cliente)).ok).toBe(true);
    expect(await reissueInvite(db, flavio, websites, dinis)).toEqual({
      ok: false,
      error: "FORBIDDEN",
    });
  });

  it("validates the profile", async () => {
    expect(
      await updateProfile(db, flavio, { name: " Flávio ", jobTitle: " Web Designer " }),
    ).toEqual({
      ok: true,
      value: { name: "Flávio", jobTitle: "Web Designer" },
    });
    expect(await updateProfile(db, flavio, { name: "", jobTitle: "" })).toEqual({
      ok: false,
      error: "INVALID_INPUT",
    });
  });
});

describe("notifications", () => {
  const sub = (n: number) => ({
    endpoint: `https://push.test/${n}`,
    keys: { p256dh: `p${n}`, auth: `a${n}` },
  });

  it("go to every device of the area's members except the author", async () => {
    await saveSubscription(db, flavio, sub(1));
    await saveSubscription(db, dinis, sub(2));
    await saveSubscription(db, cliente, sub(3));
    await saveSubscription(db, cliente, sub(4));
    await saveSubscription(db, outsider, sub(5));
    const endpoints = (await recipientsFor(db, websites, flavio)).map((r) => r.endpoint).sort();
    expect(endpoints).toEqual([sub(2).endpoint, sub(3).endpoint, sub(4).endpoint]);
  });

  it("describe the activity and forget devices that unsubscribed", async () => {
    await saveSubscription(db, cliente, sub(1));
    await saveSubscription(db, dinis, sub(2));
    const created = await createEvent(db, flavio, {
      calendarId: websites,
      title: "Apresentação da proposta",
      description: "",
      allDay: false,
      timezone: "Europe/Lisbon",
      start: "2026-10-05T14:00",
      end: "2026-10-05T15:30",
      category: "proposal_meeting",
      status: "confirmed",
      participants: [flavio],
      recurrence: null,
    });
    if (!created.ok || !created.event) throw new Error("create failed");

    const sent: string[] = [];
    const send: PushSender = async (s, message) => {
      sent.push(`${s.endpoint} ${message.title} | ${message.body}`);
      return s.endpoint === sub(2).endpoint ? "gone" : "sent";
    };
    expect(await notifyArea(db, send, created.event, flavio, "created")).toBe(1);
    expect(sent).toContain(
      `${sub(1).endpoint} Nova atividade · Websites | Apresentação da proposta — seg, 5 out, 14:00–15:30`,
    );
    expect((await recipientsFor(db, websites, flavio)).map((r) => r.endpoint)).toEqual([
      sub(1).endpoint,
    ]);
  });

  it("move a device to whoever subscribes it last", async () => {
    await saveSubscription(db, cliente, sub(1));
    await saveSubscription(db, dinis, sub(1));
    expect((await recipientsFor(db, websites, dinis)).length).toBe(0);
  });

  it("say when an activity takes the whole day", () => {
    const msg = describeChange(
      {
        id: "e",
        calendarId: websites,
        title: "Sessão fotográfica",
        description: null,
        startAt: "2026-10-06T23:00:00.000Z",
        endAt: "2026-10-07T23:00:00.000Z",
        timezone: "Europe/Lisbon",
        allDay: true,
        category: "photo_visit",
        status: "confirmed",
        recurrence: null,
        exdates: [],
        participants: [],
        createdBy: flavio,
        createdAt: "",
        updatedAt: "",
        version: 1,
      },
      "Redes sociais",
      "cancelled",
    );
    expect(msg).toMatchObject({
      title: "Atividade cancelada · Redes sociais",
      body: "Sessão fotográfica — qua, 7 out (dia inteiro)",
    });
  });
});
