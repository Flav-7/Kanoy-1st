import { useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Ban,
  CalendarDays,
  Clock,
  Globe,
  Pencil,
  Repeat,
  RotateCcw,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { addDays, formatPlainDate, instantToPlainDate } from "@/lib/calendar/dates";
import { eventToInput } from "@/lib/calendar/form";
import { canEditEvents } from "@/lib/calendar/permissions";
import { displayName, type CalendarEvent, type Occurrence } from "@/lib/calendar/types";
import { CATEGORY_ICONS, eventSwatch } from "./calendar-colors";
import { useCalendarUi, type CalendarUi } from "./CalendarContext";
import { formatTime } from "./EventCard";
import { useEventActions, type ActionResult } from "./useCalendarData";

function whenLines(occ: Occurrence, ui: CalendarUi): string[] {
  const { event } = occ;
  if (event.allDay) {
    const first = instantToPlainDate(occ.start, event.timezone);
    const last = addDays(instantToPlainDate(occ.end, event.timezone), -1);
    const fmt = (d: string) => formatPlainDate(d, "PPPP", ui.locale);
    return first === last ? [fmt(first), ui.copy.allDay] : [`${fmt(first)} →`, fmt(last)];
  }
  const startDay = instantToPlainDate(occ.start, ui.tz);
  const endDay = instantToPlainDate(new Date(Date.parse(occ.end) - 1), ui.tz);
  const fmt = (d: string) => formatPlainDate(d, "PPPP", ui.locale);
  const start = formatTime(occ.start, ui.tz);
  const end = formatTime(occ.end, ui.tz);
  return startDay === endDay
    ? [fmt(startDay), `${start} → ${end}`]
    : [`${fmt(startDay)}, ${start} →`, `${fmt(endDay)}, ${end}`];
}

function recurrenceLine(event: CalendarEvent, ui: CalendarUi): string | null {
  const r = event.recurrence;
  if (!r) return null;
  const freq = ui.copy.form.frequencies[r.freq];
  const every = r.interval > 1 ? ` (${ui.copy.form.every} ${r.interval})` : "";
  const until = r.until
    ? ` · ${ui.copy.form.until} ${formatPlainDate(r.until, "d MMM yyyy", ui.locale)}`
    : "";
  return `${freq}${every}${until}`;
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-studio-muted" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="sr-only">{label}</p>
        {children}
      </div>
    </div>
  );
}

/**
 * Event details in a side panel (full-screen sheet on phones), so the
 * calendar stays visible behind it. Edit/cancel/delete only appear for
 * editors, and every action still goes through the server's checks.
 */
