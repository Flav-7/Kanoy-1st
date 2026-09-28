import type { Db } from "./db";
import { listAllOccurrences } from "./calendar";
import type { PushMessage, PushSender, PushSubscriptionInput } from "./push";
import {
  addDays,
  instantToWallTime,
  startOfDayInstant,
  type PlainDate,
} from "@/lib/calendar/dates";
import type { Occurrence } from "@/lib/calendar/types";

/**
 * Morning reminders: once a day (Vercel Cron, see vite.config.ts) everyone
 * with activities that day gets one notification listing them. An activity
 * is for its participants; one without participants is for its whole area.
 * Cancelled activities are left out. Runs at most once per day.
 */

/** The team's clock: "today" and the times in the message are Lisbon time. */
export const TEAM_TIME_ZONE = "Europe/Lisbon";
const MAX_LINES = 4;

/** Who should hear about each of the day's activities: userId → their occurrences. */
export async function remindersFor(
  db: Db,
  day: PlainDate,
  tz: string = TEAM_TIME_ZONE,
): Promise<Map<string, Occurrence[]>> {
  const occurrences = (
    await listAllOccurrences(db, {
      from: startOfDayInstant(day, tz),
      to: startOfDayInstant(addDays(day, 1), tz),
    })
  ).filter((o) => o.event.status !== "cancelled");
  if (occurrences.length === 0) return new Map();

  const calendarIds = [...new Set(occurrences.map((o) => o.event.calendarId))];
  const members = await db.query<{ calendar_id: string; user_id: string }>(
    "select calendar_id, user_id from calendar_members where calendar_id = any($1::uuid[])",
    [calendarIds],
  );
  const membersOf = new Map<string, Set<string>>();
  for (const m of members) {
    const key = String(m.calendar_id);
    if (!membersOf.has(key)) membersOf.set(key, new Set());
    membersOf.get(key)!.add(String(m.user_id));
  }

  const byUser = new Map<string, Occurrence[]>();
  for (const o of occurrences) {
    const area = membersOf.get(o.event.calendarId) ?? new Set<string>();
    // Participants who still belong to the area; nobody listed = the whole area.
    const participants = o.event.participants.filter((p) => area.has(p));
    for (const userId of participants.length ? participants : area) {
      if (!byUser.has(userId)) byUser.set(userId, []);
      byUser.get(userId)!.push(o);
    }
  }
  return byUser;
}

/** "Hoje · 2 atividades" / "09:30 Daily equipa\nDia inteiro · Visita fotos". */
export function describeDay(
  list: Occurrence[],
  day: PlainDate,
  tz: string = TEAM_TIME_ZONE,
): PushMessage {
  const lines = list.slice(0, MAX_LINES).map((o) => {
    const when = o.event.allDay ? "Dia inteiro ·" : instantToWallTime(o.start, tz).slice(11, 16);
    return `${when} ${o.event.title}`;
  });
  if (list.length > MAX_LINES) lines.push(`+${list.length - MAX_LINES} mais`);
  return {
    title: `Hoje · ${list.length} atividade${list.length === 1 ? "" : "s"}`,
    body: lines.join("\n"),
    url: "/calendario",
    tag: `daily-${day}`,
  };
}

export type ReminderRun =
  | { status: "already_sent"; day: PlainDate }
  | { status: "sent"; day: PlainDate; people: number; notifications: number };

/**
 * Sends the day's reminders once. `dryRun` claims nothing and sends nothing
 * (for checking what would go out).
 */
export async function sendDailyReminders(
  db: Db,
  send: PushSender,
  day: PlainDate,
  { dryRun = false, tz = TEAM_TIME_ZONE }: { dryRun?: boolean; tz?: string } = {},
): Promise<ReminderRun & { preview?: { userId: string; message: PushMessage }[] }> {
  if (!dryRun) {
    const claimed = await db.query(
      "insert into reminder_runs (day) values ($1) on conflict (day) do nothing returning day",
      [day],
    );
    if (claimed.length === 0) return { status: "already_sent", day };
  }

  const byUser = await remindersFor(db, day, tz);
  const messages = [...byUser].map(([userId, list]) => ({
    userId,
    message: describeDay(list, day, tz),
  }));
  if (dryRun)
    return { status: "sent", day, people: messages.length, notifications: 0, preview: messages };

  let notifications = 0;
  const gone: string[] = [];
  for (const { userId, message } of messages) {
    const subs = await db.query<{ endpoint: string; p256dh: string; auth: string }>(
      "select endpoint, p256dh, auth from push_subscriptions where user_id = $1",
      [userId],
    );
    const devices: PushSubscriptionInput[] = subs.map((s) => ({
      endpoint: s.endpoint,
      keys: { p256dh: s.p256dh, auth: s.auth },
    }));
    const results = await Promise.allSettled(devices.map((d) => send(d, message)));
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value === "sent") notifications += 1;
      if (r.status === "fulfilled" && r.value === "gone") gone.push(devices[i]!.endpoint);
    });
  }
  if (gone.length) {
    await db.query("delete from push_subscriptions where endpoint = any($1::text[])", [gone]);
  }
  await db.query("update reminder_runs set notified = $2 where day = $1", [day, notifications]);
  return { status: "sent", day, people: messages.length, notifications };
}
