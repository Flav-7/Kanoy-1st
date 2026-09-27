import type { Db } from "./db";
import { hashPassword, normalizeEmail } from "./auth";
import type { CalendarColor, Role } from "@/lib/calendar/types";

/**
 * Account and calendar administration. There is no sign-up and no admin UI
 * yet: these run from scripts/admin.ts (and the local dev seed / tests).
 */

export async function createUser(
  db: Db,
  input: { email: string; name: string; password?: string },
): Promise<{ id: string }> {
  const passwordHash = input.password ? await hashPassword(input.password) : null;
  const [row] = await db.query<{ id: string }>(
    "insert into users (email, name, password_hash) values ($1, $2, $3) returning id",
    [normalizeEmail(input.email), input.name.trim(), passwordHash],
  );
  return { id: String(row!.id) };
}

export async function findUserByEmail(
  db: Db,
  email: string,
): Promise<{ id: string; name: string } | null> {
  const [row] = await db.query<{ id: string; name: string }>(
    "select id, name from users where email = $1",
    [normalizeEmail(email)],
  );
  return row ? { id: String(row.id), name: row.name } : null;
}

/** Creates a calendar; its owner becomes its first admin. */
export async function createCalendar(
  db: Db,
  input: { name: string; color: CalendarColor; ownerId: string },
): Promise<{ id: string }> {
  const [row] = await db.query<{ id: string }>(
    `with c as (
       insert into calendars (name, color, owner_id) values ($1, $2, $3) returning id
     ), m as (
       insert into calendar_members (calendar_id, user_id, role) select id, $3, 'admin' from c
     )
     select id from c`,
    [input.name.trim(), input.color, input.ownerId],
  );
  return { id: String(row!.id) };
}

export async function findCalendarByName(db: Db, name: string): Promise<{ id: string } | null> {
  const [row] = await db.query<{ id: string }>(
    "select id from calendars where lower(name) = lower($1) order by created_at limit 1",
    [name.trim()],
  );
  return row ? { id: String(row.id) } : null;
}

/** Adds a member, or changes their role if they already are one. */
export async function setMember(
  db: Db,
  calendarId: string,
  userId: string,
  role: Role,
): Promise<void> {
  await db.query(
    `insert into calendar_members (calendar_id, user_id, role) values ($1, $2, $3)
     on conflict (calendar_id, user_id) do update set role = excluded.role`,
    [calendarId, userId, role],
  );
}
