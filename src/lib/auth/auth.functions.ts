import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb } from "@/server/db.server";
import { authenticate, createSession, deleteSession, setPasswordWithToken } from "@/server/auth";
import { sessionState, type UnlockMethod } from "@/server/applock";
import { MIN_PASSWORD_LENGTH } from "./password-policy";
import { clearSessionCookie, readSessionToken, setSessionCookie } from "@/server/session.server";

export type SessionUser = { id: string; name: string; email: string };

/** The signed-in person plus the state of the installed-app lock. */
export type AuthSession = {
  user: SessionUser;
  /** Session of the installed app (the code/Face ID lock applies to it). */
  appSession: boolean;
  locked: boolean;
  unlockMethod: UnlockMethod;
  hasPin: boolean;
  passkeyCount: number;
};

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid" | "rate_limited" | "unavailable" };

export type SetPasswordResult =
  { ok: true; user: SessionUser } | { ok: false; reason: "invalid_link" | "unavailable" };

const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
  remember: z.boolean().default(true),
  /** Signing in from the installed phone/tablet app: the session gets the app lock. */
  appLock: z.boolean().default(false),
});

const setPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(200),
});

export const getSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthSession | null> => {
    try {
      const token = readSessionToken();
      return token ? await sessionState(await getDb(), token) : null;
    } catch (err) {
      // No database configured (yet): everyone is simply logged out.
      console.error(err);
      return null;
    }
  },
);

export const login = createServerFn({ method: "POST" })
  .validator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }): Promise<LoginResult> => {
    let db;
    try {
      db = await getDb();
    } catch (err) {
      console.error(err);
      return { ok: false, reason: "unavailable" };
    }
    const result = await authenticate(db, data.email, data.password);
    if (!result.ok) return result;
    // The app keeps its session (behind the lock); the browser follows the checkbox.
    const remember = data.appLock || data.remember;
    const session = await createSession(db, result.user.id, remember, data.appLock);
    setSessionCookie(session.token, session.expiresAt, remember);
    return { ok: true, user: result.user };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const token = readSessionToken();
  clearSessionCookie();
  if (token) await deleteSession(await getDb(), token);
});

/** Redeems a set-password link (new account or reset) and signs the user in. */
export const setPassword = createServerFn({ method: "POST" })
  .validator((data: unknown) => setPasswordSchema.parse(data))
  .handler(async ({ data }): Promise<SetPasswordResult> => {
    let db;
    try {
      db = await getDb();
    } catch (err) {
      console.error(err);
      return { ok: false, reason: "unavailable" };
    }
    const user = await setPasswordWithToken(db, data.token, data.password);
    if (!user) return { ok: false, reason: "invalid_link" };
    // Setting a password happens on the person's own device: keep them signed in.
    const session = await createSession(db, user.id, true);
    setSessionCookie(session.token, session.expiresAt, true);
    return { ok: true, user };
  });
