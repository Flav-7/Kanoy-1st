import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { forgetRememberedUser, getRememberedUser } from "@/lib/app/remembered-user";
import { APP_COPY } from "./app-i18n";
import { AppScreen } from "./AppScreen";
import { EmailSignIn } from "./EmailSignIn";

/**
 * What the installed app shows when it opens with nobody signed in: the
 * email sign-in, greeting whoever used the app last on this device ("Boa
 * noite, Flávio", email prefilled). Signing in creates an app session, so the
 * next step is the code (and Face ID). "Continuar para o site" hides it for
 * this visit.
 */
export function AppLogin({ onSkip }: { onSkip: () => void }) {
  const { login } = useAuth();
  const { language, dict } = useLanguage();
  const t = APP_COPY[language];
  const [remembered, setRemembered] = useState(() => getRememberedUser());

  const submit = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await login(email, password, true);
      if (res.ok) return null;
      return res.reason === "invalid"
        ? dict.account.invalid
        : res.reason === "rate_limited"
          ? dict.account.rateLimited
          : dict.account.unavailable;
    } catch {
      return dict.account.unavailable;
    }
  };

  return (
    <AppScreen label={t.email.credentials}>
      <EmailSignIn
        key={remembered?.email ?? "new"}
        name={remembered?.name ?? null}
        defaultEmail={remembered?.email ?? ""}
        onSubmit={submit}
        secondary={
          <>
            {remembered && (
              <button
                type="button"
                onClick={() => {
                  forgetRememberedUser();
                  setRemembered(null);
                }}
                className="py-2 text-xs text-studio-muted"
              >
                {t.notYou(remembered.name.split(/\s+/)[0] ?? remembered.name)}{" "}
                <span className="underline">{t.email.otherAccount}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onSkip}
              className="py-2 text-xs text-studio-muted underline"
            >
              {t.login.continueToSite}
            </button>
          </>
        }
      />
    </AppScreen>
  );
}
