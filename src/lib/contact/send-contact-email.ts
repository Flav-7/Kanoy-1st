import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(60).optional(),
  message: z.string().trim().min(1).max(4000),
  replyLanguage: z.enum(["pt", "es", "en"]),
});

export type ContactFormInput = z.infer<typeof contactSchema>;

export const sendContactEmail = createServerFn({ method: "POST" })
  .validator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["RESEND_API_KEY"];
    const to = process.env["CONTACT_TO_EMAIL"];
    const from = process.env["CONTACT_FROM_EMAIL"] ?? "onboarding@resend.com";

    if (!apiKey || !to) {
      throw new Error("Contact form is not configured on the server.");
    }

    const text = [
      `Nome: ${data.name}`,
      `Email: ${data.email}`,
      data.phone ? `Telefone: ${data.phone}` : null,
      `Responder em: ${data.replyLanguage.toUpperCase()}`,
      "",
      data.message,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Kanoy — Site <${from}>`,
        to: [to],
        reply_to: data.email,
        subject: `[${data.replyLanguage.toUpperCase()}] Novo contacto do site — ${data.name}`,
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend request failed (${response.status}): ${body}`);
    }

    return { ok: true as const };
  });
