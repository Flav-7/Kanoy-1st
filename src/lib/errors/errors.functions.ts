import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { getDb } from "@/server/db.server";
import { currentUser, readSessionToken } from "@/server/session.server";
import { tokenHash } from "@/server/auth";
import {
  deleteErrors,
  listErrors,
  recordError,
  setErrorResolved,
  type ErrorReport,
} from "@/server/errors";

/**
 * The "Erros" page and the browser side of error reporting. Anyone can
 * report (visitors hit errors too), so reports are size-checked and
 * throttled per address; only people with can_see_errors read the log.
 */

// Per server instance: enough to stop one page in a loop from hammering the
// database, without needing shared state.
const REPORTS_PER_MINUTE = 20;
const recent = new Map<string, { count: number; since: number }>();

function throttled(key: string): boolean {
  const now = Date.now();
  const entry = recent.get(key);
  if (!entry || now - entry.since > 60_000) {
    if (recent.size > 5000) recent.clear();
    recent.set(key, { count: 1, since: now });
    return false;
  }
  entry.count += 1;
  return entry.count > REPORTS_PER_MINUTE;
}

/** The signed-in person's id, without touching the app lock's unlock window. */
async function sessionUserId(): Promise<string | null> {
  const token = readSessionToken();
  if (!token) return null;
  const [row] = await (
    await getDb()
  ).query<{ user_id: string }>(
    "select user_id from sessions where token_hash = $1 and expires_at > now()",
    [tokenHash(token)],
  );
  return row ? String(row.user_id) : null;
}

const reportSchema = z.object({
  message: z.string().min(1).max(2000),
  detail: z.string().max(20_000).nullable(),
  url: z.string().max(2000).nullable(),
});

export const reportErrorFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => reportSchema.parse(d))
  .handler(async ({ data }): Promise<void> => {
    try {
      if (throttled(getRequestIP({ xForwardedFor: true }) ?? "unknown")) return;
      await recordError(await getDb(), {
        source: "browser",
        ...data,
        userAgent: getRequest().headers.get("user-agent"),
        userId: await sessionUserId(),
      });
    } catch {
      // Reporting must never become an error of its own.
    }
  });

type Unauthenticated = { ok: false; error: "UNAUTHENTICATED" | "FORBIDDEN" };

export const listErrorsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ok: true; errors: ErrorReport[] } | Unauthenticated> => {
    const user = await currentUser();
    if (!user) return { ok: false, error: "UNAUTHENTICATED" };
    const errors = await listErrors(await getDb(), user.id);
    return errors ? { ok: true, errors } : { ok: false, error: "FORBIDDEN" };
  },
);

export const setErrorResolvedFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string().uuid(), resolved: z.boolean() }).parse(d))
  .handler(async ({ data }): Promise<boolean> => {
    const user = await currentUser();
    return user ? setErrorResolved(await getDb(), user.id, data.id, data.resolved) : false;
  });

export const deleteErrorsFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ data }): Promise<boolean> => {
    const user = await currentUser();
    return user ? deleteErrors(await getDb(), user.id, data.id) : false;
  });
