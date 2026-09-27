import webpush from "web-push";
import type { PushSender } from "./push";

/**
 * VAPID keys identify this site to the browsers' push services. Generate
 * once (`npx web-push generate-vapid-keys`) and set VAPID_PUBLIC_KEY /
 * VAPID_PRIVATE_KEY in Vercel. Without them notifications are simply off.
 */
export function vapidPublicKey(): string | null {
  return process.env["VAPID_PUBLIC_KEY"] || null;
}

export function webPushSender(): PushSender | null {
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  if (!publicKey || !privateKey) return null;
  webpush.setVapidDetails(
    process.env["VAPID_SUBJECT"] || "mailto:geral@kanoy.pt",
    publicKey,
    privateKey,
  );

  return async (subscription, message) => {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(message), { TTL: 24 * 3600 });
      return "sent";
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) return "gone";
      throw err;
    }
  };
}
