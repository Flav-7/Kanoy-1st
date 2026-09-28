import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { toIso, type Db } from "./db";
import { pinProblem } from "@/lib/app/pin";
import { loadWebAuthn } from "./webauthn";

import {
  authenticate,
  hashPassword,
  tokenHash,
  UNLOCK_WINDOW_MINUTES,
  verifyPassword,
  type SessionUser,
} from "./auth";

export { pinProblem };

type Transport = NonNullable<RegistrationResponseJSON["response"]["transports"]>[number];
const transportsOf = (stored: string | null) =>
  stored ? { transports: stored.split(",") as Transport[] } : {};

/**
 * Lock for the installed phone/tablet app. A session created from the app
 * (`app_lock`) serves data only while `unlocked_until` is in the future;
 * userForSession() slides that window with every request, and the app locks
 * itself explicitly on every cold start. Unlocking takes the person's 6-digit
 * code, Face ID/fingerprint (a WebAuthn passkey on that device) or password,
 * always checked here — the lock screen is just the way to ask.
 *
 * Each person picks which of these the lock screen offers (unlock_methods,
 * e.g. code + Face ID so one backs up the other); code and Face ID are only
 * accepted when enabled. The password always works, as the way back in.
 *
 * Five wrong codes in a row sign that session out, so the next attempt has to
 * go through email + password again.
 */

export const MAX_PIN_FAILURES = 5;
const CHALLENGE_MINUTES = 5;

export type UnlockMethod = "pin" | "passkey" | "password";
export const UNLOCK_METHODS: UnlockMethod[] = ["pin", "passkey", "password"];

export type SessionState = {
  user: SessionUser;
  /** Created from the installed app, so the lock applies to it. */
  appSession: boolean;
  locked: boolean;
  /** What the lock screen offers, in no particular order. */
  unlockMethods: UnlockMethod[];
  hasPin: boolean;
  passkeyCount: number;
};

