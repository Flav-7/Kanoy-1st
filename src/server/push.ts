import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { Db } from "./db";
import { toZoned } from "@/lib/calendar/dates";
import type { CalendarEvent } from "@/lib/calendar/types";

/**
 * Phone/desktop notifications (Web Push) for activity in an area. Each
 * device that allowed notifications stores a subscription; when an activity
 * in an area is created, changed, cancelled or deleted, every member of that
 * area except whoever did it gets a push on each of their devices.
 */

export type PushSubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

export type PushMessage = { title: string; body: string; url: string; tag: string };

/** Delivers one message to one device. Resolves to "gone" when the device unsubscribed. */
export type PushSender = (
  subscription: PushSubscriptionInput,
  message: PushMessage,
) => Promise<"sent" | "gone">;

export async function saveSubscription(
  db: Db,
  userId: string,
  sub: PushSubscriptionInput,
): Promise<void> {
  // The same device may have been used by someone else before: it now belongs to this user.
  await db.query(
    `insert into push_subscriptions (endpoint, user_id, p256dh, auth) values ($1, $2, $3, $4)
     on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    [sub.endpoint, userId, sub.keys.p256dh, sub.keys.auth],
  );
}

export async function deleteSubscription(db: Db, userId: string, endpoint: string): Promise<void> {
  await db.query("delete from push_subscriptions where endpoint = $1 and user_id = $2", [
    endpoint,
    userId,
  ]);
}

/** Devices of everyone in the area except the person who made the change. */
export async function recipientsFor(
  db: Db,
  calendarId: string,
  actorId: string,
): Promise<PushSubscriptionInput[]> {
  const rows = await db.query<{ endpoint: string; p256dh: string; auth: string }>(
    `select s.endpoint, s.p256dh, s.auth
       from push_subscriptions s
       join calendar_members m on m.user_id = s.user_id and m.calendar_id = $1
      where s.user_id <> $2`,
    [calendarId, actorId],
  );
  return rows.map((r) => ({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }));
}

export type ChangeKind = "created" | "updated" | "cancelled" | "deleted";

const HEADLINES: Record<ChangeKind, string> = {
  created: "Nova atividade",
  updated: "Atividade alterada",
  cancelled: "Atividade cancelada",
  deleted: "Atividade eliminada",
};

/**
 * "Nova atividade · Websites" / "Reunião com cliente — seg., 28 set., 14:00–15:00".
 * Written in Portuguese (the team's language) on the event's own clock.
 */
export function describeChange(
  event: CalendarEvent,
  areaName: string,
  kind: ChangeKind,
  occurrenceStart?: string,
): PushMessage {
  const tz = event.timezone;
  const start = occurrenceStart ?? event.startAt;
  const end = occurrenceStart
    ? new Date(
        Date.parse(occurrenceStart) + (Date.parse(event.endAt) - Date.parse(event.startAt)),
      ).toISOString()
    : event.endAt;
  const day = format(toZoned(start, tz), "EEE, d MMM", { locale: pt });
  const when = event.allDay
    ? `${day} (dia inteiro)`
    : `${day}, ${format(toZoned(start, tz), "HH:mm")}–${format(toZoned(end, tz), "HH:mm")}`;
  return {
    title: `${HEADLINES[kind]} · ${areaName}`,
    body: `${event.title} — ${when}`,
    url: "/calendario",
    tag: `event-${event.id}`,
  };
}

/** Sends to every recipient, dropping subscriptions of devices that no longer exist. */
export async function notifyArea(
  db: Db,
  send: PushSender,
  event: CalendarEvent,
  actorId: string,
  kind: ChangeKind,
  occurrenceStart?: string,
): Promise<number> {
  const recipients = await recipientsFor(db, event.calendarId, actorId);
  if (recipients.length === 0) return 0;
  const [area] = await db.query<{ name: string }>("select name from calendars where id = $1", [
    event.calendarId,
  ]);
  const message = describeChange(event, area?.name ?? "Calendário", kind, occurrenceStart);

  const results = await Promise.allSettled(recipients.map((r) => send(r, message)));
  const gone = recipients.filter((_, i) => {
    const r = results[i];
    return r?.status === "fulfilled" && r.value === "gone";
  });
  if (gone.length) {
    await db.query("delete from push_subscriptions where endpoint = any($1::text[])", [
      gone.map((g) => g.endpoint),
    ]);
  }
  return results.filter((r) => r.status === "fulfilled" && r.value === "sent").length;
}
