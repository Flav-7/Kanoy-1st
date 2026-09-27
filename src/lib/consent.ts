const CONSENT_KEY = "kanoy-cookie-consent";

export type ConsentValue = "accepted" | "declined";

export function getStoredConsent(): ConsentValue | null {
  const stored = window.localStorage.getItem(CONSENT_KEY);
  return stored === "accepted" || stored === "declined" ? stored : null;
}

/** Fired on window when the visitor makes a choice, so gated scripts can start without a reload. */
export const CONSENT_CHANGE_EVENT = "kanoy-consent-change";

export function setStoredConsent(value: ConsentValue) {
  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

/** Gate for analytics/tracking scripts: only load them once the visitor has accepted. */
export function hasAnalyticsConsent(): boolean {
  return getStoredConsent() === "accepted";
}
