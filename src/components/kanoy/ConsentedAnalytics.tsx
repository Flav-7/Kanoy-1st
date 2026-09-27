import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { CONSENT_CHANGE_EVENT, hasAnalyticsConsent } from "@/lib/consent";

/**
 * Vercel Web Analytics, loaded only once the visitor has accepted analytics
 * in the cookie banner (as the banner and privacy policy promise) — right
 * away if they accept on this visit, or on load if they accepted before.
 */
export function ConsentedAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(hasAnalyticsConsent());
    sync();
    window.addEventListener(CONSENT_CHANGE_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, sync);
  }, []);

  return allowed ? <Analytics /> : null;
}
