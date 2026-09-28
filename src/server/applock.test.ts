import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrate, type Db } from "./db";
import { createPgliteDb } from "./pglite-db";
import { createUser } from "./admin";
import { createSession, tokenHash, userForSession } from "./auth";
import {
  MAX_PIN_FAILURES,
  lockSession,
  passkeyUnlockOptions,
  pinProblem,
  sessionState,
  setPin,
  setUnlockMethod,
  unlockWithPassword,
  unlockWithPin,
} from "./applock";

let db: Db & { close(): Promise<void> };
let userId: string;
const PASSWORD = "palavra-passe-longa";
const PIN = "480713";

beforeEach(async () => {
  db = await createPgliteDb();
  await migrate(db);
  userId = (await createUser(db, { email: "dinis@kanoy.test", name: "Dinis", password: PASSWORD }))
    .id;
});

afterEach(async () => {
  await db.close();
});

const appSession = async () => (await createSession(db, userId, true, true)).token;

describe("codes", () => {
  it("must be 6 digits and not trivially guessable", () => {
    expect(pinProblem("12345")).toBe("format");
    expect(pinProblem("12a456")).toBe("format");
    for (const easy of ["000000", "111111", "123456", "234567", "789012", "654321", "210987"]) {
      expect(pinProblem(easy)).toBe("too_simple");
    }
    expect(pinProblem(PIN)).toBeNull();
  });
});

describe("app sessions", () => {
  it("serve data while unlocked, not after locking, and again after unlocking", async () => {
    await setPin(db, userId, PIN);
    const token = await appSession();
    expect(await userForSession(db, token)).toMatchObject({ id: userId });

    await lockSession(db, token);
    expect(await userForSession(db, token)).toBeNull();
    expect(await sessionState(db, token)).toMatchObject({
      appSession: true,
      locked: true,
      hasPin: true,
    });

    expect(await unlockWithPin(db, token, PIN)).toEqual({ ok: true });
    expect(await userForSession(db, token)).toMatchObject({ id: userId });
  });

  it("lock once the unlock window runs out, and slide it while in use", async () => {
    const token = await appSession();
    await db.query(
      "update sessions set unlocked_until = now() + interval '10 seconds' where token_hash = $1",
      [tokenHash(token)],
    );
    await userForSession(db, token); // using the app slides the window to ~5 min
    const [row] = await db.query<{ left: number }>(
      "select extract(epoch from unlocked_until - now())::int as left from sessions where token_hash = $1",
      [tokenHash(token)],
    );
    expect(row!.left).toBeGreaterThan(200);

    await db.query(
      "update sessions set unlocked_until = now() - interval '1 second' where token_hash = $1",
      [tokenHash(token)],
    );
    expect(await userForSession(db, token)).toBeNull();
  });

  it("don't affect browser sessions", async () => {
    const { token } = await createSession(db, userId, true, false);
    await lockSession(db, token);
    expect(await userForSession(db, token)).toMatchObject({ id: userId });
    expect(await sessionState(db, token)).toMatchObject({ appSession: false, locked: false });
  });
});

describe("unlocking with the code", () => {
  it("counts wrong codes and signs the session out after the last try", async () => {
    await setPin(db, userId, PIN);
    const token = await appSession();
    await lockSession(db, token);
    for (let left = MAX_PIN_FAILURES - 1; left >= 1; left--) {
      expect(await unlockWithPin(db, token, "999998")).toEqual({
        ok: false,
        reason: "wrong",
        attemptsLeft: left,
      });
    }
    expect(await unlockWithPin(db, token, "999998")).toEqual({ ok: false, reason: "signed_out" });
    expect(await sessionState(db, token)).toBeNull();
    // Even the right code can't bring that session back.
    expect(await unlockWithPin(db, token, PIN)).toEqual({ ok: false, reason: "no_session" });
  });

  it("resets the count after a success", async () => {
    await setPin(db, userId, PIN);
    const token = await appSession();
    await unlockWithPin(db, token, "999998");
    await unlockWithPin(db, token, PIN);
    const [row] = await db.query<{ pin_failures: number }>(
      "select pin_failures from users where id = $1",
      [userId],
    );
    expect(row!.pin_failures).toBe(0);
  });

  it("asks for a code to exist first", async () => {
    const token = await appSession();
    expect(await unlockWithPin(db, token, PIN)).toEqual({ ok: false, reason: "no_pin" });
  });
});

describe("unlocking with the password ('Recuperar código')", () => {
  it("accepts the account password and rejects a wrong one", async () => {
    const token = await appSession();
    await lockSession(db, token);
    expect(await unlockWithPassword(db, token, "errada")).toEqual({ ok: false, reason: "invalid" });
    expect(await unlockWithPassword(db, token, PASSWORD)).toEqual({ ok: true });
    expect(await userForSession(db, token)).toMatchObject({ id: userId });
  });
});

describe("unlock method", () => {
  it("needs a code for 'pin' and a registered device for Face ID", async () => {
    expect(await setUnlockMethod(db, userId, "pin")).toEqual({ ok: false, reason: "needs_pin" });
    expect(await setUnlockMethod(db, userId, "passkey")).toEqual({
      ok: false,
      reason: "needs_passkey",
    });
    expect(await setUnlockMethod(db, userId, "password")).toEqual({ ok: true });
    await setPin(db, userId, PIN);
    expect(await setUnlockMethod(db, userId, "pin")).toEqual({ ok: true });
  });

  it("offers Face ID only with a registered device", async () => {
    const token = await appSession();
    const rp = { rpID: "localhost", origin: "http://localhost:8080" };
    expect(await passkeyUnlockOptions(db, token, rp)).toBeNull();
    await db.query("insert into passkeys (id, user_id, public_key) values ('cred-1', $1, 'AA')", [
      userId,
    ]);
    const options = await passkeyUnlockOptions(db, token, rp);
    expect(options?.allowCredentials?.map((c) => c.id)).toEqual(["cred-1"]);
    expect(options?.userVerification).toBe("required");
  });
});
