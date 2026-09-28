import { useEffect, useState } from "react";
import { Fingerprint, ScanFace } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { setPinFn, setUnlockMethodsFn } from "@/lib/app/applock.functions";
import { biometricsLabel, canUseBiometrics } from "@/lib/app/app-mode";
import { registerThisDevice } from "@/lib/app/passkey-client";
import { pinProblem } from "@/lib/app/pin";
import { APP_COPY } from "./app-i18n";
import { PinPad } from "./PinPad";

/**
 * First run of the installed app (or after "Recuperar código"): create the
 * 6-digit code, confirm it, then optionally turn on Face ID for this device.
 */
export function PinSetup({ onDone }: { onDone: () => void }) {
  const { session, refresh } = useAuth();
  const { language } = useLanguage();
  const t = APP_COPY[language];
  const bio = biometricsLabel();
  const BioIcon = bio === "faceId" ? ScanFace : Fingerprint;

  const [step, setStep] = useState<"create" | "confirm" | "bio">("create");
  const [first, setFirst] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [canBio, setCanBio] = useState(false);

  useEffect(() => {
    void canUseBiometrics().then(setCanBio);
  }, []);

  const finish = async () => {
    await refresh();
    onDone();
  };

  const onComplete = async (code: string) => {
    if (step === "create") {
      if (pinProblem(code)) {
        setError(t.setup.tooSimple);
        setShake((s) => s + 1);
        setValue("");
        return;
      }
      setFirst(code);
      setValue("");
      setError(null);
      setStep("confirm");
      return;
    }
    if (code !== first) {
      setError(t.setup.mismatch);
      setShake((s) => s + 1);
      setValue("");
      setFirst("");
      setStep("create");
      return;
    }
    setBusy(true);
    try {
      const res = await setPinFn({ data: { pin: code } });
      if (!res.ok) {
        setError(res.reason === "too_simple" ? t.setup.tooSimple : t.account.error);
        setStep("create");
        setValue("");
        return;
      }
      if (canBio && (session?.passkeyCount ?? 0) === 0) setStep("bio");
      else await finish();
    } catch {
      setError(t.account.error);
    } finally {
      setBusy(false);
    }
  };

  const enableBio = async () => {
    setBusy(true);
    // Registering turns Face ID on next to the code (see verifyPasskeyRegistration).
    await registerThisDevice();
    setBusy(false);
    await finish();
  };

  const skipCode = async () => {
    await setUnlockMethodsFn({ data: { methods: ["password"] } }).catch(() => {});
    await finish();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col items-center overflow-y-auto bg-studio px-6 text-center text-studio-foreground"
      style={{
        backgroundImage:
          "radial-gradient(90% 55% at 0% 0%, color-mix(in oklab, var(--accent) 16%, transparent), transparent 70%), linear-gradient(to bottom, #07131c, #04080b)",
        paddingTop: "max(env(safe-area-inset-top), 2.5rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)",
      }}
    >
      {step === "bio" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <BioIcon className="h-16 w-16 text-accent" strokeWidth={1.25} />
          <h1 className="text-2xl font-semibold">{t.setup.biometricsTitle[bio]}</h1>
          <p className="max-w-xs text-sm text-studio-foreground/80">{t.setup.biometricsText}</p>
          <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void enableBio()}
              className="w-full rounded-full bg-[#3aa0ff] py-4 font-medium text-ink disabled:opacity-60"
            >
              {t.setup.enableBiometrics}
            </button>
            <button
              type="button"
              onClick={() => void finish()}
              className="w-full rounded-full bg-[#12324a] py-4 font-medium text-[#3aa0ff]"
            >
              {t.setup.notNow}
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="mt-6 text-2xl font-semibold">
            {step === "create" ? t.setup.createTitle : t.setup.confirmTitle}
          </h1>
          <p className="mt-2 max-w-xs text-sm text-studio-foreground/80">{t.setup.createText}</p>
          <div className="mt-12 flex-1">
            <PinPad
              value={value}
              onChange={(v) => {
                setValue(v);
                setError(null);
              }}
              onComplete={(v) => void onComplete(v)}
              disabled={busy}
              shake={shake}
              deleteLabel={t.delete}
            />
            {error && (
              <p role="alert" className="mx-auto mt-6 max-w-xs text-sm text-[#ff8a8a]">
                {error}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void skipCode()}
            className="mt-6 py-2 text-xs text-studio-muted underline"
          >
            {t.setup.skipCode}
          </button>
        </>
      )}
    </div>
  );
}
