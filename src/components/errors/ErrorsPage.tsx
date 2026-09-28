import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { enGB, es, pt } from "date-fns/locale";
import {
  ArrowLeft,
  Bug,
  Check,
  ChevronDown,
  Globe,
  Lock,
  RotateCcw,
  Server,
  Trash2,
} from "lucide-react";
import { AccountMenu, LoginDialog } from "@/components/kanoy/AccountMenu";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Language } from "@/lib/i18n/translations";
import { deleteErrorsFn, listErrorsFn, setErrorResolvedFn } from "@/lib/errors/errors.functions";
import type { ErrorReport } from "@/server/errors";

const COPY = {
  pt: {
    title: "Erros",
    back: "Calendário",
    intro:
      "Erros que aconteceram no site — no browser de quem o visita ou no servidor. Cada erro aparece uma vez, com quantas vezes aconteceu. Marque como resolvido depois de corrigido: se voltar a acontecer, reaparece aqui.",
    open: "Por resolver",
    resolved: "Resolvidos",
    none: "Nenhum erro por resolver. Está tudo a funcionar. 🎉",
    noneResolved: "Nenhum erro resolvido.",
    browser: "Site",
    server: "Servidor",
    times: (n: number) => `${n}×`,
    last: "Última vez",
    first: "Primeira vez",
    page: "Página",
    who: "Quem",
    device: "Dispositivo",
    details: "Detalhes técnicos",
    markResolved: "Resolvido",
    reopen: "Reabrir",
    remove: "Apagar",
    clearResolved: "Apagar todos os resolvidos",
    forbidden: "Não tem acesso a esta página.",
    failed: "Não foi possível carregar os erros.",
    signIn: "Entrar",
  },
  es: {
    title: "Errores",
    back: "Calendario",
    intro:
      "Errores que han ocurrido en el sitio — en el navegador de quien lo visita o en el servidor. Cada error aparece una vez, con cuántas veces ha ocurrido. Márcalo como resuelto tras corregirlo: si vuelve a ocurrir, reaparece aquí.",
    open: "Por resolver",
    resolved: "Resueltos",
    none: "Ningún error por resolver. Todo funciona. 🎉",
    noneResolved: "Ningún error resuelto.",
    browser: "Sitio",
    server: "Servidor",
    times: (n: number) => `${n}×`,
    last: "Última vez",
    first: "Primera vez",
    page: "Página",
    who: "Quién",
    device: "Dispositivo",
    details: "Detalles técnicos",
    markResolved: "Resuelto",
    reopen: "Reabrir",
    remove: "Borrar",
    clearResolved: "Borrar todos los resueltos",
    forbidden: "No tienes acceso a esta página.",
    failed: "No se han podido cargar los errores.",
    signIn: "Entrar",
  },
  en: {
    title: "Errors",
    back: "Calendar",
    intro:
      "Errors that happened on the site — in a visitor's browser or on the server. Each error is listed once, with how many times it happened. Mark it resolved once fixed: if it happens again, it comes back here.",
    open: "Open",
    resolved: "Resolved",
    none: "No open errors. Everything is working. 🎉",
    noneResolved: "No resolved errors.",
    browser: "Site",
    server: "Server",
    times: (n: number) => `${n}×`,
    last: "Last seen",
    first: "First seen",
    page: "Page",
    who: "Who",
    device: "Device",
    details: "Technical details",
    markResolved: "Resolved",
    reopen: "Reopen",
    remove: "Delete",
    clearResolved: "Delete all resolved",
    forbidden: "You don't have access to this page.",
    failed: "The errors couldn't be loaded.",
    signIn: "Sign in",
  },
} satisfies Record<Language, Record<string, unknown>>;

type Copy = (typeof COPY)["pt"];
const LOCALES = { pt, es, en: enGB };

/** A readable device from the user agent ("iPhone · Safari", "Windows · Chrome"). */
function deviceOf(ua: string | null): string {
  if (!ua) return "—";
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Mac OS X/.test(ua)
          ? "Mac"
          : /Windows/.test(ua)
            ? "Windows"
            : /Linux/.test(ua)
              ? "Linux"
              : "?";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /CriOS|Chrome\//.test(ua)
      ? "Chrome"
      : /FxiOS|Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : /bot|crawler|spider/i.test(ua)
            ? "Bot"
            : "";
  return browser ? `${os} · ${browser}` : os;
}

/** /erros: the site's error log, for the people allowed to see it. */
export function ErrorsPage() {
  const { user, ready } = useAuth();
  const { language } = useLanguage();
  const t = COPY[language];
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-studio text-studio-foreground">
      <header className="app-topbar flex items-center gap-3 border-b border-white/10 px-4 py-3 md:px-6">
        <Link
          to="/calendario"
          aria-label={t.back}
          className="flex items-center gap-2 rounded text-xs uppercase tracking-[0.2em] text-studio-muted hover:text-studio-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t.back}</span>
        </Link>
        <h1 className="flex min-w-0 flex-1 items-center gap-2 font-display text-base md:text-lg">
          <Bug className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span className="truncate">{t.title}</span>
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
            {t.signIn}
          </button>
          <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
        </div>
      ) : (
        <ErrorLog t={t} language={language} />
      )}
    </div>
  );
}

