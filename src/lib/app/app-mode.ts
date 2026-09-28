/**
 * True when running as the installed app (home-screen icon) on a phone or
 * tablet — the only place the code/Face ID lock screen is used. Desktop
 * installs and normal browser tabs keep the regular login.
 */
export function isInstalledTouchApp(): boolean {
  if (typeof window === "undefined") return false;
  // Dev only: `localStorage.setItem("kanoy-force-app", "1")` makes a desktop
  // browser behave like the installed app, to try the lock screen.
  if (import.meta.env.DEV) {
    try {
      if (window.localStorage.getItem("kanoy-force-app") === "1") return true;
    } catch {
      /* storage unavailable */
    }
  }
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  return standalone && window.matchMedia("(pointer: coarse)").matches;
}

/** Whether this device can do Face ID / fingerprint for the site (WebAuthn platform authenticator). */
export async function canUseBiometrics(): Promise<boolean> {
  try {
    return (
      typeof PublicKeyCredential !== "undefined" &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

/** "Face ID" on Apple devices, a generic biometrics label elsewhere. */
export function biometricsLabel(): "faceId" | "biometrics" {
  return typeof navigator !== "undefined" && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
    ? "faceId"
    : "biometrics";
}
