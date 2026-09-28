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
    return result.ok;
  } catch (err) {
    console.warn("passkey registration cancelled/failed", err);
    return false;
  }
}

/** Unlocks the app session with Face ID / fingerprint. */
export async function unlockWithBiometrics(): Promise<boolean> {
  const opts = await passkeyUnlockOptionsFn();
  if (!opts.ok) return false;
  try {
    const response = await startAuthentication({ optionsJSON: JSON.parse(opts.optionsJSON) });
    const result = await unlockWithPasskeyFn({
      data: { response: response as unknown as Record<string, unknown> },
    });
    return result.ok;
  } catch (err) {
    console.warn("passkey unlock cancelled/failed", err);
    return false;
  }
}
