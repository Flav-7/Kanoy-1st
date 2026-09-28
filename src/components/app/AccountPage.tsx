import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Fingerprint,
  Lock,
  ScanFace,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-react";
import { AccountMenu, LoginDialog } from "@/components/kanoy/AccountMenu";
import { NotificationsButton } from "@/components/team/NotificationsButton";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getMyProfile, saveMyProfile } from "@/lib/team/team.functions";
import {
  deletePasskeyFn,
  listPasskeysFn,
  setPinFn,
  setUnlockMethodFn,
} from "@/lib/app/applock.functions";
import { biometricsLabel, canUseBiometrics } from "@/lib/app/app-mode";
import { registerThisDevice } from "@/lib/app/passkey-client";
import { PIN_LENGTH, pinProblem } from "@/lib/app/pin";
import { APP_COPY } from "./app-i18n";

type Copy = (typeof APP_COPY)["pt"];

const inputClass =
  "w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-studio-foreground placeholder:text-studio-muted/60 focus:border-accent focus:outline-none";

function useCopy(): Copy {
  const { language } = useLanguage();
  return APP_COPY[language];
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-ink p-5 md:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg">
        <span className="text-accent">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Note({ kind, text }: { kind: "ok" | "error"; text: string }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`mt-3 text-sm ${kind === "error" ? "text-destructive" : "text-accent"}`}
    >
      {text}
    </p>
  );
}

/** /conta — profile, how the installed app is unlocked, and notifications. */
export function AccountPage() {
  const { user, ready } = useAuth();
  const t = useCopy();
  const { dict } = useLanguage();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-studio text-studio-foreground">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:px-6">
        <Link
          to="/calendario"
          className="flex items-center gap-2 rounded text-xs uppercase tracking-[0.2em] text-studio-muted hover:text-studio-foreground"
          aria-label={t.menu.calendar}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t.menu.calendar}</span>
        </Link>
        <h1 className="flex-1 font-display text-base md:text-lg">{t.account.title}</h1>
        <AccountMenu />
      </header>
      {!ready ? null : !user ? (
        <div className="flex flex-col items-center gap-4 px-6 py-24">
          <Lock className="h-8 w-8 text-accent" aria-hidden />
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="btn-kanoy bg-accent text-ink"
          >
            {dict.account.loginTitle}
          </button>
          <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
        </div>
      ) : (
        <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6">
          <ProfileSection />
          <UnlockSection />
          <Section icon={<Smartphone className="h-4 w-4" />} title={t.account.notifications}>
            <NotificationsButton />
          </Section>
        </main>
      )}
    </div>
  );
}

function ProfileSection() {
  const t = useCopy();
  const { refresh } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    void getMyProfile().then((res) => {
      if (res.ok && res.value) {
        setName(res.value.name);
        setJobTitle(res.value.jobTitle ?? "");
      }
    });
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await saveMyProfile({ data: { name, jobTitle } });
      if (!res.ok) return setNote({ kind: "error", text: t.account.error });
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ["calendar"] });
      setNote({ kind: "ok", text: t.account.saved });
    } catch {
      setNote({ kind: "error", text: t.account.error });
    }
  };

  return (
    <Section icon={<UserRound className="h-4 w-4" />} title={t.account.profile}>
      <form onSubmit={save} className="space-y-4" noValidate>
        <label className="block space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">
            {t.account.name}
          </span>
          <input
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">
            {t.account.jobTitle}
          </span>
          <input
            maxLength={60}
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className={inputClass}
          />
          <span className="block text-xs text-studio-muted">{t.account.jobTitleHint}</span>
        </label>
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-ink"
        >
          {t.account.save}
        </button>
      </form>
      {note && <Note {...note} />}
    </Section>
  );
}

