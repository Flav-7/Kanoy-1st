import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrate, type Db } from "./db";
import { createPgliteDb } from "./pglite-db";
import { createUser } from "./admin";
import {
  MAX_ERROR_ROWS,
  deleteErrors,
  fingerprint,
  isNoise,
  listErrors,
  recordError,
  setErrorResolved,
  setErrorViewer,
} from "./errors";

let db: Db & { close(): Promise<void> };
let owner: string;
let member: string;

const stack = (line: number) =>
  `TypeError: x is undefined\n    at openEvent (https://kanoy.pt/assets/index-abc.js:1:${line})\n    at onClick (https://kanoy.pt/assets/index-abc.js:2:10)`;

beforeEach(async () => {
  db = await createPgliteDb();
  await migrate(db);
  owner = (
    await createUser(db, { email: "owner@kanoy.test", name: "Owner", password: "x".repeat(12) })
  ).id;
  member = (
    await createUser(db, { email: "member@kanoy.test", name: "Member", password: "x".repeat(12) })
  ).id;
  await setErrorViewer(db, "OWNER@kanoy.test", true);
});

afterEach(async () => {
  await db.close();
});

describe("error log", () => {
  it("only people with access can read or change it", async () => {
    await recordError(db, { source: "browser", message: "TypeError: boom", userId: member });
    expect(await listErrors(db, member)).toBeNull();
    const [e] = (await listErrors(db, owner))!;
    expect(e).toMatchObject({ source: "browser", message: "TypeError: boom", lastUser: "Member" });
    expect(await setErrorResolved(db, member, e!.id, true)).toBe(false);
    expect(await deleteErrors(db, member, e!.id)).toBe(false);
    expect((await listErrors(db, owner))!).toHaveLength(1);
  });

  it("counts repeats of the same error instead of adding rows", async () => {
    await recordError(db, {
      source: "browser",
      message: "TypeError: x is undefined",
      detail: stack(5),
    });
    await recordError(db, {
      source: "browser",
      message: "TypeError: x is undefined",
      detail: stack(5),
    });
    await recordError(db, {
      source: "server",
      message: "TypeError: x is undefined",
      detail: stack(5),
    });
    const list = (await listErrors(db, owner))!;
    expect(list).toHaveLength(2);
    expect(list.find((e) => e.source === "browser")?.count).toBe(2);
  });

  it("treats ids and numbers in the message as the same error", () => {
    const a = fingerprint({ source: "server", message: "Event 12 not found", detail: null });
    const b = fingerprint({ source: "server", message: "Event 345 not found", detail: null });
    expect(a).toBe(b);
  });

  it("reopens a resolved error when it happens again", async () => {
    await recordError(db, { source: "browser", message: "Error: again" });
    const [e] = (await listErrors(db, owner))!;
    await setErrorResolved(db, owner, e!.id, true);
    expect((await listErrors(db, owner))![0]!.resolved).toBe(true);
    await recordError(db, { source: "browser", message: "Error: again" });
    expect((await listErrors(db, owner))![0]).toMatchObject({ resolved: false, count: 2 });
  });

  it("ignores extension errors, network drops and cross-origin noise", async () => {
    expect(isNoise({ message: "Script error.", detail: null })).toBe(true);
    expect(isNoise({ message: "TypeError: Failed to fetch", detail: null })).toBe(true);
    expect(
      isNoise({ message: "Error: x", detail: "at chrome-extension://abc/content.js:1:1" }),
    ).toBe(true);
    expect(
      await recordError(db, { source: "browser", message: "ResizeObserver loop limit exceeded" }),
    ).toBe(false);
    expect(await listErrors(db, owner)).toEqual([]);
  });

  it("clips huge reports and keeps the table capped", async () => {
    await recordError(db, {
      source: "browser",
      message: "E".repeat(5000),
      detail: "d".repeat(50_000),
    });
    const [big] = (await listErrors(db, owner))!;
    expect(big!.message.length).toBeLessThanOrEqual(500);
    expect(big!.detail!.length).toBeLessThanOrEqual(6000);

    for (let i = 0; i < MAX_ERROR_ROWS + 5; i++) {
      await recordError(db, {
        source: "server",
        message: `Error kind ${String.fromCharCode(65 + (i % 26))}${"z".repeat(Math.floor(i / 26))}`,
      });
    }
    expect((await listErrors(db, owner))!.length).toBe(MAX_ERROR_ROWS);
  });

  it("deletes one error, or all resolved ones", async () => {
    await recordError(db, { source: "browser", message: "Error: one" });
    await recordError(db, { source: "browser", message: "Error: two" });
    await recordError(db, { source: "browser", message: "Error: three" });
    const list = (await listErrors(db, owner))!;
    await deleteErrors(db, owner, list[0]!.id);
    await setErrorResolved(db, owner, list[1]!.id, true);
    await deleteErrors(db, owner, null);
    expect((await listErrors(db, owner))!.map((e) => e.message)).toEqual([list[2]!.message]);
  });
});
