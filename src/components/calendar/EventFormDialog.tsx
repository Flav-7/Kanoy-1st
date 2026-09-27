import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  eventToForm,
  formProblem,
  toEventInput,
  withStartChanged,
  type EventFormState,
} from "@/lib/calendar/form";
import { canEditEvents } from "@/lib/calendar/permissions";
import {
  CATEGORIES,
  FREQUENCIES,
  STATUSES,
  displayName,
  type CalendarEvent,
} from "@/lib/calendar/types";
import { CATEGORY_ICONS, eventSwatch, swatch } from "./calendar-colors";
import { useCalendarUi } from "./CalendarContext";
import { useEventActions } from "./useCalendarData";

export type FormRequest =
  { kind: "create"; form: EventFormState } | { kind: "edit"; event: CalendarEvent };

const inputClass =
  "w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-studio-foreground placeholder:text-studio-muted/60 focus:border-accent focus:outline-none [color-scheme:dark]";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.3em] text-studio-muted">{label}</span>
      {children}
    </label>
  );
}

/**
 * Create / edit form. Saving an edit sends the version it was opened at;
 * if someone saved in between, the server answers CONFLICT with their
 * version, and the form offers to load it instead of overwriting it.
 */
export function EventFormDialog({
  request,
  onClose,
  notify,
}: {
  request: FormRequest | null;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const ui = useCalendarUi();
  const actions = useEventActions();
  const t = ui.copy.form;

  const [form, setForm] = useState<EventFormState | null>(null);
  const [editing, setEditing] = useState<{ id: string; version: number } | null>(null);
  const [latest, setLatest] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!request) return;
    setForm(request.kind === "create" ? request.form : eventToForm(request.event));
    setEditing(
      request.kind === "edit" ? { id: request.event.id, version: request.event.version } : null,
    );
    setLatest(null);
    setError(null);
    setSaving(false);
  }, [request]);

  const editableCalendars = useMemo(
    () => [...ui.calendarsById.values()].filter((c) => canEditEvents(c.role)),
    [ui.calendarsById],
  );
  // "Só comigo / contigo / os dois": the people who work on activities. Read-only
  // members (people associated to an area) are notified, not assigned.
  const editorIds = form ? (ui.calendarsById.get(form.calendarId)?.editorIds ?? []) : [];
  const members = form ? [...new Set([...editorIds, ...form.participants])] : [];

  if (!form) return null;

  const set = (patch: Partial<EventFormState>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setStart = (patch: Partial<EventFormState>) =>
    setForm((f) => (f ? withStartChanged(f, patch) : f));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = formProblem(form);
    if (problem) {
      setError(
        problem === "title"
          ? t.titleRequired
          : problem === "duration"
            ? ui.copy.errors.INVALID_EVENT_DURATION
            : ui.copy.errors.INVALID_INPUT,
      );
      return;
    }
    setSaving(true);
    setError(null);
    const input = toEventInput(form);
    const result = editing
      ? await actions.update(editing.id, editing.version, input)
      : await actions.create(input);
    setSaving(false);
    if (result.ok) {
      notify(ui.copy.saved);
      onClose();
      return;
    }
    setError(ui.copy.errors[result.error]);
    if (result.error === "CONFLICT" && "latest" in result && result.latest)
      setLatest(result.latest);
  };

  const loadLatest = () => {
    if (!latest) return;
    setForm(eventToForm(latest));
    setEditing({ id: latest.id, version: latest.version });
    setLatest(null);
    setError(null);
  };

  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[94vw] max-w-xl border-white/10 bg-ink p-6 text-studio-foreground shadow-2xl sm:rounded-xl md:p-8">
        <DialogTitle className="font-display text-2xl tracking-[-0.02em]">
          {editing ? t.editTitle : t.newTitle}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {editing ? t.editTitle : t.newTitle}
        </DialogDescription>

        <form onSubmit={submit} className="mt-2 flex flex-col gap-4" noValidate>
          <Field label={t.title}>
            <input
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder={t.titlePlaceholder}
              className={inputClass}
            />
          </Field>

          <fieldset>
            <legend className="mb-1.5 text-[10px] uppercase tracking-[0.3em] text-studio-muted">
              {t.category}
            </legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const on = form.category === c;
                const Icon = CATEGORY_ICONS[c];
                const color = eventSwatch(
                  { category: c },
                  ui.calendarsById.get(form.calendarId)?.color,
                );
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ category: on ? "" : c })}
                    style={
                      on
                        ? { background: color, borderColor: color }
                        : { borderColor: `color-mix(in oklab, ${color} 55%, transparent)` }
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      on ? "font-medium text-ink" : "text-studio-foreground hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden style={on ? undefined : { color }} />
                    {ui.copy.categoryNames[c]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => setStart({ allDay: e.target.checked })}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {t.allDay}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.startDate}>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setStart({ startDate: e.target.value })}
                className={inputClass}
              />
            </Field>
            {!form.allDay ? (
              <Field label={t.start}>
                <input
                  type="time"
                  required
                  step={300}
                  value={form.startTime}
                  onChange={(e) => setStart({ startTime: e.target.value })}
                  className={inputClass}
                />
              </Field>
            ) : (
              <div />
            )}
            <Field label={t.endDate}>
              <input
                type="date"
                required
                min={form.startDate}
                value={form.endDate}
                onChange={(e) => set({ endDate: e.target.value })}
                className={inputClass}
              />
            </Field>
            {!form.allDay && (
              <Field label={t.end}>
                <input
                  type="time"
                  required
                  step={300}
                  value={form.endTime}
                  onChange={(e) => set({ endTime: e.target.value })}
                  className={inputClass}
                />
              </Field>
            )}
          </div>
          {form.timezone !== ui.tz && (
            <p className="-mt-2 text-xs text-studio-muted">
              {ui.copy.details.timezone}: {form.timezone}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.calendar}>
              <select
                value={form.calendarId}
                onChange={(e) => {
                  const editorIds = ui.calendarsById.get(e.target.value)?.editorIds ?? [];
                  set({
                    calendarId: e.target.value,
                    participants: form.participants.filter((p) => editorIds.includes(p)),
                  });
                }}
                className={inputClass}
              >
                {editableCalendars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.status}>
              <select
                value={form.status}
                onChange={(e) => set({ status: e.target.value as EventFormState["status"] })}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ui.copy.statusNames[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-[10px] uppercase tracking-[0.3em] text-studio-muted">
              {t.participants}
            </legend>
            <div className="flex flex-wrap gap-2">
              {members.map((id) => {
                const person = ui.teamById.get(id);
                const on = form.participants.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      set({
                        participants: on
                          ? form.participants.filter((p) => p !== id)
                          : [...form.participants, id],
                      })
                    }
                    className={`rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      on
                        ? "border-accent bg-accent text-ink"
                        : "border-white/20 text-studio-muted hover:text-studio-foreground"
                    }`}
                  >
                    {displayName(person)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t.repeat}>
              <select
                value={form.repeat}
                onChange={(e) => set({ repeat: e.target.value as EventFormState["repeat"] })}
                className={inputClass}
              >
                <option value="">{t.noRepeat}</option>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {t.frequencies[f]}
                  </option>
                ))}
              </select>
            </Field>
            {form.repeat && (
              <>
                <Field label={t.every}>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={form.interval}
                    onChange={(e) =>
                      set({ interval: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label={`${t.until} (${t.untilHint})`}>
                  <input
                    type="date"
                    min={form.startDate}
                    value={form.until}
                    onChange={(e) => set({ until: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </>
            )}
          </div>
          {editing && form.repeat && (
            <p className="-mt-2 text-xs text-studio-muted">{t.seriesNote}</p>
          )}

          <Field label={t.description}>
            <textarea
              rows={3}
              maxLength={5000}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </Field>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
            >
              <p>{error}</p>
              {latest && (
                <button
                  type="button"
                  onClick={loadLatest}
                  className="mt-2 text-xs uppercase tracking-[0.2em] text-accent hover:underline"
                >
                  {t.reloadLatest}
                </button>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-4">
            <span className="mr-auto flex items-center gap-2 text-xs text-studio-muted">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: swatch(ui.calendarsById.get(form.calendarId)?.color) }}
              />
              {ui.calendarsById.get(form.calendarId)?.name}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs uppercase tracking-[0.3em] text-studio-muted hover:text-studio-foreground"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-kanoy bg-accent text-ink disabled:opacity-60"
            >
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
