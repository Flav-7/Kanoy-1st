import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, Lock, Pencil, Plus, Share2, Trash2, Users } from "lucide-react";
import { AccountMenu, LoginDialog } from "@/components/kanoy/AccountMenu";
import { CALENDAR_SWATCHES, swatch } from "@/components/calendar/calendar-colors";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CALENDAR_COLORS, ROLES, type CalendarColor, type Role } from "@/lib/calendar/types";
import {
  addMemberFn,
  createAreaFn,
  getTeam,
  reissueInviteFn,
  removeMemberFn,
  updateAreaFn,
  type TeamActionResult,
} from "@/lib/team/team.functions";
import type { AreaMember, ManagedArea } from "@/server/team";
import { TEAM_COPY } from "./team-i18n";

type Copy = (typeof TEAM_COPY)["pt"];

const inputClass =
  "w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-studio-foreground placeholder:text-studio-muted/60 focus:border-accent focus:outline-none";

function useCopy(): Copy {
  const { language } = useLanguage();
  return TEAM_COPY[language];
}

function errorText(
  t: Copy,
  result: { ok: true } | { ok: false; error: keyof Copy["errors"] },
): string | null {
  return result.ok ? null : t.errors[result.error];
}

/** /equipa: areas the signed-in person administers, their people and invites. */
export function TeamPage() {
  const { user, ready } = useAuth();
  const t = useCopy();
  const { dict } = useLanguage();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-studio text-studio-foreground">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:px-6">
        <Link
          to="/calendario"
          aria-label={t.backToCalendar}
          className="flex items-center gap-2 rounded text-xs uppercase tracking-[0.2em] text-studio-muted hover:text-studio-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t.backToCalendar}</span>
        </Link>
        <h1 className="flex min-w-0 flex-1 items-center gap-2 font-display text-base md:text-lg">
          <Users className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span className="truncate">{t.teamLink}</span>
        </h1>
        <AccountMenu />
      </header>

      {!ready ? null : !user ? (
        <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
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
        <TeamManager />
      )}
    </div>
  );
}

function TeamManager() {
  const t = useCopy();
  const team = useQuery({ queryKey: ["team"], queryFn: () => getTeam() });

  if (team.isPending) return <p className="px-6 py-16 text-center text-sm text-studio-muted">…</p>;
  if (team.isError || !team.data.ok) {
    return (
      <p role="alert" className="px-6 py-16 text-center text-sm">
        {team.data && !team.data.ok ? t.errors.UNAUTHENTICATED : t.errors.UNKNOWN}
      </p>
    );
  }

  const { areas, canManage } = team.data.value;
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-6">
      <p className="text-sm leading-relaxed text-studio-muted">{t.intro}</p>
      {canManage && <NewArea />}
      {areas.length === 0 ? (
        <p className="text-sm text-studio-muted">{t.noAreas}</p>
      ) : (
        areas.map((area) => <AreaCard key={area.id} area={area} />)
      )}
    </main>
  );
}

function useRefresh() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["team"] });
    await queryClient.invalidateQueries({ queryKey: ["calendar"] });
  };
}

async function run<T>(
  call: () => Promise<TeamActionResult<T>>,
): Promise<TeamActionResult<T> | { ok: false; error: "UNKNOWN" }> {
  try {
    return await call();
  } catch (err) {
    console.error(err);
    return { ok: false, error: "UNKNOWN" };
  }
}

function ColorPicker({
  value,
  onChange,
}: {
  value: CalendarColor;
  onChange: (c: CalendarColor) => void;
}) {
  const t = useCopy();
  return (
    <div role="radiogroup" aria-label={t.color} className="flex gap-2">
      {CALENDAR_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className={`flex h-7 w-7 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            value === c ? "ring-2 ring-white ring-offset-2 ring-offset-ink" : ""
          }`}
          style={{ background: CALENDAR_SWATCHES[c] }}
        >
          {value === c && <Check className="h-3.5 w-3.5 text-ink" strokeWidth={3} />}
        </button>
      ))}
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-ink p-5 md:p-6">{children}</section>
  );
}

