import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { getDb } from "./db.server";
import { userForSession, type SessionUser } from "./auth";

const COOKIE = "kanoy_session";

/**
 * `persistent`: the cookie lives until the session expires ("keep me signed
 * in"). Otherwise it's a browser-session cookie, gone when the browser closes.
 */
export function setSessionCookie(token: string, expiresAt: Date, persistent: boolean): void {
  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: !import.meta.env.DEV,
    sameSite: "lax",
    path: "/",
    ...(persistent
      ? { expires: expiresAt, maxAge: Math.floor((+expiresAt - Date.now()) / 1000) }
      : {}),
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
