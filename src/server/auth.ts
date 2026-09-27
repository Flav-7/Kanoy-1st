import { createHash, randomBytes, scrypt, timingSafeEqual, type BinaryLike } from "node:crypto";
import type { Db } from "./db";

export type SessionUser = { id: string; name: string; email: string };

export const SESSION_DAYS = 30;
const PASSWORD_TOKEN_HOURS = 72;

// Brute-force brake: this many failed logins for one email within the window
// blocks further attempts for that email until the window moves on.
const MAX_FAILED_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MINUTES = 15;

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 } as const;

function scryptAsync(password: BinaryLike, salt: BinaryLike): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Compared against when the email doesn't exist, so a login takes the same
// time either way and doesn't reveal which emails have accounts.
let dummyHash: Promise<string> | undefined;

/** Only the SHA-256 of a session/password token is stored, never the token. */
function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function authenticate(
  db: Db,
  rawEmail: string,
  password: string,
): Promise<{ ok: true; user: SessionUser } | { ok: false; reason: "invalid" | "rate_limited" }> {
  const email = normalizeEmail(rawEmail);

  const [{ failures } = { failures: 0 }] = await db.query<{ failures: number }>(
    `select count(*)::int as failures from login_attempts
      where email = $1 and not succeeded
        and attempted_at > now() - make_interval(mins => $2)`,
    [email, ATTEMPT_WINDOW_MINUTES],
  );
  if (failures >= MAX_FAILED_ATTEMPTS) return { ok: false, reason: "rate_limited" };

  const [row] = await db.query<SessionUser & { password_hash: string | null }>(
    "select id, name, email, password_hash from users where email = $1",
    [email],
  );
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  const valid = row?.password_hash
    ? await verifyPassword(password, row.password_hash)
    : (await verifyPassword(password, await dummyHash), false);

  await db.query("insert into login_attempts (email, succeeded) values ($1, $2)", [email, valid]);
  if (!valid || !row) return { ok: false, reason: "invalid" };
  return { ok: true, user: { id: row.id, name: row.name, email: row.email } };
}

export async function createSession(
  db: Db,
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.query("insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)", [
    tokenHash(token),
    userId,
    expiresAt,
  ]);
  return { token, expiresAt };
}

export async function userForSession(db: Db, token: string): Promise<SessionUser | null> {
  const [row] = await db.query<SessionUser>(
    `select u.id, u.name, u.email from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [tokenHash(token)],
  );
  return row ?? null;
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db.query("delete from sessions where token_hash = $1", [tokenHash(token)]);
}

/** A one-time link token that lets `userId` set their password. */
export async function createPasswordToken(db: Db, userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.query(
    "insert into password_tokens (token_hash, user_id, expires_at) values ($1, $2, $3)",
    [tokenHash(token), userId, new Date(Date.now() + PASSWORD_TOKEN_HOURS * 3_600_000)],
  );
  return token;
}

/**
 * Sets the password if the token is valid, unused and unexpired. One
 * statement burns the token, sets the password and signs out every existing
 * session of that user, so a token can never be used twice, even concurrently.
 */
export async function setPasswordWithToken(
  db: Db,
  token: string,
  password: string,
): Promise<SessionUser | null> {
  const passwordHash = await hashPassword(password);
  const [user] = await db.query<SessionUser>(
    `with used as (
       update password_tokens set used_at = now()
        where token_hash = $1 and used_at is null and expires_at > now()
        returning user_id
     ), updated as (
       update users set password_hash = $2
        where id in (select user_id from used)
        returning id, name, email
     ), signed_out as (
       delete from sessions where user_id in (select user_id from used)
     )
     select id, name, email from updated`,
    [tokenHash(token), passwordHash],
  );
  return user ?? null;
}
