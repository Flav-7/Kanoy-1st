import { randomUUID } from "node:crypto";
import { toIso, type Db, type Row } from "./db";
import { eventBounds, instantToPlainDate } from "@/lib/calendar/dates";
import {
  expandOccurrences,
  parseRule,
  recurrenceEnd,
  serializeRule,
} from "@/lib/calendar/recurrence";
import { canEditEvents } from "@/lib/calendar/permissions";
import {
  asCategory,
  type CalendarColor,
  type CalendarEvent,
  type CalendarSummary,
  type EventInput,
  type EventStatus,
  type MutationResult,
  type Occurrence,
  type Role,
  type TeamMember,
} from "@/lib/calendar/types";

/**
 * Calendar business logic. Every function takes the acting user's id and
 * checks their membership/role itself, straight from the database — never
 * from anything the client says about permissions. A calendar or event the
 * user isn't a member of behaves as if it doesn't exist (NOT_FOUND), so ids
 * can't be probed.
 */

/** Widest range one request may ask for: 6 weeks of month view plus padding. */
const MAX_RANGE_DAYS = 70;

const EVENT_COLUMNS = `
  e.id, e.calendar_id, e.title, e.description, e.start_at, e.end_at, e.timezone,
  e.all_day, e.category, e.status, e.recurrence_rule, to_json(e.exdates) as exdates,
  e.created_by, e.created_at, e.updated_at, e.version,
  coalesce(
    (select json_agg(p.user_id order by p.user_id) from event_participants p where p.event_id = e.id),
    '[]'::json
  ) as participants`;

function mapEvent(row: Row): CalendarEvent {
  return {
    id: String(row["id"]),
    calendarId: String(row["calendar_id"]),
    title: String(row["title"]),
    description: (row["description"] as string | null) ?? null,
    startAt: toIso(row["start_at"]),
    endAt: toIso(row["end_at"]),
    timezone: String(row["timezone"]),
    allDay: Boolean(row["all_day"]),
    category: asCategory(row["category"]),
    status: row["status"] as EventStatus,
    recurrence: parseRule((row["recurrence_rule"] as string | null) ?? null),
    exdates: ((row["exdates"] as unknown[] | null) ?? []).map(toIso),
    participants: ((row["participants"] as unknown[] | null) ?? []).map(String),
    createdBy: String(row["created_by"]),
    createdAt: toIso(row["created_at"]),
    updatedAt: toIso(row["updated_at"]),
    version: Number(row["version"]),
  };
}

async function roleIn(db: Db, calendarId: string, userId: string): Promise<Role | null> {
  const [row] = await db.query<{ role: Role }>(
    "select role from calendar_members where calendar_id = $1 and user_id = $2",
    [calendarId, userId],
  );
  return row?.role ?? null;
}

/** The event plus the acting user's role in its calendar (null: not a member). */
async function loadForUser(
  db: Db,
  eventId: string,
  userId: string,
): Promise<{ event: CalendarEvent; role: Role | null } | null> {
  const [row] = await db.query(
    `select ${EVENT_COLUMNS}, m.role
       from events e
       left join calendar_members m on m.calendar_id = e.calendar_id and m.user_id = $2
      where e.id = $1`,
    [eventId, userId],
  );
  if (!row) return null;
  return { event: mapEvent(row), role: (row["role"] as Role | null) ?? null };
}

export async function getEvent(
  db: Db,
  userId: string,
  eventId: string,
): Promise<CalendarEvent | null> {
  const found = await loadForUser(db, eventId, userId);
  return found?.role ? found.event : null;
}

export async function listCalendars(db: Db, userId: string): Promise<CalendarSummary[]> {
  const rows = await db.query(
    `select c.id, c.name, c.color, m.role,
            (select json_agg(cm.user_id) from calendar_members cm where cm.calendar_id = c.id) as member_ids,
            (select json_agg(cm.user_id) from calendar_members cm
              where cm.calendar_id = c.id and cm.role in ('editor', 'admin')) as editor_ids
       from calendars c
       join calendar_members m on m.calendar_id = c.id and m.user_id = $1
      order by c.created_at, c.name`,
    [userId],
  );
  return rows.map((r) => ({
    id: String(r["id"]),
    name: String(r["name"]),
    color: r["color"] as CalendarColor,
    role: r["role"] as Role,
    memberIds: ((r["member_ids"] as unknown[] | null) ?? []).map(String),
    editorIds: ((r["editor_ids"] as unknown[] | null) ?? []).map(String),
  }));
}

