import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { formatPlainDate, viewDays, type PlainDate, type View } from "@/lib/calendar/dates";
import { useCalendarUi } from "./CalendarContext";

function periodTitle(
  view: View,
  anchor: PlainDate,
  locale: Parameters<typeof formatPlainDate>[2],
): string {
  if (view === "month" || view === "agenda") return formatPlainDate(anchor, "LLLL yyyy", locale);
  if (view === "day") return formatPlainDate(anchor, "PPPP", locale);
  const days = viewDays("week", anchor);
  const first = days[0]!;
  const last = days[6]!;
  const sameMonth = first.slice(0, 7) === last.slice(0, 7);
  return sameMonth
    ? `${Number(first.slice(8))}–${formatPlainDate(last, "d MMMM yyyy", locale)}`
    : `${formatPlainDate(first, "d MMM", locale)} – ${formatPlainDate(last, "d MMM yyyy", locale)}`;
}

const buttonClass =
  "inline-flex items-center justify-center rounded-md border border-white/15 text-studio-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function CalendarToolbar({
  view,
  views,
  anchor,
  loading,
  onView,
  onToday,
  onShift,
  onToggleFilters,
  filtersActive,
}: {
  view: View;
  views: View[];
  anchor: PlainDate;
  loading: boolean;
  onView: (v: View) => void;
  onToday: () => void;
  onShift: (direction: 1 | -1) => void;
  onToggleFilters: () => void;
  filtersActive: boolean;
}) {
  const ui = useCalendarUi();
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 md:gap-3 md:px-6">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onShift(-1)}
          aria-label={ui.copy.previous}
          className={`${buttonClass} h-8 w-8`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onShift(1)}
          aria-label={ui.copy.next}
          className={`${buttonClass} h-8 w-8`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={onToday}
        className={`${buttonClass} h-8 px-3 text-xs uppercase tracking-[0.2em]`}
      >
        {ui.copy.today}
      </button>
      <h2
        aria-live="polite"
        className="order-first w-full min-w-0 truncate font-display text-lg first-letter:uppercase tracking-[-0.01em] text-studio-foreground md:order-none md:w-auto md:flex-1 md:text-xl"
      >
        {periodTitle(view, anchor, ui.locale)}
        {loading && (
          <span
            className="ml-3 inline-block h-2 w-2 animate-pulse rounded-full bg-accent align-middle"
            aria-label={ui.copy.loading}
          />
        )}
      </h2>

      <div
        role="radiogroup"
        aria-label={ui.copy.viewLabel}
        className="ml-auto flex rounded-md border border-white/15 p-0.5 md:ml-0"
      >
        {views.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={view === v}
            onClick={() => onView(v)}
            className={`rounded px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:px-3 ${
              view === v ? "bg-accent text-ink" : "text-studio-muted hover:text-studio-foreground"
            }`}
          >
            {ui.copy.views[v]}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onToggleFilters}
        aria-label={ui.copy.filters}
        className={`${buttonClass} relative h-8 w-8 lg:hidden`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {filtersActive && (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent"
            aria-hidden
          />
        )}
      </button>
    </div>
  );
}
