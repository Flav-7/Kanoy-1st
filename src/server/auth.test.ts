import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrate, type Db } from "./db";
import { createPgliteDb } from "./pglite-db";
import { createUser } from "./admin";
import {
  authenticate,
  createPasswordToken,
  createSession,
  deleteSession,
  hashPassword,
  setPasswordWithToken,
  userForSession,
  verifyPassword,
} from "./auth";

let db: Db & { close(): Promise<void> };
let userId: string;

beforeEach(async () => {
  db = await createPgliteDb();
  await migrate(db);
  userId = (
    await createUser(db, {
      email: "Ana@Kanoy.test",
      name: "Ana",
      password: "correct horse battery",
    })
  ).id;
});

afterEach(async () => {
  await db.close();
});

describe("passwords", () => {
  it("verifies only the right password and salts every hash", async () => {
    const a = await hashPassword("segredo-longo");
    const b = await hashPassword("segredo-longo");
    expect(a).not.toBe(b);
    expect(await verifyPassword("segredo-longo", a)).toBe(true);
    expect(await verifyPassword("segredo-errado", a)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
});

describe("login", () => {
  it("accepts the right password, case-insensitively on the email", async () => {
    const res = await authenticate(db, "  ana@KANOY.test ", "correct horse battery");
    expect(res).toMatchObject({ ok: true, user: { id: userId, email: "ana@kanoy.test" } });
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    expect(await authenticate(db, "ana@kanoy.test", "nope")).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(await authenticate(db, "ghost@kanoy.test", "nope")).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("blocks an email after repeated failures, even with the right password", async () => {
    for (let i = 0; i < 8; i++) await authenticate(db, "ana@kanoy.test", "wrong");
    expect(await authenticate(db, "ana@kanoy.test", "correct horse battery")).toEqual({
      ok: false,
      reason: "rate_limited",
    });
  });
});

describe("sessions", () => {
  it("resolves a live session and forgets a deleted or expired one", async () => {
    const { token } = await createSession(db, userId);
    expect(await userForSession(db, token)).toMatchObject({ id: userId, name: "Ana" });
    expect(await userForSession(db, "not-a-token")).toBeNull();

    await deleteSession(db, token);
    expect(await userForSession(db, token)).toBeNull();

    const other = await createSession(db, userId);
    await db.query("update sessions set expires_at = now() - interval '1 minute'");
    expect(await userForSession(db, other.token)).toBeNull();
  });
});

describe("keep me signed in", () => {
  it("lasts 30 days when remembered and 12 hours otherwise", async () => {
    const hoursLeft = (d: Date) => (+d - Date.now()) / 3_600_000;
    const long = await createSession(db, userId, true);
    const short = await createSession(db, userId, false);
    expect(hoursLeft(long.expiresAt)).toBeGreaterThan(30 * 24 - 1);
    expect(hoursLeft(short.expiresAt)).toBeGreaterThan(11.9);
    expect(hoursLeft(short.expiresAt)).toBeLessThanOrEqual(12);
    expect(await userForSession(db, short.token)).toMatchObject({ id: userId });
  });
});

describe("set-password links", () => {
  it("work once, set the password and sign out existing sessions", async () => {
    const { token: session } = await createSession(db, userId);
    const link = await createPasswordToken(db, userId);

    expect(await setPasswordWithToken(db, link, "uma-password-nova")).toMatchObject({ id: userId });
    expect(await setPasswordWithToken(db, link, "outra-password")).toBeNull();

    expect(await userForSession(db, session)).toBeNull();
    expect(await authenticate(db, "ana@kanoy.test", "uma-password-nova")).toMatchObject({
      ok: true,
    });
  });

  it("expire", async () => {
    const link = await createPasswordToken(db, userId);
    await db.query("update password_tokens set expires_at = now() - interval '1 minute'");
    expect(await setPasswordWithToken(db, link, "uma-password-nova")).toBeNull();
  });
});