function ErrorLog({ t, language }: { t: Copy; language: Language }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const log = useQuery({
    queryKey: ["errors"],
    queryFn: () => listErrorsFn(),
    refetchInterval: 60_000,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["errors"] });

  if (log.isPending) return <p className="px-6 py-16 text-center text-sm text-studio-muted">…</p>;
  if (log.isError || !log.data.ok) {
    return (
      <p role="alert" className="px-6 py-16 text-center text-sm">
        {log.data && !log.data.ok ? t.forbidden : t.failed}
      </p>
    );
  }

  const all = log.data.errors;
  const open = all.filter((e) => !e.resolved);
  const resolved = all.filter((e) => e.resolved);
  const shown = tab === "open" ? open : resolved;

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm transition-colors ${
      active ? "bg-accent text-ink" : "text-studio-muted hover:text-studio-foreground"
    }`;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
      <p className="text-sm leading-relaxed text-studio-muted">{t.intro}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-white/10 p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "open"}
            onClick={() => setTab("open")}
            className={tabClass(tab === "open")}
          >
            {t.open} ({open.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "resolved"}
            onClick={() => setTab("resolved")}
            className={tabClass(tab === "resolved")}
          >
            {t.resolved} ({resolved.length})
          </button>
        </div>
        {tab === "resolved" && resolved.length > 0 && (
          <button
            type="button"
            onClick={() => void deleteErrorsFn({ data: { id: null } }).then(refresh)}
            className="text-xs text-studio-muted underline hover:text-[#ff8a8a]"
          >
            {t.clearResolved}
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-white/10 px-4 py-10 text-center text-sm text-studio-muted">
          {tab === "open" ? t.none : t.noneResolved}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((e) => (
            <ErrorCard key={e.id} report={e} t={t} language={language} onChange={refresh} />
          ))}
        </ul>
      )}
    </main>
  );
}

function ErrorCard({
  report: e,
  t,
  language,
  onChange,
}: {
  report: ErrorReport;
  t: Copy;
  language: Language;
  onChange: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const ago = (iso: string) =>
    formatDistanceToNow(new Date(iso), { addSuffix: true, locale: LOCALES[language] });
  const SourceIcon = e.source === "server" ? Server : Globe;

  const act = async (run: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await run();
      await onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
            e.source === "server" ? "bg-[#f87171]/15 text-[#f87171]" : "bg-accent/15 text-accent"
          }`}
        >
          <SourceIcon className="h-3 w-3" aria-hidden />
          {e.source === "server" ? t.server : t.browser}
        </span>
        <p className="min-w-0 flex-1 break-words font-mono text-sm leading-snug">{e.message}</p>
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums">
          {t.times(e.count)}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-studio-muted">{t.last}</dt>
        <dd title={new Date(e.lastSeen).toLocaleString()}>{ago(e.lastSeen)}</dd>
        {e.count > 1 && (
          <>
            <dt className="text-studio-muted">{t.first}</dt>
            <dd title={new Date(e.firstSeen).toLocaleString()}>{ago(e.firstSeen)}</dd>
          </>
        )}
        {e.url && (
          <>
            <dt className="text-studio-muted">{t.page}</dt>
            <dd className="break-all font-mono">{e.url}</dd>
          </>
        )}
        {e.lastUser && (
          <>
            <dt className="text-studio-muted">{t.who}</dt>
            <dd>{e.lastUser}</dd>
          </>
        )}
        <dt className="text-studio-muted">{t.device}</dt>
        <dd>{deviceOf(e.userAgent)}</dd>
      </dl>

      {e.detail && (
        <details className="group mt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-studio-muted hover:text-studio-foreground">
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            {t.details}
          </summary>
          <pre className="no-scrollbar mt-2 max-h-72 overflow-auto rounded-md bg-black/40 p-3 text-[11px] leading-relaxed text-studio-muted">
            {e.detail}
          </pre>
        </details>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void act(() => setErrorResolvedFn({ data: { id: e.id, resolved: !e.resolved } }))
          }
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-ink disabled:opacity-50"
        >
          {e.resolved ? (
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Check className="h-3.5 w-3.5" aria-hidden />
          )}
          {e.resolved ? t.reopen : t.markResolved}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void act(() => deleteErrorsFn({ data: { id: e.id } }))}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-studio-muted hover:text-[#ff8a8a] disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          {t.remove}
        </button>
      </div>
    </li>
  );
}
