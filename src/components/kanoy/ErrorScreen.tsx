import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DEFAULT_LANGUAGE, translations, type Language } from "@/lib/i18n/translations";
import { resolveLanguage } from "@/lib/i18n/LanguageContext";
import kanoyK from "@/assets/branding/kanoy-k.webp";

/**
 * The 404 and the "this page didn't load" screens, in the site's own look and
 * in the visitor's language. It reads the language itself instead of using
 * useLanguage(): when the root route errors, the LanguageProvider is exactly
 * what has been unmounted, so the context can't be relied on here.
 */
export function ErrorScreen({ kind, onRetry }: { kind: "notFound" | "error"; onRetry?: () => void }) {
  // Server + first client render use the default language, then switch once
  // the visitor's language is known — same approach as LanguageProvider.
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  useEffect(() => setLanguage(resolveLanguage()), []);
  const t = translations[language].errors;

  const isNotFound = kind === "notFound";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-studio px-6 text-center text-studio-foreground">
      <div className="max-w-md">
        <img
          src={kanoyK}
          alt=""
          aria-hidden
          width={1024}
          height={1024}
          className="k-glow mx-auto h-16 w-auto"
        />
        {isNotFound && (
          <p className="mt-8 font-display text-6xl tracking-[-0.04em] text-accent md:text-7xl">404</p>
        )}
        <h1 className="mt-6 font-display text-2xl tracking-[-0.02em] md:text-3xl">
          {isNotFound ? t.notFoundTitle : t.errorTitle}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-studio-muted md:text-base">
          {isNotFound ? t.notFoundText : t.errorText}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="btn-kanoy border border-white/20 bg-transparent text-studio-foreground"
            >
              {t.retry}
            </button>
          )}
          {/* A plain <a> for the error case: if the router itself is what
              broke, a client-side <Link> may not work either. */}
          {isNotFound ? (
            <Link to="/" className="btn-kanoy bg-accent text-ink">
              {t.home}
            </Link>
          ) : (
            <a href="/" className="btn-kanoy bg-accent text-ink">
              {t.home}
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
