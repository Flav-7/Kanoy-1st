import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { getDb } from "./db.server";
import { SESSION_DAYS, userForSession, type SessionUser } from "./auth";

const COOKIE = "kanoy_session";

export function setSessionCookie(token: string, expiresAt: Date): void {
  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: !import.meta.env.DEV,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_DAYS * 86_400,
  });
}

export function readSessionToken(): string | undefined {
  return getCookie(COOKIE);
}

export function clearSessionCookie(): void {
  deleteCookie(COOKIE, { path: "/" });
}

/** The signed-in user for this request, or null. */
export async function currentUser(): Promise<SessionUser | null> {
  const token = readSessionToken();
  if (!token) return null;
  return userForSession(await getDb(), token);
}
