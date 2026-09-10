const CONSENT_KEY = "kanoy-cookie-consent";

export type ConsentValue = "accepted" | "declined";

export function getStoredConsent(): ConsentValue | null {
  const stored = window.localStorage.getItem(CONSENT_KEY);
  return stored === "accepted" || stored === "declined" ? stored : null;
}

export function setStoredConsent(value: ConsentValue) {
  window.localStorage.setItem(CONSENT_KEY, value);
}

/** Gate for analytics/tracking scripts: only load them once the visitor has accepted. */
export function hasAnalyticsConsent(): boolean {
  return getStoredConsent() === "accepted";
}