/** Everyone who shares at least one calendar with the user. */
export async function listTeam(db: Db, userId: string): Promise<TeamMember[]> {
  const rows = await db.query<{ id: string; name: string; job_title: string | null }>(
    `select distinct u.id, u.name, u.job_title
       from users u
       join calendar_members cm on cm.user_id = u.id
      where cm.calendar_id in (select calendar_id from calendar_members where user_id = $1)
      order by u.name`,
    [userId],
  );
  return rows.map((r) => ({ id: String(r.id), name: r.name, jobTitle: r.job_title ?? null }));
}

export class InvalidRangeError extends Error {
  constructor() {
    super("INVALID_RANGE");
  }
}

/** Occurrences overlapping [from, to) in the user's calendars, optionally only some of them. */
export async function listOccurrences(
  db: Db,
  userId: string,
  range: { from: Date; to: Date; calendarIds: string[] | null },
): Promise<Occurrence[]> {
  const span = +range.to - +range.from;
  if (!(span > 0) || span > MAX_RANGE_DAYS * 86_400_000) throw new InvalidRangeError();

  const rows = await db.query(
    `select ${EVENT_COLUMNS}
       from events e
       join calendar_members m on m.calendar_id = e.calendar_id and m.user_id = $1
      where e.start_at < $3
        and (
          (e.recurrence_rule is null and e.end_at > $2)
          or (e.recurrence_rule is not null and (e.recurrence_until is null or e.recurrence_until > $2))
        )
        and ($4::uuid[] is null or e.calendar_id = any($4::uuid[]))`,
    [userId, range.from, range.to, range.calendarIds],
  );
  return rows
    .flatMap((r) => expandOccurrences(mapEvent(r), range.from, range.to))
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}

/**
 * Every occurrence overlapping [from, to) across all calendars. For server
 * jobs (the morning reminders); never hand this to a user as is.
 */
export async function listAllOccurrences(
  db: Db,
  range: { from: Date; to: Date },
): Promise<Occurrence[]> {
  const rows = await db.query(
    `select ${EVENT_COLUMNS}
       from events e
      where e.start_at < $2
        and (
          (e.recurrence_rule is null and e.end_at > $1)
          or (e.recurrence_rule is not null and (e.recurrence_until is null or e.recurrence_until > $1))
        )`,
    [range.from, range.to],
  );
  return rows
    .flatMap((r) => expandOccurrences(mapEvent(r), range.from, range.to))
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}

// ── Mutations ────────────────────────────────────────────────────────────

type Prepared = {
  startAt: Date;
  endAt: Date;
  rule: string | null;
  until: Date | null;
  participants: string[];
};

/** Validates input against the target calendar; returns the values to store or an error. */
async function prepare(
  db: Db,
  input: EventInput,
): Promise<
  | { ok: true; value: Prepared }
  | { ok: false; error: "INVALID_EVENT_DURATION" | "INVALID_PARTICIPANTS" | "INVALID_INPUT" }
> {
  const { startAt, endAt } = eventBounds(input);
  if (!(endAt > startAt)) return { ok: false, error: "INVALID_EVENT_DURATION" };

  const r = input.recurrence;
  if (r?.until && r.until < instantToPlainDate(startAt, input.timezone)) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const participants = [...new Set(input.participants)];
  if (participants.length) {
    const [{ n } = { n: 0 }] = await db.query<{ n: number }>(
      "select count(*)::int as n from calendar_members where calendar_id = $1 and user_id = any($2::uuid[])",
      [input.calendarId, participants],
    );
    if (n !== participants.length) return { ok: false, error: "INVALID_PARTICIPANTS" };
  }

  return {
    ok: true,
    value: {
      startAt,
      endAt,
      rule: r ? serializeRule(r) : null,
      until: r ? recurrenceEnd(r, input.timezone) : null,
      participants,
    },
  };
}

