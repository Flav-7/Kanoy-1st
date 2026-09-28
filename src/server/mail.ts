/**
 * Transactional email through Resend (the same account and sender as the
 * contact form: RESEND_API_KEY, CONTACT_FROM_EMAIL on a verified domain).
 * Without a key — local dev — the message is printed instead of sent.
 */
export type Mail = { to: string; subject: string; text: string };

export type MailSender = (mail: Mail) => Promise<boolean>;

export const resendSender: MailSender = async (mail) => {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["CONTACT_FROM_EMAIL"];
  if (!apiKey || !from) {
    console.info(`[mail not configured] to=${mail.to} subject=${mail.subject}\n${mail.text}`);
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `KANOY <${from}>`,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
    }),
  });
  if (!response.ok) console.error(`Resend failed (${response.status}): ${await response.text()}`);
  return response.ok;
};
