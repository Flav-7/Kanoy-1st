import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { getDb } from "@/server/db.server";
import { currentUser, readSessionToken } from "@/server/session.server";
import {
  deletePasskey,
  listPasskeys,
  lockSession,
  makeAppSession,
  passkeyRegistrationOptions,
  passkeyUnlockOptions,
  setPin,
  setUnlockMethods,
  unlockWithPasskey,
  unlockWithPassword,
  unlockWithPin,
  verifyPasskeyRegistration,
  type PasskeyInfo,
  sessionState,
  type RelyingParty,
  type SessionState,
} from "@/server/applock";

/**
 * The installed app's lock. Unlocking works on a locked session (it's how
 * you get out of it); everything that changes the lock itself — code,
 * method, Face ID devices — needs an unlocked session (currentUser()).
 */

function relyingParty(): RelyingParty {
  const url = new URL(getRequest().url);
  return { rpID: url.hostname, origin: url.origin };
}

type NotSignedIn = { ok: false; reason: "no_session" };

async function withToken<T>(run: (token: string) => Promise<T>): Promise<T | NotSignedIn> {
  const token = readSessionToken();
  if (!token) return { ok: false, reason: "no_session" };
  return run(token);
}

async function withUnlockedUser<T>(
  run: (
    userId: string,
    token: string,
    user: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
  ) => Promise<T>,
): Promise<T | NotSignedIn> {
  const token = readSessionToken();
  const user = await currentUser();
  if (!token || !user) return { ok: false, reason: "no_session" };
  return run(user.id, token, user);
}

/**
 * Everything the installed app does when it starts, in one round trip:
 * put an inherited browser session under the lock (Android), lock it, and
 * return the resulting state for the launch screen to hand over to.
 */
export const startAppFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<SessionState | null> => {
    const token = readSessionToken();
    if (!token) return null;
    const db = await getDb();
    await makeAppSession(db, token);
    await lockSession(db, token);
    return sessionState(db, token);
  },
);

const pinSchema = z.object({ pin: z.string().max(12) });

export const unlockWithPinFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => pinSchema.parse(d))
  .handler(({ data }) => withToken(async (token) => unlockWithPin(await getDb(), token, data.pin)));

export const unlockWithPasswordFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(({ data }) =>
    withToken(async (token) => unlockWithPassword(await getDb(), token, data.password)),
  );

export const passkeyUnlockOptionsFn = createServerFn({ method: "POST" }).handler(() =>
  withToken(async (token) => {
    const options = await passkeyUnlockOptions(await getDb(), token, relyingParty());
    // Sent as JSON text: the options are plain JSON, but their declared type
    // (optional binary extensions) isn't accepted by the RPC serializer.
    return options
      ? { ok: true as const, optionsJSON: JSON.stringify(options) }
      : { ok: false as const, reason: "no_passkey" as const };
  }),
);

export const unlockWithPasskeyFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ response: z.record(z.unknown()) }).parse(d))
  .handler(({ data }) =>
    withToken(async (token) =>
      unlockWithPasskey(
        await getDb(),
        token,
        data.response as unknown as AuthenticationResponseJSON,
        relyingParty(),
      ),
    ),
  );

// ── Managing the lock (needs an unlocked session) ────────────────────────

export const setPinFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => pinSchema.parse(d))
  .handler(({ data }) =>
    withUnlockedUser(async (userId) => setPin(await getDb(), userId, data.pin)),
  );

export const setUnlockMethodsFn = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        methods: z
          .array(z.enum(["pin", "passkey", "password"]))
          .min(1)
          .max(3),
      })
      .parse(d),
  )
  .handler(({ data }) =>
    withUnlockedUser(async (userId) => setUnlockMethods(await getDb(), userId, data.methods)),
  );

export const listPasskeysFn = createServerFn({ method: "GET" }).handler(
  (): Promise<{ ok: true; passkeys: PasskeyInfo[] } | NotSignedIn> =>
    withUnlockedUser(async (userId) => ({
      ok: true as const,
      passkeys: await listPasskeys(await getDb(), userId),
    })),
);

export const deletePasskeyFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string().max(500) }).parse(d))
  .handler(({ data }) =>
    withUnlockedUser(async (userId) => {
      await deletePasskey(await getDb(), userId, data.id);
      return { ok: true as const };
    }),
  );

export const passkeyRegistrationOptionsFn = createServerFn({ method: "POST" }).handler(() =>
  withUnlockedUser(async (_userId, token, user) => ({
    ok: true as const,
    optionsJSON: JSON.stringify(
      await passkeyRegistrationOptions(await getDb(), token, user, relyingParty()),
    ),
  })),
);

export const registerPasskeyFn = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({ response: z.record(z.unknown()), deviceName: z.string().max(80).nullable() })
      .parse(d),
  )
  .handler(({ data }) =>
    withUnlockedUser(async (userId, token) =>
      verifyPasskeyRegistration(
        await getDb(),
        token,
        userId,
        data.response as unknown as RegistrationResponseJSON,
        relyingParty(),
        data.deviceName,
      ),
    ),
  );
