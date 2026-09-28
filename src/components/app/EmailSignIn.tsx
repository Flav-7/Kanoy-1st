import { useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, Fingerprint, ScanFace } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { requestPasswordResetFn } from "@/lib/auth/auth.functions";
import { biometricsLabel } from "@/lib/app/app-mode";
import { APP_COPY } from "./app-i18n";
import { Greeting } from "./Greeting";

/**
 * The "sign in with your credentials" screen of the app (email + password,
 * the Face ID card when available, "Esqueceu a palavra-passe?"). Used both on
 * the lock screen and when the app opens with nobody signed in.
 * `onSubmit` returns an error message, or null when it worked.
 */
export function EmailSignIn({
  name,
  defaultEmail,
  onSubmit,
  onBiometrics,
  secondary,
  busy,
}: {
  name: string | null;
  defaultEmail: string;
  onSubmit: (email: string, password: string) => Promise<string | null>;
  onBiometrics?: (() => void) | undefined;
  secondary?: ReactNode;
  busy?: boolean;
}) {
  const { language } = useLanguage();
  const t = APP_COPY[language];
  const bio = biometricsLabel();
  const BioIcon = bio === "faceId" ? ScanFace : Fingerprint;

  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setPending(true);
    setError(null);
    setNotice(null);
    setError(await onSubmit(email.trim(), password));
    setPending(false);
  };

  const forgot = async () => {
    setError(null);
    if (!email.trim()) {
      setNotice(t.email.resetNeedsEmail);
      return;
    }
    await requestPasswordResetFn({ data: { email: email.trim() } }).catch(() => {});
    setNotice(t.email.resetSent);
  };

  const field =
    "w-full rounded-2xl border border-white/25 bg-transparent px-5 py-3.5 text-base text-studio-foreground placeholder:text-studio-muted focus:border-accent focus:outline-none";
  const disabled = busy || pending;

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col px-6" noValidate>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <Greeting name={name} subtitle={t.email.credentials} />
        <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
          <input
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.email.emailField}
            aria-label={t.email.emailField}
            className={field}
          />
          <div className="relative">
            <input
              type={visible ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
              aria-label={t.password}
              className={`${field} pr-14`}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? t.email.hidePassword : t.email.showPassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-studio-muted"
            >
              {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {onBiometrics && (
            <button
              type="button"
              onClick={onBiometrics}
              disabled={disabled}
              className="mt-1 flex flex-col items-center gap-2 rounded-2xl bg-white/[0.07] px-6 py-4 text-sm text-studio-foreground active:bg-white/15 disabled:opacity-50"
            >
              <BioIcon className="h-8 w-8" strokeWidth={1.25} />
              {t.email.useBiometrics[bio]}
            </button>
          )}
          {error && (
            <p role="alert" className="text-sm text-[#ff8a8a]">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-accent">
              {notice}
            </p>
          )}
        </div>
      </div>
      <div className="mx-auto mt-4 flex w-full max-w-md flex-col gap-2.5">
        <button
          type="submit"
          disabled={disabled || !email || !password}
          className="w-full rounded-full bg-[#3aa0ff] py-3.5 text-base font-medium text-ink disabled:opacity-60"
        >
          {t.enter}
        </button>
        <button
          type="button"
          onClick={() => void forgot()}
          className="w-full rounded-full bg-[#12324a] py-3.5 text-base font-medium text-[#3aa0ff]"
        >
          {t.email.forgotPassword}
        </button>
        {secondary}
      </div>
    </form>
  );
}
