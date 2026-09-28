import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrate, type Db } from "./db";
import { createPgliteDb } from "./pglite-db";
import { createUser } from "./admin";
import { setPasswordWithToken } from "./auth";
import type { Mail, MailSender } from "./mail";
import { requestPasswordReset } from "./password-reset";

let db: Db & { close(): Promise<void> };
let sent: Mail[];
const send: MailSender = async (mail) => {
  sent.push(mail);
  return true;
};

beforeEach(async () => {
  db = await createPgliteDb();
  await migrate(db);
  await createUser(db, {
    email: "flavio@kanoy.test",
    name: "Flávio Alves",
    password: "antiga-password",
  });
  sent = [];
});

afterEach(async () => {
  await db.close();
});

describe("password reset emails", () => {
  it("send a working single-use link to existing accounts only", async () => {
    await requestPasswordReset(db, "  Flavio@Kanoy.test ", "https://kanoy.pt", send);
    await requestPasswordReset(db, "ninguem@kanoy.test", "https://kanoy.pt", send);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      to: "flavio@kanoy.test",
      subject: "Redefinir a palavra-passe — KANOY",
    });
    expect(sent[0]!.text).toContain("Olá Flávio,");

    const token = /token=([\w-]+)/.exec(sent[0]!.text)?.[1];
    expect(token).toBeTruthy();
    expect(await setPasswordWithToken(db, token!, "nova-password-123")).toMatchObject({
      name: "Flávio Alves",
    });
    expect(await setPasswordWithToken(db, token!, "outra-password-123")).toBeNull();
  });

  it("stop after 3 emails per hour for the same account", async () => {
    for (let i = 0; i < 5; i++)
      await requestPasswordReset(db, "flavio@kanoy.test", "https://kanoy.pt", send);
    expect(sent).toHaveLength(3);
  });
});
