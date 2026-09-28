import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import {
  passkeyRegistrationOptionsFn,
  passkeyUnlockOptionsFn,
  registerPasskeyFn,
  unlockWithPasskeyFn,
} from "./applock.functions";

/** A short label for this device in "Minha conta" (e.g. "iPhone", "Android"). */
function deviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? "Android" : "Tablet Android";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Dispositivo";
}

/**
 * Face ID / fingerprint for this device: the system sheet asks to confirm,
 * the device keeps the private key, the server stores the public one.
 * Returns false when the person cancels or the device can't.
 */
export async function registerThisDevice(): Promise<boolean> {
  const opts = await passkeyRegistrationOptionsFn();
  if (!opts.ok) return false;
  try {
    const response = await startRegistration({ optionsJSON: JSON.parse(opts.optionsJSON) });
    const result = await registerPasskeyFn({
      data: { response: response as unknown as Record<string, unknown>, deviceName: deviceName() },
    });
    if (result.ok) rememberLocalPasskey(response.id);
    return result.ok;
  } catch (err) {
    console.warn("passkey registration cancelled/failed", err);
    return false;
  }
}

// The passkey created on this device. Face ID only ever asks for it: offered
// the account's other passkeys (another phone, the PC), iOS falls back to
// "scan a QR code with another device", which nobody here wants.
const LOCAL_PASSKEY_KEY = "kanoy-passkey-id";

function localPasskeyId(): string | null {
  try {
    return localStorage.getItem(LOCAL_PASSKEY_KEY);
  } catch {
    return null;
  }
}

function rememberLocalPasskey(id: string | null) {
  try {
    if (id) localStorage.setItem(LOCAL_PASSKEY_KEY, id);
    else localStorage.removeItem(LOCAL_PASSKEY_KEY);
  } catch {
    // Private mode etc.: Face ID then just isn't offered automatically.
  }
}

/** Whether this device has its own Face ID key (so it's fine to ask right away). */
export function hasLocalPasskey(): boolean {
  return localPasskeyId() !== null;
}

type AllowedCredential = { id: string; type: string; transports?: string[] };

export type BiometricsResult = "ok" | "cancelled" | "failed";

/**
 * Unlocks the app session with Face ID / fingerprint, using only the key on
 * this device ("cancelled" when the person closes the system sheet).
 */
export async function unlockWithBiometrics(): Promise<BiometricsResult> {
  const opts = await passkeyUnlockOptionsFn();
  if (!opts.ok) return "failed";
  const optionsJSON = JSON.parse(opts.optionsJSON) as { allowCredentials?: AllowedCredential[] };
  const all = optionsJSON.allowCredentials ?? [];
  const localId = localPasskeyId();
  const mine = all.filter((c) => c.id === localId);
  // This device's key was removed in "Minha conta": forget it.
  if (localId && mine.length === 0) rememberLocalPasskey(null);
  optionsJSON.allowCredentials = (mine.length ? mine : all).map((c) => ({
    ...c,
    transports: ["internal"],
  }));
  try {
    const response = await startAuthentication({
      optionsJSON: optionsJSON as Parameters<typeof startAuthentication>[0]["optionsJSON"],
    });
    const result = await unlockWithPasskeyFn({
      data: { response: response as unknown as Record<string, unknown> },
    });
    if (result.ok) rememberLocalPasskey(response.id);
    return result.ok ? "ok" : "failed";
  } catch (err) {
    console.warn("passkey unlock cancelled/failed", err);
    return err instanceof Error && err.name === "NotAllowedError" ? "cancelled" : "failed";
  }
}
