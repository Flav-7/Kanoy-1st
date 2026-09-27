import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, CalendarDays, Lock, Plus, Users, X } from "lucide-react";
import { AccountMenu, LoginDialog } from "@/components/kanoy/AccountMenu";
import { NotificationsButton } from "@/components/team/NotificationsButton";
import { TEAM_COPY } from "@/components/team/team-i18n";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  VIEWS,
  shiftAnchor,
  todayIn,
  viewDays,
  viewFetchRange,
  viewerTimeZone,
  type PlainDate,
  type View,
} from "@/lib/calendar/dates";
import { applyFilters, NO_FILTERS, type CalendarFilters as Filters } from "@/lib/calendar/filters";
import { newEventForm } from "@/lib/calendar/form";
import { occurrencesByDay } from "@/lib/calendar/grouping";
import { canEditEvents } from "@/lib/calendar/permissions";
import type { CalendarEvent, Occurrence } from "@/lib/calendar/types";
import { AgendaView, EmptyState } from "./AgendaView";
import { CALENDAR_COPY, DATE_LOCALES } from "./calendar-i18n";
import { CalendarUiContext, type CalendarUi, type CreateRequest } from "./CalendarContext";
import { CalendarFilters } from "./CalendarFilters";
import { CalendarToolbar } from "./CalendarToolbar";
import { EventRow } from "./EventCard";
import { EventDrawer } from "./EventDrawer";
import { EventFormDialog, type FormRequest } from "./EventFormDialog";
import { MonthView } from "./MonthView";
import { TimeGridView } from "./TimeGridView";
import { useCalendarBootstrap, useOccurrences } from "./useCalendarData";

const MOBILE_QUERY = "(max-width: 767px)";
const MOBILE_VIEWS: View[] = ["agenda", "day", "month"];

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

function useCopy() {
  const { language } = useLanguage();
  return { copy: CALENDAR_COPY[language], locale: DATE_LOCALES[language], language };
}

/** /calendario: team-only. Logged-out visitors get a sign-in prompt, never data. */
export function CalendarPage() {
  const { user, ready } = useAuth();
  const { copy } = useCopy();

  if (!ready) {
    return (
      <Shell>
        <div
          className="flex flex-1 items-center justify-center text-sm text-studio-muted"
          role="status"
        >
          {copy.loading}
        </div>
      </Shell>
    );
  }
  if (!user) return <SignInPrompt />;
  return <CalendarWorkspace />;
}

