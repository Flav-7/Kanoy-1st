import { useCallback, useEffect, useRef, useState } from "react";
import { Fingerprint, ScanFace } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { unlockWithPasswordFn, unlockWithPinFn } from "@/lib/app/applock.functions";
import { biometricsLabel, canUseBiometrics } from "@/lib/app/app-mode";
import { unlockWithBiometrics } from "@/lib/app/passkey-client";
import { PIN_LENGTH } from "@/lib/app/pin";
import { APP_COPY } from "./app-i18n";
import { AppScreen } from "./AppScreen";
import { EmailSignIn } from "./EmailSignIn";
import { Greeting } from "./Greeting";
import { PinPad } from "./PinPad";

type Mode = "code" | "biometrics" | "email";

/**
 * Full-screen lock of the installed app, shown while its session is locked.
 * It opens on the person's chosen way in — the code keypad (with the Face ID
 * key when Face ID is on too), Face ID alone, or email — and "Entrar com
 * email" is always there as the way back in. The server checks every unlock
 * and refuses data until one succeeds; this screen is only how it asks.
 */
export function LockScreen({ onRecovered }: { onRecovered: () => void }) {
  const { session, refresh, logout, login } = useAuth();
  const { language, dict } = useLanguage();
  const t = APP_COPY[language];
  const bio = biometricsLabel();
  const BioIcon = bio === "faceId" ? ScanFace : Fingerprint;

  const methods = session?.unlockMethods ?? ["pin"];
  const codeOn = methods.includes("pin") && Boolean(session?.hasPin);
  const bioOn = methods.includes("passkey") && (session?.passkeyCount ?? 0) > 0;

  const [mode, setMode] = useState<Mode>(codeOn ? "code" : bioOn ? "biometrics" : "email");
  const [recovering, setRecovering] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const autoTried = useRef(false);

  const name = session?.user.name ?? null;

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
      setBioAvailable(can && bioOn);
      // Face ID on: ask right away, once per opening of the app.
      if (can && bioOn && !autoTried.current && mode !== "email") {
        autoTried.current = true;
        void tryBiometrics();
      }
    });
  }, [bioOn, mode, tryBiometrics]);

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

  /** Email screen: the same account unlocks; another email signs in as that person. */
  const submitEmail = async (email: string, password: string): Promise<string | null> => {
    try {
      if (session && email.toLowerCase() === session.user.email.toLowerCase()) {
        const res = await unlockWithPasswordFn({ data: { password } });
        if (res.ok) {
          if (recovering) onRecovered();
          await refresh();
          return null;
        }
        if (res.reason === "no_session") await refresh();
        return res.reason === "invalid"
          ? t.wrongPassword
          : res.reason === "rate_limited"
            ? t.rateLimited
            : t.account.error;
      }
      await logout();
      const res = await login(email, password, true);
      if (res.ok) return null;
      return res.reason === "invalid"
        ? dict.account.invalid
        : res.reason === "rate_limited"
          ? dict.account.rateLimited
          : dict.account.unavailable;
    } catch {
      return t.account.error;
    }
  };

  const secondaryButton =
    "w-full rounded-full bg-[#12324a] py-3.5 text-base font-medium text-[#3aa0ff]";
  const signOutLink = (
    <button
      type="button"
      onClick={() => void logout()}
      className="mt-1 py-2 text-xs text-studio-muted"
    >
      {t.notYou(name?.split(/\s+/)[0] ?? "")} <span className="underline">{t.signOut}</span>
    </button>
  );

  if (mode === "email") {
    return (
      <AppScreen label={t.email.credentials}>
        <EmailSignIn
          name={name}
          defaultEmail={session?.user.email ?? ""}
          onSubmit={submitEmail}
          onBiometrics={bioAvailable ? () => void tryBiometrics() : undefined}
          busy={busy}
          secondary={
            <>
              {codeOn && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("code");
                    setRecovering(false);
                  }}
                  className="py-2 text-sm text-[#3aa0ff]"
                >
                  {t.useCode}
                </button>
              )}
              {signOutLink}
            </>
          }
        />
      </AppScreen>
    );
  }

  const toEmail = (recover: boolean) => {
    setMode("email");
    setRecovering(recover);
    setError(null);
  };

  return (
    <AppScreen label={mode === "code" ? t.enterCode : t.unlockWithBiometrics[bio]}>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
        <Greeting
          name={name}
          subtitle={mode === "code" ? t.enterCode : t.unlockWithBiometrics[bio]}
        />

        <div className="mt-6 flex w-full flex-col items-center">
          {mode === "code" ? (
            <>
              <PinPad
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  setError(null);
                }}
                onComplete={(v) => void submitPin(v)}
                leftKey={
                  bioAvailable ? (
                    <button
                      type="button"
                      onClick={() => void tryBiometrics()}
                      disabled={busy}
                      aria-label={t.unlockWithBiometrics[bio]}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.07] text-studio-foreground active:bg-white/20 disabled:opacity-40 sm:h-[4.5rem] sm:w-[4.5rem]"
                    >
                      <BioIcon className="h-7 w-7" strokeWidth={1.5} />
                    </button>
                  ) : null
                }
                disabled={busy}
                shake={shake}
                deleteLabel={t.delete}
              />
              <button
                type="button"
                onClick={() => toEmail(true)}
                className="mt-3 text-xs text-studio-muted underline"
              >
                {t.email.forgotCode}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void tryBiometrics()}
              disabled={busy}
              className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-white/[0.07] px-6 py-6 text-sm active:bg-white/15 disabled:opacity-50"
            >
              <BioIcon className="h-10 w-10" strokeWidth={1.25} />
              {t.email.useBiometrics[bio]}
            </button>
          )}
          {error && (
            <p role="alert" className="mt-3 max-w-sm text-sm text-[#ff8a8a]">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-md flex-col gap-2.5 px-6">
        {mode === "code" && (
          <button
            type="button"
            disabled={busy || pin.length !== PIN_LENGTH}
            onClick={() => void submitPin(pin)}
            className="w-full rounded-full bg-[#3aa0ff] py-3.5 text-base font-medium text-ink disabled:opacity-60"
          >
            {t.enter}
          </button>
        )}
        <button type="button" onClick={() => toEmail(false)} className={secondaryButton}>
          {t.email.signInWithEmail}
        </button>
        {mode === "biometrics" && codeOn && (
          <button
            type="button"
            onClick={() => setMode("code")}
            className="py-2 text-sm text-[#3aa0ff]"
          >
            {t.useCode}
          </button>
        )}
        {signOutLink}
      </div>
    </AppScreen>
  );
}