function NewArea() {
  const t = useCopy();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<CalendarColor>("violet");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-kanoy inline-flex items-center gap-2 bg-accent text-ink"
        style={{ padding: "10px 16px" }}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        {t.newArea}
      </button>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    const res = await run(() => createAreaFn({ data: { name, color } }));
    setPending(false);
    if (!res.ok) return setError(errorText(t, res));
    setName("");
    setOpen(false);
    setError(null);
    await refresh();
  };

  return (
    <Panel>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <h2 className="font-display text-lg">{t.newArea}</h2>
        <label className="block space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">
            {t.areaName}
          </span>
          <input
            maxLength={80}
            value={name}
            placeholder={t.areaNamePlaceholder}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
        <ColorPicker value={color} onChange={setColor} />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-ink disabled:opacity-60"
          >
            {t.create}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs uppercase tracking-[0.2em] text-studio-muted"
          >
            {t.cancel}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function AreaCard({ area }: { area: ManagedArea }) {
  const t = useCopy();
  const refresh = useRefresh();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(area.name);
  const [color, setColor] = useState<CalendarColor>(area.color);
  const [error, setError] = useState<string | null>(null);

  const saveArea = async (e: FormEvent) => {
    e.preventDefault();
    const res = await run(() => updateAreaFn({ data: { calendarId: area.id, name, color } }));
    if (!res.ok) return setError(errorText(t, res));
    setEditing(false);
    setError(null);
    await refresh();
  };

  return (
    <Panel>
      {editing ? (
        <form onSubmit={saveArea} className="space-y-4" noValidate>
          <input
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            aria-label={t.areaName}
          />
          <ColorPicker value={color} onChange={setColor} />
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-ink"
            >
              {t.save}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs uppercase tracking-[0.2em] text-studio-muted"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-3 w-3 rounded-full"
            style={{ background: swatch(area.color) }}
          />
          <h2 className="flex-1 font-display text-xl tracking-[-0.01em]">{area.name}</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`${t.edit}: ${area.name}`}
            className="rounded p-1.5 text-studio-muted hover:text-studio-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <h3 className="mb-2 mt-6 text-[10px] uppercase tracking-[0.3em] text-studio-muted">
        {t.members}
      </h3>
      <ul className="divide-y divide-white/[0.06]">
        {area.members.map((m) => (
          <MemberRow key={m.userId} area={area} member={m} />
        ))}
      </ul>

      <AddPerson area={area} />
    </Panel>
  );
}

function InviteLink({ url }: { url: string }) {
  const t = useCopy();
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  return (
    <div className="mt-3 rounded-md border border-accent/40 bg-accent/10 p-3 text-sm">
      <p className="text-xs text-studio-muted">{t.inviteReady}</p>
      <p className="mt-2 break-all font-mono text-xs">{url}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(url).then(() => setCopied(true));
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t.copied : t.copyInvite}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={() => void navigator.share({ url, title: "KANOY" }).catch(() => {})}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            {t.share}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-studio-muted">{t.inviteHelp}</p>
    </div>
  );
}

function MemberRow({ area, member }: { area: ManagedArea; member: AreaMember }) {
  const t = useCopy();
  const refresh = useRefresh();
  const [confirming, setConfirming] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const changeRole = async (role: Role) => {
    const res = await run(() =>
      addMemberFn({ data: { calendarId: area.id, email: member.email, role } }),
    );
    if (!res.ok) return setError(errorText(t, res));
    setError(null);
    await refresh();
  };

  const remove = async () => {
    const res = await run(() =>
      removeMemberFn({ data: { calendarId: area.id, userId: member.userId } }),
    );
    setConfirming(false);
    if (!res.ok) return setError(errorText(t, res));
    await refresh();
  };

  const reissue = async () => {
    const res = await run(() =>
      reissueInviteFn({ data: { calendarId: area.id, userId: member.userId } }),
    );
    if (!res.ok) return setError(errorText(t, res));
    setInvite(res.value.inviteUrl);
  };

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold uppercase">
          {member.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">
            {member.name}
            {member.jobTitle && <span className="text-studio-muted"> · {member.jobTitle}</span>}
          </p>
          <p className="truncate text-xs text-studio-muted">
            {member.email}
            {!member.active && <span className="ml-2 text-amber-300">{t.pending}</span>}
          </p>
        </div>
        <select
          value={member.role}
          onChange={(e) => void changeRole(e.target.value as Role)}
          aria-label={`${t.role}: ${member.name}`}
          title={t.roleHelp[member.role]}
          className="rounded-md border border-white/15 bg-ink px-2 py-1.5 text-xs [color-scheme:dark]"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t.roles[r]}
            </option>
          ))}
        </select>
        {!member.active && (
          <button
            type="button"
            onClick={reissue}
            aria-label={t.copyInvite}
            title={t.copyInvite}
            className="rounded p-1.5 text-studio-muted hover:text-accent"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
        {confirming ? (
          <span className="flex items-center gap-2 text-xs">
            {t.confirmRemove}
            <button
              type="button"
              onClick={remove}
              className="rounded bg-destructive px-2 py-1 text-white"
            >
              {t.remove}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-studio-muted"
            >
              {t.cancel}
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`${t.remove}: ${member.name}`}
            className="rounded p-1.5 text-studio-muted hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {invite && <InviteLink url={invite} />}
    </li>
  );
}

function AddPerson({ area }: { area: ManagedArea }) {
  const t = useCopy();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    const res = await run(() =>
      addMemberFn({ data: { calendarId: area.id, email, name: name || undefined, role } }),
    );
    setPending(false);
    if (!res.ok) return setError(errorText(t, res));
    setError(null);
    setInvite(res.value.inviteUrl);
    setEmail("");
    setName("");
    if (!res.value.inviteUrl) setOpen(false);
    await refresh();
  };

  if (!open) {
    return (
      <>
        {invite && <InviteLink url={invite} />}
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setInvite(null);
          }}
          className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent hover:underline"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t.addPerson}
        </button>
      </>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 space-y-3 rounded-lg border border-white/10 p-4"
      noValidate
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">
            {t.email}
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">
            {t.name} <span className="normal-case tracking-normal">({t.nameHint})</span>
          </span>
          <input
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-[10px] uppercase tracking-[0.3em] text-studio-muted">
          {t.role}
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {ROLES.map((r) => (
            <label
              key={r}
              className={`cursor-pointer rounded-md border p-2.5 text-xs ${role === r ? "border-accent bg-accent/10" : "border-white/15"}`}
            >
              <input
                type="radio"
                name={`role-${area.id}`}
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="sr-only"
              />
              <span className="block font-medium">{t.roles[r]}</span>
              <span className="mt-1 block text-studio-muted">{t.roleHelp[r]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {invite && <InviteLink url={invite} />}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-ink disabled:opacity-60"
        >
          {t.add}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs uppercase tracking-[0.2em] text-studio-muted"
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