function Shell({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  const { copy } = useCopy();
  return (
    <div className="flex h-dvh flex-col bg-studio text-studio-foreground">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:px-6">
        <Link
          to="/"
          aria-label={copy.backToSite}
          className="flex items-center gap-2 rounded text-xs uppercase tracking-[0.2em] text-studio-muted transition-colors hover:text-studio-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{copy.backToSite}</span>
        </Link>
        <h1 className="flex min-w-0 flex-1 items-center gap-2 font-display text-base tracking-[-0.01em] md:text-lg">
          <CalendarDays className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span className="truncate">{copy.title}</span>
        </h1>
        {actions}
        <AccountMenu />
      </header>
      {children}
    </div>
  );
}

function SignInPrompt() {
  const { copy } = useCopy();
  const [open, setOpen] = useState(false);
  return (
    <Shell>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Lock className="h-8 w-8 text-accent" aria-hidden />
        <h2 className="font-display text-2xl tracking-[-0.02em]">{copy.signInTitle}</h2>
        <p className="max-w-sm text-sm text-studio-muted">{copy.signInText}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-kanoy mt-4 bg-accent text-ink"
        >
          {copy.signIn}
        </button>
        <LoginDialog open={open} onOpenChange={setOpen} />
      </div>
    </Shell>
  );
}

function CalendarWorkspace() {
  const { copy, locale, language } = useCopy();
  const tz = useMemo(() => viewerTimeZone(), []);
  const today = todayIn(tz);
  const isMobile = useIsMobile();

  const [chosenView, setChosenView] = useState<View | null>(null);
  const view: View =
    chosenView === null
      ? isMobile
        ? "agenda"
        : "month"
      : isMobile && chosenView === "week"
        ? "day"
        : chosenView;
  const [anchor, setAnchor] = useState<PlainDate>(today);
  const [selectedDay, setSelectedDay] = useState<PlainDate>(today);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Occurrence | null>(null);
  const [formRequest, setFormRequest] = useState<FormRequest | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const bootstrap = useCalendarBootstrap();
  const range = useMemo(() => viewFetchRange(view, anchor, tz), [view, anchor, tz]);
  const events = useOccurrences(range);

  const boot = bootstrap.data?.ok ? bootstrap.data : null;
  const calendars = useMemo(() => boot?.calendars ?? [], [boot]);
  const team = useMemo(() => boot?.team ?? [], [boot]);
  const calendarsById = useMemo(() => new Map(calendars.map((c) => [c.id, c])), [calendars]);
  const teamById = useMemo(() => new Map(team.map((p) => [p.id, p])), [team]);
  const editableCalendars = useMemo(
    () => calendars.filter((c) => canEditEvents(c.role)),
    [calendars],
  );

  const all = useMemo(() => (events.data?.ok ? events.data.occurrences : []), [events.data]);
  const visible = useMemo(() => applyFilters(all, filters), [all, filters]);
  const days = useMemo(() => viewDays(view, anchor), [view, anchor]);

  // Keep the open drawer in sync with refetched data (someone else may have edited it).
  const liveSelected = useMemo(
    () => (selected ? (all.find((o) => o.key === selected.key) ?? selected) : null),
    [all, selected],
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const openCreate = useCallback(
    (req: CreateRequest) => {
      const preferred =
        editableCalendars.find(
          (c) => filters.calendars === null || filters.calendars.includes(c.id),
        ) ?? editableCalendars[0];
      if (!preferred) return;
      setFormRequest({
        kind: "create",
        form: newEventForm({
          calendarId: preferred.id,
          timezone: tz,
          date: req.date,
          ...(req.startMinutes !== undefined ? { startMinutes: req.startMinutes } : {}),
          ...(req.allDay !== undefined ? { allDay: req.allDay } : {}),
        }),
      });
    },
    [editableCalendars, filters.calendars, tz],
  );

  const ui: CalendarUi = useMemo(
    () => ({
      copy,
      locale,
      tz,
      today,
      calendarsById,
      teamById,
      canCreate: editableCalendars.length > 0,
      openEvent: setSelected,
      openCreate,
      showDay: (date) => {
        setAnchor(date);
        setSelectedDay(date);
        setChosenView("day");
      },
    }),
    [copy, locale, tz, today, calendarsById, teamById, editableCalendars.length, openCreate],
  );

  const editEvent = (event: CalendarEvent) => {
    setSelected(null);
    setFormRequest({ kind: "edit", event });
  };

  const unauthenticated =
    (bootstrap.data && !bootstrap.data.ok) || (events.data && !events.data.ok);
  const firstLoad = bootstrap.isPending || (events.isPending && !events.data);
  const failed = bootstrap.isError || events.isError;

  let body: ReactNode;
  if (unauthenticated) {
    return <SignInPrompt />;
  } else if (failed) {
    body = (
      <div
        className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
        role="alert"
      >
        <p className="text-sm">{copy.loadError}</p>
        <button
          type="button"
          onClick={() => {
            void bootstrap.refetch();
            void events.refetch();
          }}
          className="btn-kanoy bg-accent text-ink"
        >
          {copy.retry}
        </button>
      </div>
    );
  } else if (firstLoad) {
    body = <Skeleton view={view} />;
  } else if (calendars.length === 0) {
    body = <p className="px-6 py-16 text-center text-sm text-studio-muted">{copy.noCalendars}</p>;
  } else if (view === "month") {
    body = isMobile ? (
      <div className="no-scrollbar flex h-full flex-col overflow-y-auto">
        <div className="shrink-0">
          <MonthView
            days={days}
            anchor={anchor}
            occurrences={visible}
            compact
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        </div>
        <SelectedDayList day={selectedDay} occurrences={visible} tz={tz} />
      </div>
    ) : (
      <MonthView
        days={days}
        anchor={anchor}
        occurrences={visible}
        compact={false}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
      />
    );
  } else if (view === "agenda") {
    body = <AgendaView days={days} occurrences={visible} />;
  } else {
    body = <TimeGridView days={days} occurrences={visible} />;
  }

  const filtersActive =
    filters.calendars !== null || filters.people !== null || filters.categories !== null;

  return (
    <CalendarUiContext.Provider value={ui}>
      <Shell
        actions={
          <>
            {boot?.canManageTeam && (
              <Link
                to="/equipa"
                aria-label={TEAM_COPY[language].teamLink}
                title={TEAM_COPY[language].teamLink}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 text-studio-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Users className="h-4 w-4" />
              </Link>
            )}
            <NotificationsButton />
            {editableCalendars.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  openCreate({ date: view === "month" && isMobile ? selectedDay : anchor })
                }
                className="btn-kanoy inline-flex items-center gap-2 bg-accent text-ink"
                style={{ padding: "10px 14px" }}
                aria-label={copy.newEvent}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">{copy.newEvent}</span>
              </button>
            )}
          </>
        }
      >
        <div className="flex min-h-0 flex-1">
          <aside
            aria-label={copy.filters}
            className="no-scrollbar hidden w-64 shrink-0 overflow-y-auto border-r border-white/10 lg:block"
          >
            <CalendarFilters
              filters={filters}
              onChange={setFilters}
              calendars={calendars}
              team={team}
            />
          </aside>
          <main className="flex min-w-0 flex-1 flex-col">
            <CalendarToolbar
              view={view}
              views={isMobile ? MOBILE_VIEWS : VIEWS}
              anchor={anchor}
              loading={events.isFetching && !firstLoad}
              onView={(v) => {
                setChosenView(v);
                if (v === "month") setSelectedDay(anchor);
              }}
              onToday={() => {
                setAnchor(today);
                setSelectedDay(today);
              }}
              onShift={(dir) => setAnchor((a) => shiftAnchor(view, a, dir))}
              onToggleFilters={() => setFiltersOpen(true)}
              filtersActive={filtersActive}
            />
            <div className="relative min-h-0 flex-1">{body}</div>
          </main>
        </div>
      </Shell>

      <DialogPrimitive.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 lg:hidden" />
          <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-ink text-studio-foreground lg:hidden">
            <div className="flex items-center justify-between px-5 pt-4">
              <DialogPrimitive.Title className="font-display text-lg">
                {copy.filters}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label={copy.details.close}
                className="rounded p-1 text-studio-muted"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description className="sr-only">
              {copy.filters}
            </DialogPrimitive.Description>
            <CalendarFilters
              filters={filters}
              onChange={setFilters}
              calendars={calendars}
              team={team}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <EventDrawer
        occurrence={liveSelected}
        onClose={() => setSelected(null)}
        onEdit={editEvent}
        notify={setToast}
      />
      <EventFormDialog
        request={formRequest}
        onClose={() => setFormRequest(null)}
        notify={setToast}
      />

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-white/10 bg-ink px-4 py-2 text-sm text-studio-foreground shadow-xl transition-opacity ${
          toast ? "opacity-100" : "opacity-0"
        }`}
      >
        {toast}
      </div>
    </CalendarUiContext.Provider>
  );
}

function SelectedDayList({
  day,
  occurrences,
  tz,
}: {
  day: PlainDate;
  occurrences: Occurrence[];
  tz: string;
}) {
  const list = useMemo(
    () => occurrencesByDay(occurrences, [day], tz).get(day) ?? [],
    [occurrences, day, tz],
  );
  if (list.length === 0) return <EmptyState />;
  return (
    <ul className="px-2 py-3">
      {list.map((o) => (
        <li key={o.key}>
          <EventRow occ={o} />
        </li>
      ))}
    </ul>
  );
}

function Skeleton({ view }: { view: View }) {
  const { copy } = useCopy();
  return (
    <div role="status" aria-label={copy.loading} className="h-full animate-pulse p-4">
      {view === "agenda" ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-14 rounded-lg bg-white/[0.05]" />
          ))}
        </div>
      ) : (
        <div className="grid h-full grid-cols-7 gap-px">
          {Array.from({ length: view === "month" ? 42 : 7 }, (_, i) => (
            <div key={i} className="rounded bg-white/[0.04]" />
          ))}
        </div>
      )}
    </div>
  );
}
