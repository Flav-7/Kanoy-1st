import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Fingerprint, ScanFace } from "lucide-react";
import kanoyK from "@/assets/branding/kanoy-k.webp";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/translations";
import { unlockWithPasswordFn, unlockWithPinFn } from "@/lib/app/applock.functions";
import { biometricsLabel, canUseBiometrics } from "@/lib/app/app-mode";
import { unlockWithBiometrics } from "@/lib/app/passkey-client";
import { PIN_LENGTH } from "@/lib/app/pin";
import { APP_COPY } from "./app-i18n";
import { PinPad } from "./PinPad";

function greetingKey(hour: number): "morning" | "afternoon" | "evening" {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 20) return "afternoon";
  return "evening";
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.charAt(0) ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase();
}

/**
 * Full-screen lock of the installed app ("Boa noite, Dinis" + keypad), shown
 * while the app session is locked. The server refuses data until one of the
 * unlocks below succeeds; "Recuperar código" unlocks with the password and
 * then asks for a new code (via onRecovered).
 */
export function LockScreen({ onRecovered }: { onRecovered: () => void }) {
  const { session, refresh, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = APP_COPY[language];
  const bio = biometricsLabel();

  const method = session?.unlockMethod ?? "pin";
  const hasPin = Boolean(session?.hasPin);
  const [mode, setMode] = useState<"pin" | "password">(
    method === "password" || !hasPin ? "password" : "pin",
  );
  const [recovering, setRecovering] = useState(false);
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [bioAvailable, setBioAvailable] = useState(false);
  const autoTried = useRef(false);

  const name = session?.user.name ?? "";
  const firstName = name.split(/\s+/)[0] ?? name;

  const tryBiometrics = useCallback(async () => {
    setBusy(true);
    setError(null);
    const ok = await unlockWithBiometrics();
    setBusy(false);
    if (ok) await refresh();
    else setError(t.biometricsFailed);
  }, [refresh, t.biometricsFailed]);

  useEffect(() => {
    void canUseBiometrics().then((can) => {
      const available = can && (session?.passkeyCount ?? 0) > 0;
      setBioAvailable(available);
      // Face ID chosen as the way in: ask right away (once).
      if (available && method === "passkey" && !autoTried.current) {
        autoTried.current = true;
        void tryBiometrics();
      }
    });
  }, [method, session?.passkeyCount, tryBiometrics]);

  const submitPin = async (code: string) => {
    if (code.length !== PIN_LENGTH) return;
    setBusy(true);
    setError(null);
    try {
      const res = await unlockWithPinFn({ data: { pin: code } });
      if (res.ok) {
        await refresh();
        return;
      }
      setPin("");
      setShake((s) => s + 1);
      if (res.reason === "wrong") setError(t.wrongCode(res.attemptsLeft));
      else if (res.reason === "signed_out") {
        setError(t.signedOutTooMany);
        setTimeout(() => void refresh(), 2500);
      } else await refresh();
    } catch {
      setError(t.account.error);
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async () => {
    if (!password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await unlockWithPasswordFn({ data: { password } });
      if (res.ok) {
        if (recovering) onRecovered();
        await refresh();
        return;
      }
      setError(
        res.reason === "invalid"
          ? t.wrongPassword
          : res.reason === "rate_limited"
            ? t.rateLimited
            : t.account.error,
      );
      if (res.reason === "no_session") await refresh();
    } catch {
      setError(t.account.error);
    } finally {
      setBusy(false);
    }
  };

  const BioIcon = bio === "faceId" ? ScanFace : Fingerprint;
  const bioButton = bioAvailable ? (
    <button
      type="button"
      onClick={() => void tryBiometrics()}
      disabled={busy}
      aria-label={t.unlockWithBiometrics[bio]}
      className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-white/[0.07] text-studio-foreground active:bg-white/20 disabled:opacity-40 sm:h-20 sm:w-20"
    >
      <BioIcon className="h-7 w-7" strokeWidth={1.5} />
    </button>
  ) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.enterCode}
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-studio text-studio-foreground"
      style={{
        backgroundImage:
          "radial-gradient(90% 55% at 0% 0%, color-mix(in oklab, var(--accent) 16%, transparent), transparent 70%), linear-gradient(to bottom, #07131c, #04080b)",
        paddingTop: "max(env(safe-area-inset-top), 1rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
      }}
    >
      <header className="flex items-center justify-between px-6 pt-2">
        <img src={kanoyK} alt="KANOY" width={1024} height={1024} className="h-9 w-auto" />
        <div className="flex rounded-full bg-white/[0.06] p-1 text-sm">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              aria-pressed={language === code}
              className={`rounded-full px-3 py-1.5 ${language === code ? "bg-white/10 font-medium" : "text-studio-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center px-6 pt-8 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/10 bg-[#e8f3ff] text-3xl font-medium text-[#3b9cff]">
          {initials(name)}
        </div>
        <h1 className="mt-6 text-2xl font-semibold">
          {t.greeting[greetingKey(new Date().getHours())]}, {firstName}
        </h1>
        <p className="mt-2 text-base text-studio-foreground/85">
          {mode === "pin" ? t.enterCode : t.enterPassword}
        </p>

        <div className="mt-10 flex w-full flex-1 flex-col items-center">
          {mode === "pin" ? (
            <PinPad
              value={pin}
              onChange={(v) => {
                setPin(v);
                setError(null);
              }}
              onComplete={(v) => void submitPin(v)}
              leftKey={bioButton}
              disabled={busy}
              shake={shake}
              deleteLabel={t.delete}
            />
          ) : (
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void submitPassword();
              }}
              className="flex w-full max-w-sm flex-col gap-4"
            >
              {/* Lets the password manager match the saved login for this account. */}
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={session?.user.email ?? ""}
                readOnly
                hidden
              />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.password}
                aria-label={t.password}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 text-base text-studio-foreground placeholder:text-studio-muted focus:border-accent focus:outline-none"
              />
              {/* With two fields and no submit button, browsers ignore Enter. */}
              <button type="submit" className="sr-only" tabIndex={-1} aria-hidden>
                {t.enter}
              </button>
              {bioAvailable && (
                <button
                  type="button"
                  onClick={() => void tryBiometrics()}
                  className="flex items-center justify-center gap-2 text-sm text-accent"
                >
                  <BioIcon className="h-5 w-5" /> {t.unlockWithBiometrics[bio]}
                </button>
              )}
            </form>
          )}
          {error && (
            <p role="alert" className="mt-6 max-w-sm text-sm text-[#ff8a8a]">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 px-6">
        <button
          type="button"
          disabled={busy || (mode === "pin" ? pin.length !== PIN_LENGTH : !password)}
          onClick={() => void (mode === "pin" ? submitPin(pin) : submitPassword())}
          className="w-full rounded-full bg-[#3aa0ff] py-4 text-base font-medium text-ink disabled:opacity-60"
        >
          {t.enter}
        </button>
        {mode === "pin" ? (
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setRecovering(true);
              setError(null);
            }}
            className="w-full rounded-full bg-[#12324a] py-4 text-base font-medium text-[#3aa0ff]"
          >
            {t.recoverCode}
          </button>
        ) : (
          hasPin && (
            <button
              type="button"
              onClick={() => {
                setMode("pin");
                setRecovering(false);
                setError(null);
              }}
              className="w-full rounded-full bg-[#12324a] py-4 text-base font-medium text-[#3aa0ff]"
            >
              {t.useCode}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-1 py-2 text-xs text-studio-muted"
        >
          {t.notYou(firstName)} <span className="underline">{t.signOut}</span>
        </button>
      </div>
    </div>
  );
}
