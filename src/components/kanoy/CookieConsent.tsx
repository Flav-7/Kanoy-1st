import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getStoredConsent, setStoredConsent, type ConsentValue } from "@/lib/consent";

export function CookieConsent() {
  const { dict } = useLanguage();
  // Server + first client render never show the banner, so there's no
  // hydration mismatch; the stored choice is only readable after mount.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getStoredConsent() === null);
  }, []);

  const choose = (value: ConsentValue) => {
    setStoredConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookies"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-ink/95 px-6 py-5 text-studio-foreground backdrop-blur md:px-14"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-relaxed text-studio-muted">
          {dict.cookies.message}{" "}
          <Link to="/privacidade" className="underline underline-offset-2 hover:text-studio-foreground">
            {dict.cookies.privacyLink}
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="rounded-md border border-white/20 px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-studio-foreground transition-colors hover:bg-white/10"
          >
            {dict.cookies.decline}
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-md bg-accent px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-accent-foreground transition-colors hover:bg-accent/90"
          >
            {dict.cookies.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
