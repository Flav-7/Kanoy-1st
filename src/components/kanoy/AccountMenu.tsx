import { useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, IdCard, LogOut, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ProfileDialog } from "@/components/team/ProfileDialog";
import { TEAM_COPY } from "@/components/team/team-i18n";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useDismiss } from "./useDismiss";

const fieldClass =
  "w-full border-b border-studio-foreground/20 bg-transparent py-2 text-sm text-studio-foreground placeholder:text-studio-muted/60 focus:border-accent focus:outline-none";

const itemClass =
  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-studio-foreground transition-colors hover:bg-white/10";

/**
 * Top-right account button, sitting next to the language flags. Logged out it
 * opens the team sign-in dialog; logged in it drops down a menu with the
 * calendar and sign-out. Signing in keeps the visitor on the page they're on.
 */
export function AccountMenu() {
  const { user, ready, logout } = useAuth();
  const { dict, language } = useLanguage();
  const t = dict.account;

  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useDismiss(menuOpen, rootRef, () => setMenuOpen(false));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t.menuLabel}
        aria-haspopup={user ? "menu" : "dialog"}
        aria-expanded={user ? menuOpen : loginOpen}
        disabled={!ready}
        onClick={() => (user ? setMenuOpen((o) => !o) : setLoginOpen(true))}
        className={`flex h-7 w-7 items-center justify-center rounded-full border bg-ink/70 text-studio-foreground shadow-[0_1px_4px_rgba(0,0,0,0.55)] backdrop-blur transition-transform duration-200 hover:scale-110 disabled:opacity-60 ${
          user ? "border-accent" : "border-white/30"
        }`}
      >
        {user ? (
          <span className="font-display text-[11px] font-semibold uppercase">
            {user.name.charAt(0)}
          </span>
        ) : (
          <UserRound className="h-3.5 w-3.5" strokeWidth={2.25} />
        )}
      </button>

      {user && menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-3 w-56 rounded-lg border border-white/10 bg-ink p-1.5 shadow-2xl"
        >
          <div className="border-b border-white/10 px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-medium text-studio-foreground">{user.name}</p>
            <p className="truncate text-xs text-studio-muted">{user.email}</p>
          </div>
          <div className="pt-1.5">
            <Link
              to="/calendario"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className={itemClass}
            >
              <CalendarDays className="h-4 w-4 text-accent" />
              {t.calendar}
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setProfileOpen(true);
              }}
              className={itemClass}
            >
              <IdCard className="h-4 w-4 text-studio-muted" />
              {TEAM_COPY[language].profile.title}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                void logout();
              }}
              className={itemClass}
            >
              <LogOut className="h-4 w-4 text-studio-muted" />
              {t.logout}
            </button>
          </div>
        </div>
      )}

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      {user && <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />}
    </div>
  );
}

/**
 * The login never navigates, so browsers can't always tell it succeeded.
 * Where supported (Chrome, Edge, Android) hand the credentials to the
 * browser's password manager explicitly so it offers "Save password" and
 * autofills them next time; elsewhere the name/autocomplete attributes on
 * the fields do the job. Nothing is stored by the site itself.
 */
function offerToSavePassword(id: string, password: string, name: string) {
  const Ctor = (window as { PasswordCredential?: new (data: object) => Credential })
    .PasswordCredential;
  if (!Ctor || !navigator.credentials) return;
  navigator.credentials.store(new Ctor({ id, password, name })).catch(() => {});
}

export function LoginDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { login } = useAuth();
  const { dict } = useLanguage();
  const t = dict.account;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setPassword("");
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await login(email, password, remember);
      if (result.ok) {
        offerToSavePassword(email, password, result.user.name);
        setEmail("");
        handleOpenChange(false);
      } else {
        setError(
          result.reason === "invalid"
            ? t.invalid
            : result.reason === "rate_limited"
              ? t.rateLimited
              : t.unavailable,
        );
      }
    } catch (err) {
      console.error(err);
      setError(t.unavailable);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[92vw] max-w-md border-white/10 bg-ink p-8 text-studio-foreground shadow-2xl sm:rounded-xl md:p-10">
        <DialogTitle className="font-display text-2xl tracking-[-0.02em] md:text-3xl">
          {t.loginTitle}
        </DialogTitle>
        <DialogDescription className="text-sm text-studio-muted">{t.loginText}</DialogDescription>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">
              {t.emailLabel}
            </span>
            <input
              required
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">
              {t.passwordLabel}
            </span>
            <input
              required
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-studio-muted">
              <input
                type="checkbox"
                name="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              {t.rememberMe}
            </label>
            <button
              type="submit"
              disabled={pending}
              className="btn-kanoy bg-accent text-ink disabled:opacity-60"
            >
              {pending ? t.signingIn : t.submit}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