export function EventDrawer({
  occurrence,
  onClose,
  onEdit,
  notify,
}: {
  occurrence: Occurrence | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  notify: (message: string) => void;
}) {
  const ui = useCalendarUi();
  const actions = useEventActions();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setConfirming(false);
    setError(null);
    setBusy(false);
  };

  const run = async (action: () => Promise<ActionResult>, onOk: () => void) => {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (result.ok) onOk();
    else
      setError(
        result.error === "CONFLICT" ? ui.copy.conflictRefreshed : ui.copy.errors[result.error],
      );
  };

  const event = occurrence?.event;
  const calendar = event ? ui.calendarsById.get(event.calendarId) : undefined;
  const editable = canEditEvents(calendar?.role);
  const CategoryIcon = event?.category ? CATEGORY_ICONS[event.category] : null;

  return (
    <DialogPrimitive.Root
      open={occurrence !== null}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-ink text-studio-foreground shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
          // Full height: clear of the status bar and home indicator in the app.
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {occurrence && event && (
            <>
              <div className="flex items-start gap-3 border-b border-white/10 px-6 pb-5 pt-6">
                <span
                  aria-hidden
                  className="mt-2 h-3 w-3 shrink-0 rounded-full"
                  style={{ background: eventSwatch(event, calendar?.color) }}
                />
                <div className="min-w-0 flex-1">
                  <DialogPrimitive.Title
                    className={`font-display text-2xl leading-tight tracking-[-0.02em] ${
                      event.status === "cancelled" ? "line-through opacity-60" : ""
                    }`}
                  >
                    {event.title}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-1 text-xs uppercase tracking-[0.2em] text-studio-muted">
                    {[
                      calendar?.name,
                      event.status !== "confirmed" ? ui.copy.statusNames[event.status] : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close
                  aria-label={ui.copy.details.close}
                  className="rounded p-1 text-studio-muted hover:text-studio-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              </div>

              <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-6 text-sm">
                <Row icon={<Clock className="h-4 w-4" />} label={ui.copy.form.date}>
                  {whenLines(occurrence, ui).map((line, i) => (
                    <p key={i} className={i === 0 ? "first-letter:uppercase" : "text-studio-muted"}>
                      {line}
                    </p>
                  ))}
                </Row>
                {event.timezone !== ui.tz && (
                  <Row icon={<Globe className="h-4 w-4" />} label={ui.copy.details.timezone}>
                    <p className="text-studio-muted">
                      {ui.copy.details.timezone}: {event.timezone}
                    </p>
                  </Row>
                )}
                {event.recurrence && (
                  <Row icon={<Repeat className="h-4 w-4" />} label={ui.copy.details.repeats}>
                    <p>{recurrenceLine(event, ui)}</p>
                  </Row>
                )}
                {CategoryIcon && event.category && (
                  <Row icon={<CategoryIcon className="h-4 w-4" />} label={ui.copy.form.category}>
                    <p>{ui.copy.categoryNames[event.category]}</p>
                  </Row>
                )}
                <Row icon={<UserRound className="h-4 w-4" />} label={ui.copy.details.participants}>
                  <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-studio-muted">
                    {ui.copy.details.participants}
                  </p>
                  {event.participants.length === 0 ? (
                    <p className="text-studio-muted">{ui.copy.details.noParticipants}</p>
                  ) : (
                    <ul className="space-y-1">
                      {event.participants.map((id) => (
                        <li key={id}>{displayName(ui.teamById.get(id))}</li>
                      ))}
                    </ul>
                  )}
                </Row>
                {event.description && (
                  <Row
                    icon={<CalendarDays className="h-4 w-4" />}
                    label={ui.copy.details.description}
                  >
                    <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-studio-muted">
                      {ui.copy.details.description}
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed text-studio-foreground/90">
                      {event.description}
                    </p>
                  </Row>
                )}
                <p className="text-xs text-studio-muted">
                  {ui.copy.details.createdBy} {displayName(ui.teamById.get(event.createdBy))}
                </p>
              </div>

              <div className="border-t border-white/10 px-6 py-4">
                {error && (
                  <p role="alert" className="mb-3 text-sm text-destructive">
                    {error}
                  </p>
                )}
                {!editable ? (
                  <p className="text-xs text-studio-muted">{ui.copy.details.readOnly}</p>
                ) : confirming ? (
                  <div>
                    <p className="font-medium">{ui.copy.confirmDelete.title}</p>
                    <p className="mt-1 text-xs text-studio-muted">{ui.copy.confirmDelete.text}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {event.recurrence ? (
                        <>
                          <DangerButton
                            disabled={busy}
                            onClick={() =>
                              run(
                                () => actions.remove(event.id, event.version, occurrence.start),
                                () => {
                                  notify(ui.copy.deleted);
                                  onClose();
                                },
                              )
                            }
                          >
                            {ui.copy.confirmDelete.occurrenceOnly}
                          </DangerButton>
                          <DangerButton
                            disabled={busy}
                            onClick={() =>
                              run(
                                () => actions.remove(event.id, event.version, null),
                                () => {
                                  notify(ui.copy.deleted);
                                  onClose();
                                },
                              )
                            }
                          >
                            {ui.copy.confirmDelete.wholeSeries}
                          </DangerButton>
                        </>
                      ) : (
                        <DangerButton
                          disabled={busy}
                          onClick={() =>
                            run(
                              () => actions.remove(event.id, event.version, null),
                              () => {
                                notify(ui.copy.deleted);
                                onClose();
                              },
                            )
                          }
                        >
                          {ui.copy.confirmDelete.confirm}
                        </DangerButton>
                      )}
                      <SecondaryButton onClick={() => setConfirming(false)}>
                        {ui.copy.confirmDelete.cancel}
                      </SecondaryButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(event)}
                      className="btn-kanoy inline-flex items-center gap-2 bg-accent text-ink"
                      style={{ padding: "10px 16px" }}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      {ui.copy.details.edit}
                    </button>
                    <SecondaryButton
                      disabled={busy}
                      onClick={() =>
                        run(
                          () =>
                            actions.update(
                              event.id,
                              event.version,
                              eventToInput(event, {
                                status: event.status === "cancelled" ? "confirmed" : "cancelled",
                              }),
                            ),
                          () => notify(ui.copy.saved),
                        )
                      }
                    >
                      {event.status === "cancelled" ? (
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <Ban className="h-3.5 w-3.5" aria-hidden />
                      )}
                      {event.status === "cancelled"
                        ? ui.copy.details.restoreEvent
                        : ui.copy.details.cancelEvent}
                    </SecondaryButton>
                    <SecondaryButton
                      onClick={() => setConfirming(true)}
                      className="text-destructive hover:border-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      {ui.copy.details.delete}
                    </SecondaryButton>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs transition-colors hover:border-accent disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
    >
      {children}
    </button>
  );
}

function DangerButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md bg-destructive px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {children}
    </button>
  );
}
