import { useState } from "react";
import { useScrollProgress } from "./anim";
import { folderPath, useFolderSize } from "./folder-shape";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const STEP_NUMBERS = ["01", "02", "03", "04", "05", "06"];

// How far the active folder rises. It's a transform, which never affects
// layout — so without help, rising folder N visually creeps up into folder
// N+1's peeking tab above it without actually moving anything (nothing
// reflows to make room). The margin-top that sets the gap between folder N
// and N+1 is folder N's own (in this flex-col-reverse stack, each item's
// margin-top opens space between IT and the sibling above it, not below),
// so folder N gets that same margin relaxed by the lift amount while it's
// active — its layout top drops by exactly as much as the transform lifts
// it, and the two cancel out, leaving the tab above fully visible.
const LIFT_PX = 18;
const TAB_OVERLAP_PX = 36; // matches the base -mt-9

type Step = { n: string; t: string; d: string };

function StepFolder({
  step,
  stepLabel,
  isActive,
  isBelowActive,
  widthPct,
  zIndex,
  onClick,
}: {
  step: Step;
  stepLabel: string;
  isActive: boolean;
  isBelowActive: boolean;
  widthPct: number;
  zIndex: number;
  onClick: () => void;
}) {
  const { ref, size } = useFolderSize<HTMLDivElement>();
  const d = folderPath(size.w, size.h);

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative mx-auto w-full shrink-0 cursor-pointer text-left transition-[padding] duration-150 ease-out ${
        isActive ? "min-h-[280px] px-8 pb-8 pt-4 md:px-12 md:pb-10" : "min-h-0 px-8 pb-10 pt-4"
      }`}
      style={{
        maxWidth: `${isActive ? 100 : widthPct}%`,
        zIndex: isActive ? 50 : zIndex,
        marginTop: isActive ? -TAB_OVERLAP_PX + LIFT_PX : -TAB_OVERLAP_PX,
        clipPath: d ? `path('${d}')` : undefined,
        background: isActive
          ? "linear-gradient(135deg, color-mix(in oklab, var(--accent) 16%, var(--ink)) 0%, var(--ink) 70%)"
          : isBelowActive
            ? "color-mix(in oklab, var(--accent) 8%, var(--ink))"
            : "color-mix(in oklab, var(--studio-foreground) 5%, var(--ink))",
        backdropFilter: "blur(10px)",
        transform: `translateY(${isActive ? -LIFT_PX : 0}px)`,
        boxShadow: isActive
          ? "0 24px 48px -16px color-mix(in oklab, var(--accent) 30%, black 70%)"
          : "none",
        transition:
          "padding 150ms ease-out, background 150ms ease-out, max-width 150ms ease-out, min-height 150ms ease-out, transform 150ms ease-out, box-shadow 150ms ease-out, margin-top 150ms ease-out",
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
                : isBelowActive
                  ? "color-mix(in oklab, var(--accent) 45%, transparent)"
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
          className={`grid transition-all duration-150 ease-out ${
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
  const [activeIndex, setActiveIndex] = useState(0);

  const openStep = (i: number) => {
    if (activeIndex === i) return;
    setActiveIndex(i);
  };

  return (
    <section
      id="process"
      ref={ref}
      className="relative min-h-screen overflow-hidden bg-ink text-studio-foreground"
      aria-label="How KANOY works"
    >
      <div className="light-beam" style={{ opacity: 0.22 + p * 0.25 }} />
      <div className="flex min-h-screen flex-col items-center justify-end pb-[18vh] pt-28 md:pb-[30vh] md:pt-36">
        <div className="absolute left-6 top-10 md:left-14">
          <div className="text-[10px] uppercase tracking-[0.42em] text-accent">
            {dict.process.eyebrow}
          </div>
        </div>

        <div className="flex w-[70vw] max-w-lg flex-col-reverse">
          {STEPS.map((s, i) => (
            <StepFolder
              key={s.n}
              step={s}
              stepLabel={dict.process.stepLabel}
              isActive={i === activeIndex}
              isBelowActive={i === activeIndex - 1}
              widthPct={100 - i * 3}
              // The open folder grows downward, which would otherwise bury the
              // labels of every folder beneath it (the ones whose tabs
              // normally win the stacking order) under its own body. Lift
              // that whole below-it group above the active folder's z-index
              // as a block, preserving their relative order, so none of
              // their labels gets buried.
              zIndex={i < activeIndex ? 50 + STEPS.length - i : STEPS.length - i}
              onClick={() => openStep(i)}
            />
          ))}
        </div>

        <div className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 gap-2 md:flex">
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
