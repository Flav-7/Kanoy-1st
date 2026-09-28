import type { Db } from "./db";
import { createCalendar, createUser, setMember } from "./admin";
import { createEvent } from "./calendar";
import { addDays, startOfWeek, todayIn } from "@/lib/calendar/dates";

/**
 * Test data for the LOCAL dev database only (never Neon): three accounts
 * sharing the password below, two calendars and a few events this week.
 * Runs once, when the dev database has no users yet.
 */
export const DEV_PASSWORD = "kanoy-dev-2026";
export const DEV_ACCOUNTS = [
  { email: "ana@kanoy.test", name: "Ana" },
  { email: "bruno@kanoy.test", name: "Bruno" },
  { email: "carla@kanoy.test", name: "Carla" },
] as const;

export async function seedDevData(db: Db): Promise<void> {
  const [{ n } = { n: 0 }] = await db.query<{ n: number }>("select count(*)::int as n from users");
  if (n > 0) return;

  const [ana, bruno, carla] = await Promise.all(
    DEV_ACCOUNTS.map((a) => createUser(db, { ...a, password: DEV_PASSWORD }).then((u) => u.id)),
  );
  const geral = (await createCalendar(db, { name: "Geral", color: "cyan", ownerId: ana! })).id;
  const marketing = (
    await createCalendar(db, { name: "Marketing", color: "violet", ownerId: ana! })
  ).id;
  await setMember(db, geral, bruno!, "editor");
  await setMember(db, geral, carla!, "editor");
  await setMember(db, marketing, bruno!, "viewer");
  await db.query("update users set can_see_errors = true where id = $1", [ana!]);

  const tz = "Europe/Lisbon";
  const monday = startOfWeek(todayIn(tz));
  const at = (day: number, time: string) => `${addDays(monday, day)}T${time}`;
  const base = { description: "", timezone: tz, status: "confirmed", recurrence: null } as const;

  await createEvent(db, ana!, {
    ...base,
    calendarId: geral,
    title: "Daily equipa",
    allDay: false,
    start: at(0, "09:30"),
    end: at(0, "09:45"),
    category: "production_meeting",
    participants: [ana!, bruno!, carla!],
    recurrence: { freq: "DAILY", interval: 1, until: addDays(monday, 4) },
  });
  await createEvent(db, bruno!, {
    ...base,
    calendarId: geral,
    title: "Entrega website Tierra y Mar",
    description: "Última revisão com o cliente antes de publicar.",
    allDay: false,
    start: at(2, "14:00"),
    end: at(2, "16:00"),
    category: "closing_meeting",
    participants: [bruno!, carla!],
  });
  await createEvent(db, ana!, {
    ...base,
    calendarId: marketing,
    title: "Planeamento de conteúdos",
    allDay: false,
    start: at(3, "11:00"),
    end: at(3, "12:30"),
    category: "photo_visit",
    participants: [ana!],
  });
  await createEvent(db, carla!, {
    ...base,
    calendarId: geral,
    title: "Workshop fora",
    allDay: true,
    start: addDays(monday, 4),
    end: addDays(monday, 5),
    category: "other",
    participants: [carla!],
  });
}
