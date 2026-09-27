import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb } from "@/server/db.server";
import { authenticate, createSession, deleteSession, setPasswordWithToken } from "@/server/auth";
import { MIN_PASSWORD_LENGTH } from "./password-policy";
import {
  clearSessionCookie,
  currentUser,
  readSessionToken,
  setSessionCookie,
} from "@/server/session.server";

export type SessionUser = { id: string; name: string; email: string };

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid" | "rate_limited" | "unavailable" };

export type SetPasswordResult =
  { ok: true; user: SessionUser } | { ok: false; reason: "invalid_link" | "unavailable" };

const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

const setPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(200),
});

export const getSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionUser | null> => {
    try {
      return await currentUser();
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
    const session = await createSession(db, result.user.id);
    setSessionCookie(session.token, session.expiresAt);
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
    const session = await createSession(db, user.id);
    setSessionCookie(session.token, session.expiresAt);
    return { ok: true, user };
  });
