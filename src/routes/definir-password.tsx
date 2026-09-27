import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { setPassword } from "@/lib/auth/auth.functions";
import { useAuth } from "@/lib/auth/AuthContext";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Language } from "@/lib/i18n/translations";

/**
 * Where one-time links from scripts/admin.ts land: a new team member (or a
 * password reset) picks their own password here, so nobody else ever sees it.
 * The token is in the URL; the server checks it, burns it and signs them in.
 */
export const Route = createFileRoute("/definir-password")({
  validateSearch: (search: Record<string, unknown>): { token?: string } =>
    typeof search["token"] === "string" ? { token: search["token"] } : {},
  head: () => ({
    meta: [
      { title: "KANOY — Definir palavra-passe" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SetPasswordPage,
});

const COPY: Record<
  Language,
  {
    title: string;
    text: string;
    password: string;
    confirm: string;
    submit: string;
    saving: string;
    tooShort: string;
    mismatch: string;
    invalidLink: string;
    unavailable: string;
    home: string;
  }
> = {
  pt: {
    title: "Definir palavra-passe",
    text: "Escolha a palavra-passe da sua conta da equipa KANOY.",
    password: "Nova palavra-passe",
    confirm: "Repetir palavra-passe",
    submit: "Guardar e entrar",
    saving: "A guardar…",
    tooShort: `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    mismatch: "As palavras-passe não coincidem.",
    invalidLink: "Este link já foi usado ou expirou. Peça um novo.",
    unavailable: "Não foi possível guardar agora. Tente mais tarde.",
    home: "Voltar ao site",
  },
  es: {
    title: "Definir contraseña",
    text: "Elige la contraseña de tu cuenta del equipo KANOY.",
    password: "Nueva contraseña",
    confirm: "Repetir contraseña",
    submit: "Guardar y entrar",
    saving: "Guardando…",
    tooShort: `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    mismatch: "Las contraseñas no coinciden.",
    invalidLink: "Este enlace ya se ha usado o ha caducado. Pide uno nuevo.",
    unavailable: "No se ha podido guardar ahora. Inténtalo más tarde.",
    home: "Volver al sitio",
  },
  en: {
    title: "Set your password",
    text: "Choose the password for your KANOY team account.",
    password: "New password",
    confirm: "Repeat password",
    submit: "Save and sign in",
    saving: "Saving…",
    tooShort: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    mismatch: "The passwords don't match.",
    invalidLink: "This link has already been used or has expired. Ask for a new one.",
    unavailable: "Couldn't save right now. Please try again later.",
    home: "Back to site",
  },
};

const fieldClass =
  "w-full border-b border-studio-foreground/20 bg-transparent py-2 text-sm text-studio-foreground focus:border-accent focus:outline-none";

function SetPasswordPage() {
  const { token } = Route.useSearch();
  const { language } = useLanguage();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const t = COPY[language];

  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(token ? null : t.invalidLink);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return setError(t.invalidLink);
    if (password.length < MIN_PASSWORD_LENGTH) return setError(t.tooShort);
    if (password !== confirm) return setError(t.mismatch);
    setPending(true);
    setError(null);
    try {
      const result = await setPassword({ data: { token, password } });
      if (!result.ok) {
        setError(result.reason === "invalid_link" ? t.invalidLink : t.unavailable);
        return;
      }
      await refresh();
      await navigate({ to: "/calendario" });
    } catch (err) {
      console.error(err);
      setError(t.unavailable);
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-studio px-6 text-studio-foreground">
      <form onSubmit={submit} noValidate className="w-full max-w-sm">
        <KeyRound className="h-8 w-8 text-accent" aria-hidden />
        <h1 className="mt-6 font-display text-2xl tracking-[-0.02em] md:text-3xl">{t.title}</h1>
        <p className="mt-2 text-sm text-studio-muted">{t.text}</p>
        <div className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">
              {t.password}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">
              {t.confirm}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={fieldClass}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between gap-4">
            <Link
              to="/"
              className="text-xs uppercase tracking-[0.3em] text-studio-muted hover:text-studio-foreground"
            >
              {t.home}
            </Link>
            <button
              type="submit"
              disabled={pending || !token}
              className="btn-kanoy bg-accent text-ink disabled:opacity-60"
            >
              {pending ? t.saving : t.submit}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
