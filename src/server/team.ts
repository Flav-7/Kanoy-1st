import type { Db } from "./db";
import { createPasswordToken, normalizeEmail } from "./auth";
import { createCalendar, createUser, findUserByEmail, setMember } from "./admin";
import { CALENDAR_COLORS, ROLES, type CalendarColor, type Role } from "@/lib/calendar/types";

/**
 * Areas (= calendars) and who belongs to them, managed from the site by the
 * people running it. Rules, all enforced here:
 *  - anyone who is admin of at least one area is a "manager" and may create
 *    new areas (becoming their admin);
 *  - only an area's admins see its members' emails and change its members;
 *  - an area always keeps at least one admin;
 *  - invite links can only be (re)issued for people who haven't set a
 *    password yet, so a manager can't take over an existing account.
 */

export type AreaMember = {
  userId: string;
  name: string;
  email: string;
  jobTitle: string | null;
  role: Role;
  /** False until they've used their invite link. */
  active: boolean;
};

export type ManagedArea = { id: string; name: string; color: CalendarColor; members: AreaMember[] };

export type TeamError = "FORBIDDEN" | "NOT_FOUND" | "LAST_ADMIN" | "INVALID_INPUT";
export type TeamResult<T = null> = { ok: true; value: T } | { ok: false; error: TeamError };

const ok = <T>(value: T): TeamResult<T> => ({ ok: true, value });
const fail = (error: TeamError): { ok: false; error: TeamError } => ({ ok: false, error });

async function isAdminOf(db: Db, calendarId: string, userId: string): Promise<boolean> {
  const [row] = await db.query(
    "select 1 from calendar_members where calendar_id = $1 and user_id = $2 and role = 'admin'",
    [calendarId, userId],
  );
  return Boolean(row);
}

export async function isManager(db: Db, userId: string): Promise<boolean> {
  const [row] = await db.query(
    "select 1 from calendar_members where user_id = $1 and role = 'admin' limit 1",
    [userId],
  );
  return Boolean(row);
}

export async function listManagedAreas(db: Db, userId: string): Promise<ManagedArea[]> {
  const rows = await db.query<{
    id: string;
    name: string;
    color: CalendarColor;
    user_id: string;
    user_name: string;
    email: string;
    job_title: string | null;
    role: Role;
    active: boolean;
  }>(
    `select c.id, c.name, c.color, u.id as user_id, u.name as user_name, u.email, u.job_title,
            m.role, (u.password_hash is not null) as active
       from calendars c
       join calendar_members me on me.calendar_id = c.id and me.user_id = $1 and me.role = 'admin'
       join calendar_members m on m.calendar_id = c.id
       join users u on u.id = m.user_id
      order by c.created_at, c.name,
               case m.role when 'admin' then 0 when 'editor' then 1 else 2 end, u.name`,
    [userId],
  );
  const areas = new Map<string, ManagedArea>();
  for (const r of rows) {
    const id = String(r.id);
    if (!areas.has(id)) areas.set(id, { id, name: r.name, color: r.color, members: [] });
    areas.get(id)!.members.push({
      userId: String(r.user_id),
      name: r.user_name,
      email: r.email,
      jobTitle: r.job_title ?? null,
      role: r.role,
      active: Boolean(r.active),
    });
  }
  return [...areas.values()];
}

function validArea(input: {
  name: string;
  color: string;
}): input is { name: string; color: CalendarColor } {
  const name = input.name.trim();
  return (
    name.length >= 1 && name.length <= 80 && CALENDAR_COLORS.includes(input.color as CalendarColor)
  );
}

export async function createArea(
  db: Db,
  userId: string,
  input: { name: string; color: string },
): Promise<TeamResult<{ id: string }>> {
  if (!(await isManager(db, userId))) return fail("FORBIDDEN");
  if (!validArea(input)) return fail("INVALID_INPUT");
  return ok(await createCalendar(db, { name: input.name, color: input.color, ownerId: userId }));
}

export async function updateArea(
  db: Db,
  userId: string,
  calendarId: string,
  input: { name: string; color: string },
): Promise<TeamResult> {
  if (!(await isAdminOf(db, calendarId, userId))) return fail("NOT_FOUND");
  if (!validArea(input)) return fail("INVALID_INPUT");
  await db.query("update calendars set name = $2, color = $3 where id = $1", [
    calendarId,
    input.name.trim(),
    input.color,
  ]);
  return ok(null);
}

