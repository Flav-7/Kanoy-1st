import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getDb } from "@/server/db.server";
import { currentUser } from "@/server/session.server";
import type { Db } from "@/server/db";
import {
  addAreaMember,
  createArea,
  getProfile,
  isManager,
  listManagedAreas,
  reissueInvite,
  removeAreaMember,
  updateArea,
  updateProfile,
  type ManagedArea,
  type TeamError,
} from "@/server/team";
import { deleteSubscription, saveSubscription } from "@/server/push";
import { vapidPublicKey } from "@/server/web-push.server";

/**
 * Team page, profile and notification settings. As with the calendar, the
 * session decides who is acting and server/team.ts decides what they may do.
 */

type Unauthenticated = { ok: false; error: "UNAUTHENTICATED" };
export type TeamActionResult<T = null> =
  { ok: true; value: T } | { ok: false; error: TeamError } | Unauthenticated;

async function asUser<T>(
  run: (db: Db, userId: string) => Promise<T>,
): Promise<T | Unauthenticated> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "UNAUTHENTICATED" };
  return run(await getDb(), user.id);
}

function inviteUrl(token: string): string {
  return `${new URL(getRequest().url).origin}/definir-password?token=${token}`;
}

// ── Profile ──────────────────────────────────────────────────────────────

export type Profile = { name: string; email: string; jobTitle: string | null };

export const getMyProfile = createServerFn({ method: "GET" }).handler(
  (): Promise<{ ok: true; value: Profile | null } | Unauthenticated> =>
    asUser(async (db, userId) => ({ ok: true as const, value: await getProfile(db, userId) })),
);

export const saveMyProfile = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ name: z.string().max(80), jobTitle: z.string().max(60) }).parse(d),
  )
  .handler(({ data }) => asUser((db, userId) => updateProfile(db, userId, data)));

// ── Areas ────────────────────────────────────────────────────────────────

export const getTeam = createServerFn({ method: "GET" }).handler(
  (): Promise<
    { ok: true; value: { areas: ManagedArea[]; canManage: boolean } } | Unauthenticated
  > =>
    asUser(async (db, userId) => ({
      ok: true as const,
      value: { areas: await listManagedAreas(db, userId), canManage: await isManager(db, userId) },
    })),
);

const areaSchema = z.object({ name: z.string().max(80), color: z.string().max(20) });

export const createAreaFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => areaSchema.parse(d))
  .handler(({ data }) => asUser((db, userId) => createArea(db, userId, data)));

export const updateAreaFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => areaSchema.extend({ calendarId: z.string().uuid() }).parse(d))
  .handler(({ data }) => asUser((db, userId) => updateArea(db, userId, data.calendarId, data)));

export const addMemberFn = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        calendarId: z.string().uuid(),
        email: z.string().max(200),
        name: z.string().max(80).optional(),
        role: z.string().max(10),
      })
      .parse(d),
  )
  .handler(({ data }): Promise<TeamActionResult<{ inviteUrl: string | null }>> =>
    asUser(async (db, userId) => {
      const res = await addAreaMember(db, userId, data.calendarId, data);
      if (!res.ok) return res;
      const token = res.value.inviteToken;
      return { ok: true as const, value: { inviteUrl: token ? inviteUrl(token) : null } };
    }),
  );

export const removeMemberFn = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ calendarId: z.string().uuid(), userId: z.string().uuid() }).parse(d),
  )
  .handler(({ data }) =>
    asUser((db, userId) => removeAreaMember(db, userId, data.calendarId, data.userId)),
  );

export const reissueInviteFn = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ calendarId: z.string().uuid(), userId: z.string().uuid() }).parse(d),
  )
  .handler(({ data }): Promise<TeamActionResult<{ inviteUrl: string }>> =>
    asUser(async (db, userId) => {
      const res = await reissueInvite(db, userId, data.calendarId, data.userId);
      if (!res.ok) return res;
      return { ok: true as const, value: { inviteUrl: inviteUrl(res.value.inviteToken) } };
    }),
  );

// ── Notifications ────────────────────────────────────────────────────────

/** The VAPID public key the browser needs to subscribe; null = notifications not configured. */
export const getPushConfig = createServerFn({ method: "GET" }).handler(async () => ({
  publicKey: vapidPublicKey(),
}));

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
});

export const subscribePush = createServerFn({ method: "POST" })
  .validator((d: unknown) => subscriptionSchema.parse(d))
  .handler(({ data }) =>
    asUser(async (db, userId) => {
      await saveSubscription(db, userId, data);
      return { ok: true as const };
    }),
  );

export const unsubscribePush = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ endpoint: z.string().max(1000) }).parse(d))
  .handler(({ data }) =>
    asUser(async (db, userId) => {
      await deleteSubscription(db, userId, data.endpoint);
      return { ok: true as const };
    }),
  );