function UnlockSection() {
  const t = useCopy();
  const { session, refresh } = useAuth();
  const bio = biometricsLabel();
  const BioIcon = bio === "faceId" ? ScanFace : Fingerprint;
  const [canBio, setCanBio] = useState(false);
  const [code, setCode] = useState("");
  const [editingCode, setEditingCode] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const passkeys = useQuery({ queryKey: ["passkeys"], queryFn: () => listPasskeysFn() });

  useEffect(() => {
    void canUseBiometrics().then(setCanBio);
  }, []);

  if (!session) return null;
  const devices = passkeys.data?.ok ? passkeys.data.passkeys : [];

  const chooseMethod = async (method: "pin" | "passkey" | "password") => {
    const res = await setUnlockMethodFn({ data: { method } });
    if (!res.ok) {
      setNote({
        kind: "error",
        text:
          res.reason === "needs_pin"
            ? t.account.needsCode
            : res.reason === "needs_passkey"
              ? t.account.needsDevice
              : t.account.error,
      });
      return;
    }
    setNote(null);
    await refresh();
  };

  const saveCode = async (e: FormEvent) => {
    e.preventDefault();
    if (pinProblem(code)) return setNote({ kind: "error", text: t.setup.tooSimple });
    const res = await setPinFn({ data: { pin: code } });
    if (!res.ok) return setNote({ kind: "error", text: t.account.error });
    setCode("");
    setEditingCode(false);
    setNote({ kind: "ok", text: t.account.codeSaved });
    await refresh();
  };

  const addDevice = async () => {
    const ok = await registerThisDevice();
    setNote(
      ok
        ? { kind: "ok", text: t.account.deviceAdded }
        : { kind: "error", text: t.biometricsFailed },
    );
    await passkeys.refetch();
    await refresh();
  };

  const removeDevice = async (id: string) => {
    await deletePasskeyFn({ data: { id } });
    await passkeys.refetch();
    await refresh();
  };

  const methods: { id: "pin" | "passkey" | "password"; label: string }[] = [
    { id: "pin", label: t.account.methods.pin },
    { id: "passkey", label: t.account.methods.passkey[bio] },
    { id: "password", label: t.account.methods.password },
  ];

  return (
    <Section icon={<Lock className="h-4 w-4" />} title={t.account.security}>
      <p className="mb-5 text-sm leading-relaxed text-studio-muted">{t.account.securityText}</p>

      <fieldset>
        <legend className="mb-2 text-[10px] uppercase tracking-[0.3em] text-studio-muted">
          {t.account.method}
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {methods.map((m) => (
            <label
              key={m.id}
              className={`cursor-pointer rounded-md border px-3 py-2.5 text-sm ${
                session.unlockMethod === m.id ? "border-accent bg-accent/10" : "border-white/15"
              }`}
            >
              <input
                type="radio"
                name="unlock-method"
                className="sr-only"
                checked={session.unlockMethod === m.id}
                onChange={() => void chooseMethod(m.id)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        {editingCode ? (
          <form onSubmit={saveCode} className="flex flex-wrap items-end gap-3" noValidate>
            <label className="space-y-1.5">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-studio-muted">
                {t.account.newCode}
              </span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                pattern="\d*"
                maxLength={PIN_LENGTH}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className={`${inputClass} w-40 tracking-[0.5em]`}
              />
            </label>
            <button
              type="submit"
              disabled={code.length !== PIN_LENGTH}
              className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-ink disabled:opacity-50"
            >
              {t.account.save}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setEditingCode(true)}
            className="text-xs uppercase tracking-[0.2em] text-accent hover:underline"
          >
            {session.hasPin ? t.account.changeCode : t.account.createCode}
          </button>
        )}
      </div>

      <h3 className="mb-2 mt-6 text-[10px] uppercase tracking-[0.3em] text-studio-muted">
        {t.account.devices}
      </h3>
      {devices.length === 0 ? (
        <p className="text-sm text-studio-muted">{t.account.noDevices}</p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-2.5 text-sm">
              <BioIcon className="h-4 w-4 text-studio-muted" aria-hidden />
              <span className="flex-1">
                {d.deviceName ?? "—"}
                <span className="block text-xs text-studio-muted">
                  {t.account.lastUsed}:{" "}
                  {d.lastUsedAt ? new Date(d.lastUsedAt).toLocaleDateString() : t.account.never}
                </span>
              </span>
              <button
                type="button"
                onClick={() => void removeDevice(d.id)}
                aria-label={`${t.account.remove}: ${d.deviceName ?? ""}`}
                className="rounded p-1.5 text-studio-muted hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {canBio ? (
        <button
          type="button"
          onClick={() => void addDevice()}
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs hover:border-accent"
        >
          <BioIcon className="h-4 w-4" aria-hidden />
          {t.account.addThisDevice[bio]}
        </button>
      ) : (
        <p className="mt-3 text-xs text-studio-muted">{t.account.notSupported}</p>
      )}
      {note && <Note {...note} />}
    </Section>
  );
}