async function adminCount(db: Db, calendarId: string): Promise<number> {
  const [row] = await db.query<{ n: number }>(
    "select count(*)::int as n from calendar_members where calendar_id = $1 and role = 'admin'",
    [calendarId],
  );
  return row?.n ?? 0;
}

async function roleOf(db: Db, calendarId: string, userId: string): Promise<Role | null> {
  const [row] = await db.query<{ role: Role }>(
    "select role from calendar_members where calendar_id = $1 and user_id = $2",
    [calendarId, userId],
  );
  return row?.role ?? null;
}

/**
 * Adds someone to an area (or changes their role there). Unknown emails
 * need a name and get a new account plus a one-time invite token to share.
 */
export async function addAreaMember(
  db: Db,
  actorId: string,
  calendarId: string,
  input: { email: string; name?: string | undefined; role: string },
): Promise<TeamResult<{ userId: string; inviteToken: string | null }>> {
  if (!(await isAdminOf(db, calendarId, actorId))) return fail("NOT_FOUND");
  if (!ROLES.includes(input.role as Role)) return fail("INVALID_INPUT");
  const role = input.role as Role;
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return fail("INVALID_INPUT");

  let user = await findUserByEmail(db, email);
  let inviteToken: string | null = null;
  if (!user) {
    const name = input.name?.trim() ?? "";
    if (name.length < 1 || name.length > 80) return fail("INVALID_INPUT");
    const created = await createUser(db, { email, name });
    user = { id: created.id, name };
    inviteToken = await createPasswordToken(db, created.id);
  }

  const current = await roleOf(db, calendarId, user.id);
  if (current === "admin" && role !== "admin" && (await adminCount(db, calendarId)) <= 1) {
    return fail("LAST_ADMIN");
  }
  await setMember(db, calendarId, user.id, role);
  return ok({ userId: user.id, inviteToken });
}

export async function removeAreaMember(
  db: Db,
  actorId: string,
  calendarId: string,
  memberId: string,
): Promise<TeamResult> {
  if (!(await isAdminOf(db, calendarId, actorId))) return fail("NOT_FOUND");
  const current = await roleOf(db, calendarId, memberId);
  if (!current) return fail("NOT_FOUND");
  if (current === "admin" && (await adminCount(db, calendarId)) <= 1) return fail("LAST_ADMIN");
  await db.query("delete from calendar_members where calendar_id = $1 and user_id = $2", [
    calendarId,
    memberId,
  ]);
  return ok(null);
}

/** A fresh invite link for a member of your area who hasn't set a password yet. */
export async function reissueInvite(
  db: Db,
  actorId: string,
  calendarId: string,
  memberId: string,
): Promise<TeamResult<{ inviteToken: string }>> {
  if (!(await isAdminOf(db, calendarId, actorId))) return fail("NOT_FOUND");
  if (!(await roleOf(db, calendarId, memberId))) return fail("NOT_FOUND");
  const [row] = await db.query<{ pending: boolean }>(
    "select password_hash is null as pending from users where id = $1",
    [memberId],
  );
  if (!row?.pending) return fail("FORBIDDEN");
  return ok({ inviteToken: await createPasswordToken(db, memberId) });
}

export async function updateProfile(
  db: Db,
  userId: string,
  input: { name: string; jobTitle: string },
): Promise<TeamResult<{ name: string; jobTitle: string | null }>> {
  const name = input.name.trim();
  const jobTitle = input.jobTitle.trim() || null;
  if (name.length < 1 || name.length > 80 || (jobTitle?.length ?? 0) > 60)
    return fail("INVALID_INPUT");
  await db.query("update users set name = $2, job_title = $3 where id = $1", [
    userId,
    name,
    jobTitle,
  ]);
  return ok({ name, jobTitle });
}

export async function getProfile(
  db: Db,
  userId: string,
): Promise<{ name: string; email: string; jobTitle: string | null } | null> {
  const [row] = await db.query<{ name: string; email: string; job_title: string | null }>(
    "select name, email, job_title from users where id = $1",
    [userId],
  );
  return row ? { name: row.name, email: row.email, jobTitle: row.job_title ?? null } : null;
}
