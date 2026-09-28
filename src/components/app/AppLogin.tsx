import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { APP_COPY } from "./app-i18n";
import { AppScreen } from "./AppScreen";

/**
 * What the installed app shows when it opens with nobody signed in: the
 * team sign-in, in the same look as the lock screen. Signing in here creates
 * an app session, so the next step is creating the code (and Face ID).
 * "Continuar para o site" just hides it for this visit.
 */
export function AppLogin({ onSkip }: { onSkip: () => void }) {
  const { login } = useAuth();
  const { language, dict } = useLanguage();
  const t = APP_COPY[language];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await login(email, password, true);
      if (!res.ok) {
        setError(
          res.reason === "invalid"
            ? dict.account.invalid
            : res.reason === "rate_limited"
              ? dict.account.rateLimited
              : dict.account.unavailable,
        );
      }
    } catch {
      setError(dict.account.unavailable);
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 text-base text-studio-foreground placeholder:text-studio-muted focus:border-accent focus:outline-none";

  return (
    <AppScreen label={t.login.welcome}>
      <form onSubmit={submit} className="flex flex-1 flex-col px-6" noValidate>
        <div className="flex flex-1 flex-col items-center pt-16 text-center">
          <h1 className="text-2xl font-semibold">{t.login.welcome}</h1>
          <p className="mt-2 text-base text-studio-foreground/85">{t.login.text}</p>
          <div className="mt-10 flex w-full max-w-sm flex-col gap-4">
            <input
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.login.email}
              aria-label={t.login.email}
              className={field}
            />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
              aria-label={t.password}
              className={field}
            />
            {error && (
              <p role="alert" className="text-sm text-[#ff8a8a]">
                {error}
              </p>
            )}
          </div>
        </div>
        <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3">
          <button
            type="submit"
            disabled={busy || !email || !password}
            className="w-full rounded-full bg-[#3aa0ff] py-4 text-base font-medium text-ink disabled:opacity-60"
          >
            {t.login.submit}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="py-2 text-xs text-studio-muted underline"
          >
            {t.login.continueToSite}
          </button>
        </div>
      </form>
    </AppScreen>
  );
}