export async function createEvent(
  db: Db,
  userId: string,
  input: EventInput,
): Promise<MutationResult> {
  const role = await roleIn(db, input.calendarId, userId);
  if (!role) return { ok: false, error: "NOT_FOUND" };
  if (!canEditEvents(role)) return { ok: false, error: "FORBIDDEN" };

  const prepared = await prepare(db, input);
  if (!prepared.ok) return prepared;
  const v = prepared.value;

  const id = randomUUID();
  await db.batch([
    {
      text: `insert into events (id, calendar_id, title, description, start_at, end_at, timezone,
               all_day, category, status, recurrence_rule, recurrence_until, created_by)
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      params: [
        id,
        input.calendarId,
        input.title,
        input.description || null,
        v.startAt,
        v.endAt,
        input.timezone,
        input.allDay,
        input.category,
        input.status,
        v.rule,
        v.until,
        userId,
      ],
    },
    {
      text: "insert into event_participants (event_id, user_id) select $1::uuid, unnest($2::uuid[])",
      params: [id, v.participants],
    },
  ]);
  return { ok: true, event: await getEvent(db, userId, id) };
}

/**
 * Replaces an event with `input`, only if it is still at `expectedVersion`.
 * A client editing a stale copy gets CONFLICT plus the latest version instead
 * of silently overwriting someone else's change.
 */
export async function updateEvent(
  db: Db,
  userId: string,
  eventId: string,
  expectedVersion: number,
  input: EventInput,
): Promise<MutationResult> {
  const found = await loadForUser(db, eventId, userId);
  if (!found?.role) return { ok: false, error: "NOT_FOUND" };
  if (!canEditEvents(found.role)) return { ok: false, error: "FORBIDDEN" };
  if (found.event.version !== expectedVersion) {
    return { ok: false, error: "CONFLICT", latest: found.event };
  }
  if (input.calendarId !== found.event.calendarId) {
    const targetRole = await roleIn(db, input.calendarId, userId);
    if (!canEditEvents(targetRole)) return { ok: false, error: "FORBIDDEN" };
  }

  const prepared = await prepare(db, input);
  if (!prepared.ok) return prepared;
  const v = prepared.value;

  // Cancelled occurrences only still make sense if the series didn't move.
  const current = found.event;
  const sameSeries =
    v.rule !== null &&
    v.startAt.toISOString() === current.startAt &&
    current.recurrence !== null &&
    v.rule === serializeRule(current.recurrence);
  const exdates = sameSeries ? current.exdates : [];

  // One statement: the version check, the update and the participant sync
  // either all happen or none do.
  const updated = await db.query(
    `with upd as (
       update events set
         calendar_id = $3, title = $4, description = $5, start_at = $6, end_at = $7,
         timezone = $8, all_day = $9, category = $10, status = $11,
         recurrence_rule = $12, recurrence_until = $13, exdates = $14::timestamptz[],
         updated_at = now(), version = version + 1
        where id = $1 and version = $2
        returning id
     ), removed as (
       delete from event_participants
        where event_id in (select id from upd) and not (user_id = any($15::uuid[]))
     ), added as (
       insert into event_participants (event_id, user_id)
       select upd.id, p from upd cross join unnest($15::uuid[]) as p
       on conflict do nothing
     )
     select id from upd`,
    [
      eventId,
      expectedVersion,
      input.calendarId,
      input.title,
      input.description || null,
      v.startAt,
      v.endAt,
      input.timezone,
      input.allDay,
      input.category,
      input.status,
      v.rule,
      v.until,
      exdates,
      v.participants,
    ],
  );
  if (updated.length === 0) return conflictOrGone(db, userId, eventId);
  return { ok: true, event: await getEvent(db, userId, eventId) };
}

/**
 * Deletes an event (a whole series), or — with `occurrenceStart` on a
 * recurring event — cancels just that occurrence. Same version rule as updates.
 */
export async function deleteEvent(
  db: Db,
  userId: string,
  eventId: string,
  expectedVersion: number,
  occurrenceStart: string | null,
): Promise<MutationResult> {
  const found = await loadForUser(db, eventId, userId);
  if (!found?.role) return { ok: false, error: "NOT_FOUND" };
  if (!canEditEvents(found.role)) return { ok: false, error: "FORBIDDEN" };
  if (found.event.version !== expectedVersion) {
    return { ok: false, error: "CONFLICT", latest: found.event };
  }

  if (occurrenceStart && found.event.recurrence) {
    const rows = await db.query(
      `update events set exdates = array_append(exdates, $3::timestamptz),
              updated_at = now(), version = version + 1
        where id = $1 and version = $2
        returning id`,
      [eventId, expectedVersion, occurrenceStart],
    );
    if (rows.length === 0) return conflictOrGone(db, userId, eventId);
    return { ok: true, event: await getEvent(db, userId, eventId) };
  }

  const rows = await db.query("delete from events where id = $1 and version = $2 returning id", [
    eventId,
    expectedVersion,
  ]);
  if (rows.length === 0) return conflictOrGone(db, userId, eventId);
  return { ok: true, event: null };
}

/** After a version-guarded write matched nothing: someone changed or deleted it first. */
async function conflictOrGone(db: Db, userId: string, eventId: string): Promise<MutationResult> {
  const latest = await getEvent(db, userId, eventId);
  return latest ? { ok: false, error: "CONFLICT", latest } : { ok: false, error: "NOT_FOUND" };
}