/** Everything the app needs to decide what to show, without unlocking anything. */
export async function sessionState(db: Db, token: string): Promise<SessionState | null> {
  const [row] = await db.query<{
    id: string;
    name: string;
    email: string;
    app_lock: boolean;
    unlocked: boolean;
    unlock_methods: UnlockMethod[];
    has_pin: boolean;
    passkeys: number;
  }>(
    `select u.id, u.name, u.email, s.app_lock,
            coalesce(s.unlocked_until > now(), false) as unlocked,
            to_json(u.unlock_methods) as unlock_methods, (u.pin_hash is not null) as has_pin,
            (select count(*)::int from passkeys p where p.user_id = u.id) as passkeys
       from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [tokenHash(token)],
  );
  if (!row) return null;
  return {
    user: { id: String(row.id), name: row.name, email: row.email },
    appSession: Boolean(row.app_lock),
    locked: Boolean(row.app_lock) && !row.unlocked,
    unlockMethods: row.unlock_methods,
    hasPin: Boolean(row.has_pin),
    passkeyCount: Number(row.passkeys),
  };
}

/**
 * Puts an existing, usable session under the app lock. Needed on Android,
 * where the installed app shares Chrome's cookies, so it can inherit a
 * browser session. Only works on a session that currently serves data.
 */
export async function makeAppSession(db: Db, token: string): Promise<boolean> {
  const rows = await db.query(
    `update sessions set app_lock = true, unlocked_until = now() + make_interval(mins => $2)
      where token_hash = $1 and expires_at > now() and not app_lock
      returning token_hash`,
    [tokenHash(token), UNLOCK_WINDOW_MINUTES],
  );
  return rows.length > 0;
}

/** Locks an app session now (the app calls this every time it starts). */
export async function lockSession(db: Db, token: string): Promise<void> {
  await db.query("update sessions set unlocked_until = null where token_hash = $1 and app_lock", [
    tokenHash(token),
  ]);
}

async function unlock(db: Db, token: string): Promise<void> {
  await db.query(
    `update sessions set unlocked_until = now() + make_interval(mins => $2)
      where token_hash = $1 and app_lock`,
    [tokenHash(token), UNLOCK_WINDOW_MINUTES],
  );
}

// ── Code ─────────────────────────────────────────────────────────────────

export async function setPin(
  db: Db,
  userId: string,
  pin: string,
): Promise<{ ok: true } | { ok: false; reason: "format" | "too_simple" }> {
  const problem = pinProblem(pin);
  if (problem) return { ok: false, reason: problem };
  // Creating a code turns it on as a way in (replacing "password only").
  await db.query(
    `update users set pin_hash = $2, pin_failures = 0,
            unlock_methods = case when 'pin' = any(unlock_methods) then unlock_methods
                                  else array_remove(unlock_methods, 'password') || array['pin'] end
      where id = $1`,
    [userId, await hashPassword(pin)],
  );
  return { ok: true };
}

export type UnlockResult =
  | { ok: true }
  | { ok: false; reason: "wrong"; attemptsLeft: number }
  | { ok: false; reason: "signed_out" | "no_pin" | "no_session" | "not_allowed" };

export async function unlockWithPin(db: Db, token: string, pin: string): Promise<UnlockResult> {
  const [row] = await db.query<{
    user_id: string;
    pin_hash: string | null;
    pin_failures: number;
    allowed: boolean;
  }>(
    `select u.id as user_id, u.pin_hash, u.pin_failures, ('pin' = any(u.unlock_methods)) as allowed
       from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now() and s.app_lock`,
    [tokenHash(token)],
  );
  if (!row) return { ok: false, reason: "no_session" };
  if (!row.allowed) return { ok: false, reason: "not_allowed" };
  if (!row.pin_hash) return { ok: false, reason: "no_pin" };

  if (await verifyPassword(pin, row.pin_hash)) {
    await db.query("update users set pin_failures = 0 where id = $1", [row.user_id]);
    await unlock(db, token);
    return { ok: true };
  }

  const [counted] = await db.query<{ pin_failures: number }>(
    "update users set pin_failures = pin_failures + 1 where id = $1 returning pin_failures",
    [row.user_id],
  );
  const failures = counted?.pin_failures ?? MAX_PIN_FAILURES;
  if (failures >= MAX_PIN_FAILURES) {
    await db.batch([
      { text: "update users set pin_failures = 0 where id = $1", params: [row.user_id] },
      { text: "delete from sessions where token_hash = $1", params: [tokenHash(token)] },
    ]);
    return { ok: false, reason: "signed_out" };
  }
  return { ok: false, reason: "wrong", attemptsLeft: MAX_PIN_FAILURES - failures };
}

/** Unlocks with the account password ("Recuperar código" and the password method). */
export async function unlockWithPassword(
  db: Db,
  token: string,
  password: string,
): Promise<{ ok: true } | { ok: false; reason: "invalid" | "rate_limited" | "no_session" }> {
  const state = await sessionState(db, token);
  if (!state?.appSession) return { ok: false, reason: "no_session" };
  const result = await authenticate(db, state.user.email, password);
  if (!result.ok) return result;
  await db.query("update users set pin_failures = 0 where id = $1", [state.user.id]);
  await unlock(db, token);
  return { ok: true };
}

/**
 * Which ways in the lock screen offers (at least one). Code and Face ID can
 * only be turned on once they exist; the password always works regardless.
 */
export async function setUnlockMethods(
  db: Db,
  userId: string,
  methods: UnlockMethod[],
): Promise<{ ok: true } | { ok: false; reason: "empty" | "needs_pin" | "needs_passkey" }> {
  const wanted = UNLOCK_METHODS.filter((m) => methods.includes(m));
  if (wanted.length === 0) return { ok: false, reason: "empty" };
  const [row] = await db.query<{ has_pin: boolean; passkeys: number }>(
    `select (pin_hash is not null) as has_pin,
            (select count(*)::int from passkeys where user_id = $1) as passkeys
       from users where id = $1`,
    [userId],
  );
  if (wanted.includes("pin") && !row?.has_pin) return { ok: false, reason: "needs_pin" };
  if (wanted.includes("passkey") && !row?.passkeys) return { ok: false, reason: "needs_passkey" };
  await db.query("update users set unlock_methods = $2::text[] where id = $1", [userId, wanted]);
  return { ok: true };
}

// ── Face ID / fingerprint (WebAuthn passkeys) ────────────────────────────

/** Relying party = this site: its hostname and exact origin (from the request). */
export type RelyingParty = { rpID: string; origin: string };

async function storeChallenge(db: Db, token: string, challenge: string): Promise<void> {
  await db.query(
    `insert into webauthn_challenges (session_hash, challenge, expires_at)
     values ($1, $2, now() + make_interval(mins => $3))
     on conflict (session_hash) do update set challenge = excluded.challenge, expires_at = excluded.expires_at`,
    [tokenHash(token), challenge, CHALLENGE_MINUTES],
  );
}

/** Takes the session's pending challenge (single use). */
async function takeChallenge(db: Db, token: string): Promise<string | null> {
  const [row] = await db.query<{ challenge: string }>(
    "delete from webauthn_challenges where session_hash = $1 and expires_at > now() returning challenge",
    [tokenHash(token)],
  );
  return row?.challenge ?? null;
}

const b64url = {
  encode: (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url"),
  decode: (text: string) => new Uint8Array(Buffer.from(text, "base64url")),
};

export type PasskeyInfo = {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export async function listPasskeys(db: Db, userId: string): Promise<PasskeyInfo[]> {
  const rows = await db.query<{
    id: string;
    device_name: string | null;
    created_at: unknown;
    last_used_at: unknown;
  }>(
    "select id, device_name, created_at, last_used_at from passkeys where user_id = $1 order by created_at",
    [userId],
  );
  return rows.map((r) => ({
    id: r.id,
    deviceName: r.device_name,
    createdAt: toIso(r.created_at),
    lastUsedAt: r.last_used_at ? toIso(r.last_used_at) : null,
  }));
}

export async function deletePasskey(db: Db, userId: string, id: string): Promise<void> {
  await db.batch([
    { text: "delete from passkeys where id = $1 and user_id = $2", params: [id, userId] },
    // Without any passkey left, Face ID can't be a way in anymore; if it was
    // the only one, fall back to the code (or the password).
    {
      text: `update users set unlock_methods = coalesce(
                 nullif(array_remove(unlock_methods, 'passkey'), '{}'),
                 case when pin_hash is not null then array['pin'] else array['password'] end)
              where id = $1 and 'passkey' = any(unlock_methods)
                and not exists (select 1 from passkeys where user_id = $1)`,
      params: [userId],
    },
  ]);
}

/** Options for adding Face ID on this device (the session must be unlocked). */
export async function passkeyRegistrationOptions(
  db: Db,
  token: string,
  user: SessionUser,
  rp: RelyingParty,
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const existing = await db.query<{ id: string; transports: string | null }>(
    "select id, transports from passkeys where user_id = $1",
    [user.id],
  );
  const { generateRegistrationOptions } = await loadWebAuthn();
  const options = await generateRegistrationOptions({
    rpName: "KANOY",
    rpID: rp.rpID,
    userName: user.email,
    userDisplayName: user.name,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.id,
      ...transportsOf(c.transports),
    })),
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "required",
    },
  });
  await storeChallenge(db, token, options.challenge);
  return options;
}

export async function verifyPasskeyRegistration(
  db: Db,
  token: string,
  userId: string,
  response: RegistrationResponseJSON,
  rp: RelyingParty,
  deviceName: string | null,
): Promise<{ ok: true } | { ok: false; reason: "expired" | "invalid" }> {
  const challenge = await takeChallenge(db, token);
  if (!challenge) return { ok: false, reason: "expired" };
  let verification;
  try {
    const { verifyRegistrationResponse } = await loadWebAuthn();
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.rpID,
      requireUserVerification: true,
    });
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!verification.verified) return { ok: false, reason: "invalid" };
  const { credential } = verification.registrationInfo;
  await db.query(
    `insert into passkeys (id, user_id, public_key, counter, transports, device_name)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (id) do nothing`,
    [
      credential.id,
      userId,
      b64url.encode(credential.publicKey),
      credential.counter,
      credential.transports?.join(",") ?? null,
      deviceName?.slice(0, 80) ?? null,
    ],
  );
  // Adding Face ID on a device means wanting to use it.
  await db.query(
    `update users set unlock_methods = unlock_methods || array['passkey']
      where id = $1 and not ('passkey' = any(unlock_methods))`,
    [userId],
  );
  return { ok: true };
}

/** Options for unlocking with Face ID; works on a locked app session. */
export async function passkeyUnlockOptions(
  db: Db,
  token: string,
  rp: RelyingParty,
): Promise<PublicKeyCredentialRequestOptionsJSON | null> {
  const state = await sessionState(db, token);
  if (!state?.appSession || !state.unlockMethods.includes("passkey")) return null;
  const creds = await db.query<{ id: string; transports: string | null }>(
    "select id, transports from passkeys where user_id = $1",
    [state.user.id],
  );
  if (creds.length === 0) return null;
  const { generateAuthenticationOptions } = await loadWebAuthn();
  const options = await generateAuthenticationOptions({
    rpID: rp.rpID,
    userVerification: "required",
    allowCredentials: creds.map((c) => ({
      id: c.id,
      ...transportsOf(c.transports),
    })),
  });
  await storeChallenge(db, token, options.challenge);
  return options;
}

export async function unlockWithPasskey(
  db: Db,
  token: string,
  response: AuthenticationResponseJSON,
  rp: RelyingParty,
): Promise<{ ok: true } | { ok: false; reason: "expired" | "invalid" | "no_session" }> {
  const state = await sessionState(db, token);
  if (!state?.appSession) return { ok: false, reason: "no_session" };
  if (!state.unlockMethods.includes("passkey")) return { ok: false, reason: "invalid" };
  const challenge = await takeChallenge(db, token);
  if (!challenge) return { ok: false, reason: "expired" };

  // Only this user's own passkeys can unlock their session.
  const [cred] = await db.query<{
    id: string;
    public_key: string;
    counter: string | number;
    transports: string | null;
  }>("select id, public_key, counter, transports from passkeys where id = $1 and user_id = $2", [
    response.id,
    state.user.id,
  ]);
  if (!cred) return { ok: false, reason: "invalid" };

  let verification;
  try {
    const { verifyAuthenticationResponse } = await loadWebAuthn();
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.rpID,
      requireUserVerification: true,
      credential: {
        id: cred.id,
        publicKey: b64url.decode(cred.public_key),
        counter: Number(cred.counter),
        ...transportsOf(cred.transports),
      },
    });
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!verification.verified) return { ok: false, reason: "invalid" };

  await db.query("update passkeys set counter = $2, last_used_at = now() where id = $1", [
    cred.id,
    verification.authenticationInfo.newCounter,
  ]);
  await db.query("update users set pin_failures = 0 where id = $1", [state.user.id]);
  await unlock(db, token);
  return { ok: true };
}
