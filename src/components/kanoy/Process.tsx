import { useRef, useState } from "react";
import { useScrollProgress } from "./anim";
import { folderPath, useFolderSize } from "./folder-shape";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const STEP_NUMBERS = ["01", "02", "03", "04", "05", "06"];

// A generous fixed height for the stack, well beyond what the content ever
// actually needs. Without it the flex container's height tracks its content
// exactly, so the moment the open step shrinks back down the container's
// own top edge sweeps down past a mouse that never moved — an instant
// mouseleave that closes the very step the cursor is still sitting over,
// which reopens it, which shrinks it again. Extra empty space above the
// stack means the cursor is always still "inside" while a step transitions.
const STACK_HEIGHT = 640;

type Step = { n: string; t: string; d: string };

function StepFolder({
  step,
  stepLabel,
  isActive,
  widthPct,
  zIndex,
  onOpen,
  onClick,
}: {
  step: Step;
  stepLabel: string;
  isActive: boolean;
  widthPct: number;
  zIndex: number;
  onOpen: () => void;
  onClick: () => void;
}) {
  const { ref, size } = useFolderSize<HTMLDivElement>();
  const d = folderPath(size.w, size.h);

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onMouseMove={onOpen}
      onFocus={onOpen}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative mx-auto -mt-9 w-full shrink-0 cursor-pointer text-left transition-[padding] duration-500 ease-out ${
        isActive ? "min-h-[280px] px-8 pb-8 pt-4 md:px-12 md:pb-10" : "px-8 pb-10 pt-4"
      }`}
      style={{
        maxWidth: `${isActive ? 100 : widthPct}%`,
        zIndex,
        clipPath: d ? `path('${d}')` : undefined,
        background: isActive
          ? "linear-gradient(135deg, color-mix(in oklab, var(--accent) 16%, var(--ink)) 0%, var(--ink) 70%)"
          : "color-mix(in oklab, var(--studio-foreground) 5%, var(--ink))",
        backdropFilter: "blur(10px)",
        transition:
          "padding 500ms ease-out, background 500ms ease-out, max-width 500ms ease-out, min-height 500ms ease-out",
      }}
    >
      {d && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <path
            d={d}
            fill="none"
            strokeWidth={1.5}
            stroke={
              isActive
                ? "var(--accent)"
                : "color-mix(in oklab, var(--studio-foreground) 16%, transparent)"
            }
            style={
              isActive
                ? {
                    filter:
                      "drop-shadow(0 0 3px color-mix(in oklab, var(--accent) 80%, transparent)) drop-shadow(0 0 22px color-mix(in oklab, var(--accent) 55%, transparent))",
                  }
                : undefined
            }
          />
        </svg>
      )}
      <div className="relative">
        <div className="text-[10px] tracking-[0.4em] text-accent">
          {stepLabel} {step.n}
        </div>
        <div
          className={`grid transition-all duration-500 ease-out ${
            isActive ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <h3 className="font-display text-3xl leading-[1.02] tracking-[-0.03em] md:text-5xl">
              {step.t}
            </h3>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-studio-muted">{step.d}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Process() {
  const { ref, p } = useScrollProgress<HTMLDivElement>();
  const { dict } = useLanguage();
  const STEPS = dict.process.steps.map((step, i) => ({ n: STEP_NUMBERS[i]!, ...step }));
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const activeIndex = hoverIndex ?? 0;

  // Opening a step resizes it, so a cursor merely passing over 03/04 on its
  // way to 05 would trigger a reflow before ever arriving. Committing only
  // after a brief dwell (like a hover-intent menu) means transit doesn't
  // resize anything; only the step the cursor actually settles on does.
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openStep = (i: number) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoverIndex(i), 12);
  };
  const closeSteps = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoverIndex(null), 12);
  };

  return (
    <section
      id="process"
      ref={ref}
      className="relative h-screen bg-ink text-studio-foreground"
      aria-label="How KANOY works"
    >
      <div className="flex h-screen flex-col items-center justify-end overflow-hidden pb-[30vh]">
        <div className="light-beam" style={{ opacity: 0.22 + p * 0.25 }} />
        <div className="absolute left-6 top-10 md:left-14">
          <div className="text-[10px] uppercase tracking-[0.42em] text-accent">
            {dict.process.eyebrow}
          </div>
        </div>

        <div
          className="flex w-[70vw] max-w-lg flex-col-reverse"
          style={{ height: STACK_HEIGHT }}
          onMouseLeave={closeSteps}
        >
          {STEPS.map((s, i) => (
            <StepFolder
              key={s.n}
              step={s}
              stepLabel={dict.process.stepLabel}
              isActive={i === activeIndex}
              widthPct={100 - i * 3}
              zIndex={STEPS.length - i}
              onOpen={() => openStep(i)}
              onClick={() => openStep(i)}
            />
          ))}
        </div>

        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-2">
          {STEPS.map((s, i) => (
            <span
              key={s.n}
              className="h-[2px] w-8 bg-studio-foreground/20"
              style={{ background: i <= activeIndex ? "var(--accent)" : undefined }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
