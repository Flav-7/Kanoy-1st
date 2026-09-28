import type { Db } from "./db";
import { createPasswordToken, normalizeEmail } from "./auth";
import type { MailSender } from "./mail";

/** At most this many reset emails per account per hour. */
const MAX_RESETS_PER_HOUR = 3;

/**
 * "Esqueceu a palavra-passe?": emails a single-use link to /definir-password
 * (the same page new accounts use). The caller gets the same answer whether
 * or not the email has an account, so the form can't be used to find out.
 */
export async function requestPasswordReset(
  db: Db,
  rawEmail: string,
  siteOrigin: string,
  send: MailSender,
): Promise<void> {
  const email = normalizeEmail(rawEmail);
  const [user] = await db.query<{ id: string; name: string }>(
    "select id, name from users where email = $1",
    [email],
  );
  if (!user) return;

  // Links live 72 h, so one expiring more than 71 h from now was made this hour.
  const [{ recent } = { recent: 0 }] = await db.query<{ recent: number }>(
    `select count(*)::int as recent from password_tokens
      where user_id = $1 and expires_at > now() + interval '71 hours'`,
    [user.id],
  );
  if (recent >= MAX_RESETS_PER_HOUR) return;

  const token = await createPasswordToken(db, String(user.id));
  const firstName = user.name.split(/\s+/)[0] ?? user.name;
  await send({
    to: email,
    subject: "Redefinir a palavra-passe — KANOY",
    text: [
      `Olá ${firstName},`,
      "",
      "Pediu para redefinir a palavra-passe da sua conta KANOY. Abra este link para escolher uma nova:",
      "",
      `${siteOrigin}/definir-password?token=${token}`,
      "",
      "O link só funciona uma vez e expira em 72 horas. Se não foi você, ignore este email: a palavra-passe atual continua a funcionar.",
      "",
      "KANOY",
    ].join("\n"),
  });
}
