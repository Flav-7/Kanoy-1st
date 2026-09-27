import { getPushConfig, subscribePush, unsubscribePush } from "./team.functions";

/**
 * Browser side of calendar notifications. States a device can be in:
 *  - "unsupported": no Web Push here;
 *  - "install": iPhone/iPad in Safari — push only exists once the site is
 *    added to the home screen and opened from there;
 *  - "denied": the person blocked notifications for the site (only the
 *    browser/phone settings can undo that);
 *  - "off" / "on".
 */
export type PushState = "unsupported" | "install" | "denied" | "off" | "on";

function isIosBrowserTab(): boolean {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone =
    (navigator as { standalone?: boolean }).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;
  return ios && !standalone;
}

function supported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  // Production registers the worker on load; make sure it exists here too (e.g. dev).
  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export async function currentPushState(): Promise<PushState> {
  if (isIosBrowserTab()) return "install";
  if (!supported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return "off";
  // Re-link the device to whoever is signed in now (e.g. after switching accounts).
  await subscribePush({ data: subscriptionData(sub) }).catch(() => {});
  return "on";
}

function subscriptionData(sub: PushSubscription) {
  const keys = sub.toJSON().keys ?? {};
  return {
    endpoint: sub.endpoint,
    keys: { p256dh: keys["p256dh"] ?? "", auth: keys["auth"] ?? "" },
  };
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** Asks permission and subscribes. Returns the resulting state, or "unconfigured" if the server has no keys. */
export async function enablePush(): Promise<PushState | "unconfigured"> {
  if (isIosBrowserTab()) return "install";
  if (!supported()) return "unsupported";
  const { publicKey } = await getPushConfig();
  if (!publicKey) return "unconfigured";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";
  const reg = await registration();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(publicKey),
    }));
  await subscribePush({ data: subscriptionData(sub) });
  return "on";
}

/** Stops notifications on this device (also used on sign-out, so a shared device stops getting them). */
export async function disablePush(): Promise<void> {
  if (!supported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await unsubscribePush({ data: { endpoint: sub.endpoint } }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}
