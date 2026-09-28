import { createHash } from "node:crypto";
import type { Db } from "./db";

/**
 * The site's error log, shown on /erros to the people allowed to see it
 * (users.can_see_errors). Errors from visitors' browsers and from the server
 * land here, one row per distinct error with a counter, so the page stays a
 * short to-do list rather than a flood. The table is capped, so a burst (or
 * someone posting junk) can't fill the database.
 */

export type ErrorSource = "browser" | "server";

export type ErrorInput = {
  source: ErrorSource;
  message: string;
  detail?: string | null;
  url?: string | null;
  userAgent?: string | null;
  userId?: string | null;
};

export type ErrorReport = {
  id: string;
  source: ErrorSource;
  message: string;
  detail: string | null;
  url: string | null;
  userAgent: string | null;
  count: number;
  firstSeen: string;
  lastSeen: string;
  /** Who hit it last (name), when they were signed in. */
  lastUser: string | null;
  resolved: boolean;
};

export const MAX_ERROR_ROWS = 300;
const LIMITS = { message: 500, detail: 6000, url: 500, userAgent: 300 };

/**
 * Noise that isn't ours to fix: browser extensions, the well-known harmless
 * ResizeObserver warning, cross-origin "Script error." with no detail, and
 * network drops (the person lost connection).
 */
export function isNoise(input: Pick<ErrorInput, "message" | "detail">): boolean {
  const text = `${input.message}\n${input.detail ?? ""}`;
  return (
    /(chrome|moz|safari(-web)?)-extension:\/\//.test(text) ||
    /ResizeObserver loop/.test(text) ||
    /^Script error\.?$/.test(input.message.trim()) ||
    /^(TypeError: )?(Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)$/.test(
      input.message.trim(),
    )
  );
}

function clip(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * Same error = same source, message (numbers and ids blanked out) and first
 * line of the stack that points into the code.
 */
export function fingerprint(input: Pick<ErrorInput, "source" | "message" | "detail">): string {
  const message = input.message.replace(/[0-9a-f]{8,}|\d+/gi, "#");
  const frame =
    (input.detail ?? "")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => /^at |@/.test(l))
      ?.replace(/[?#].*?(?=:\d)/, "")
      .replace(/:\d+:\d+\)?$/, "") ?? "";
  return createHash("sha256").update(`${input.source}\n${message}\n${frame}`).digest("hex");
}

/** Stores an error (or counts one more of it). Returns false when it was ignored as noise. */
export async function recordError(db: Db, input: ErrorInput): Promise<boolean> {
  const message = clip(input.message.trim(), LIMITS.message);
  if (!message || isNoise(input)) return false;
  const [row] = await db.query<{ inserted: boolean }>(
    `insert into error_reports (fingerprint, source, message, detail, url, user_agent, last_user_id)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (fingerprint) do update
        set count = error_reports.count + 1,
            last_seen = now(),
            message = excluded.message,
            detail = coalesce(excluded.detail, error_reports.detail),
            url = coalesce(excluded.url, error_reports.url),
            user_agent = coalesce(excluded.user_agent, error_reports.user_agent),
            last_user_id = coalesce(excluded.last_user_id, error_reports.last_user_id),
            -- It came back: it wasn't fixed after all.
            resolved = false
     returning (xmax = 0) as inserted`,
    [
      fingerprint({ source: input.source, message, detail: input.detail ?? null }),
      input.source,
      message,
      clip(input.detail, LIMITS.detail),
      clip(input.url, LIMITS.url),
      clip(input.userAgent, LIMITS.userAgent),
      input.userId ?? null,
    ],
  );
  if (row?.inserted) {
    await db.query(
      `delete from error_reports
        where id not in (select id from error_reports order by last_seen desc limit $1)`,
      [MAX_ERROR_ROWS],
    );
  }
  return true;
}

export async function canSeeErrors(db: Db, userId: string): Promise<boolean> {
  const [row] = await db.query<{ can_see_errors: boolean }>(
    "select can_see_errors from users where id = $1",
    [userId],
  );
  return Boolean(row?.can_see_errors);
}

export async function setErrorViewer(db: Db, email: string, allowed: boolean): Promise<boolean> {
  const rows = await db.query(
    "update users set can_see_errors = $2 where lower(email) = lower($1) returning id",
    [email.trim(), allowed],
  );
  return rows.length > 0;
}

/** The log, newest first. Null when this person isn't allowed to see it. */
export async function listErrors(db: Db, userId: string): Promise<ErrorReport[] | null> {
  if (!(await canSeeErrors(db, userId))) return null;
  const rows = await db.query<{
    id: string;
    source: ErrorSource;
    message: string;
    detail: string | null;
    url: string | null;
    user_agent: string | null;
    count: number;
    first_seen: Date | string;
    last_seen: Date | string;
    last_user: string | null;
    resolved: boolean;
  }>(
    `select e.id, e.source, e.message, e.detail, e.url, e.user_agent, e.count,
            e.first_seen, e.last_seen, u.name as last_user, e.resolved
       from error_reports e left join users u on u.id = e.last_user_id
      order by e.last_seen desc`,
  );
  return rows.map((r) => ({
    id: String(r.id),
    source: r.source,
    message: r.message,
    detail: r.detail,
    url: r.url,
    userAgent: r.user_agent,
    count: Number(r.count),
    firstSeen: new Date(r.first_seen).toISOString(),
    lastSeen: new Date(r.last_seen).toISOString(),
    lastUser: r.last_user,
    resolved: Boolean(r.resolved),
  }));
}

export async function setErrorResolved(
  db: Db,
  userId: string,
  id: string,
  resolved: boolean,
): Promise<boolean> {
  if (!(await canSeeErrors(db, userId))) return false;
  const rows = await db.query("update error_reports set resolved = $2 where id = $1 returning id", [
    id,
    resolved,
  ]);
  return rows.length > 0;
}

/** Deletes one error, or (id null) every resolved one. */
export async function deleteErrors(db: Db, userId: string, id: string | null): Promise<boolean> {
  if (!(await canSeeErrors(db, userId))) return false;
  if (id) await db.query("delete from error_reports where id = $1", [id]);
  else await db.query("delete from error_reports where resolved");
  return true;
}
