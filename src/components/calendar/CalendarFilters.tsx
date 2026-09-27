import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { toggleFilter, type CalendarFilters as Filters } from "@/lib/calendar/filters";
import { CATEGORIES, type CalendarSummary, type TeamMember } from "@/lib/calendar/types";
import { CATEGORY_ICONS, swatch } from "./calendar-colors";
import { useCalendarUi } from "./CalendarContext";

function Option({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-studio-foreground transition-colors hover:bg-white/[0.05] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          checked ? "border-accent bg-accent text-ink" : "border-white/30"
        }`}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      {children}
    </label>
  );
}

function Section({
  title,
  onAll,
  allChecked,
  allLabel,
  children,
}: {
  title: string;
  onAll: () => void;
  allChecked: boolean;
  allLabel: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.3em] text-studio-muted">
        {title}
      </legend>
      <Option checked={allChecked} onChange={onAll}>
        <span className="text-studio-muted">{allLabel}</span>
      </Option>
      {children}
    </fieldset>
  );
}

/** Calendars, people and categories. Everything is on by default; filtering never refetches. */
export function CalendarFilters({
  filters,
  onChange,
  calendars,
  team,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  calendars: CalendarSummary[];
  team: TeamMember[];
}) {
  const ui = useCalendarUi();
  const calendarIds = calendars.map((c) => c.id);
  const peopleIds = team.map((p) => p.id);
  const categoryIds = [...CATEGORIES, "none" as const];
  const isOn = <T,>(list: T[] | null, v: T) => list === null || list.includes(v);

  return (
    <div className="px-3 py-5">
      <Section
        title={ui.copy.calendars}
        allLabel={ui.copy.all}
        allChecked={filters.calendars === null}
        onAll={() => onChange({ ...filters, calendars: null })}
      >
        {calendars.map((c) => (
          <Option
            key={c.id}
            checked={isOn(filters.calendars, c.id)}
            onChange={() =>
              onChange({
                ...filters,
                calendars: toggleFilter(filters.calendars, c.id, calendarIds),
              })
            }
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: swatch(c.color) }}
            />
            <span className="min-w-0 flex-1 truncate">{c.name}</span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-studio-muted">
              {ui.copy.roleNames[c.role]}
            </span>
          </Option>
        ))}
      </Section>

      <Section
        title={ui.copy.people}
        allLabel={ui.copy.all}
        allChecked={filters.people === null}
        onAll={() => onChange({ ...filters, people: null })}
      >
        {team.map((p) => (
          <Option
            key={p.id}
            checked={isOn(filters.people, p.id)}
            onChange={() =>
              onChange({ ...filters, people: toggleFilter(filters.people, p.id, peopleIds) })
            }
          >
            <span
              aria-hidden
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold uppercase"
            >
              {p.name.charAt(0)}
            </span>
            <span className="truncate">{p.name}</span>
          </Option>
        ))}
      </Section>

      <Section
        title={ui.copy.categories}
        allLabel={ui.copy.all}
        allChecked={filters.categories === null}
        onAll={() => onChange({ ...filters, categories: null })}
      >
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          return (
            <Option
              key={cat}
              checked={isOn(filters.categories, cat)}
              onChange={() =>
                onChange({
                  ...filters,
                  categories: toggleFilter(filters.categories, cat, categoryIds),
                })
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-studio-muted" aria-hidden />
              <span>{ui.copy.categoryNames[cat]}</span>
            </Option>
          );
        })}
        <Option
          checked={isOn(filters.categories, "none")}
          onChange={() =>
            onChange({
              ...filters,
              categories: toggleFilter(filters.categories, "none", categoryIds),
            })
          }
        >
          <span className="w-3.5" aria-hidden />
          <span className="text-studio-muted">{ui.copy.form.noCategory}</span>
        </Option>
      </Section>
    </div>
  );
}
