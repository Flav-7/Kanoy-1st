import { clamp, range, useScrollProgress } from "./anim";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const STEP_NUMBERS = ["01", "02", "03", "04", "05", "06"];

export function Process() {
  const { ref, p } = useScrollProgress<HTMLDivElement>();
  const { dict } = useLanguage();
  const STEPS = dict.process.steps.map((step, i) => ({ n: STEP_NUMBERS[i]!, ...step }));

  return (
    <section id="process" ref={ref} className="relative h-[600vh] bg-ink text-studio-foreground" aria-label="How KANOY works">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="light-beam" style={{ opacity: 0.22 + p * 0.25 }} />
        <div className="absolute left-6 top-10 md:left-14">
          <div className="text-[10px] uppercase tracking-[0.42em] text-accent">{dict.process.eyebrow}</div>
        </div>
        <div className="camera">
          <div className="world">
            {STEPS.map((s, i) => {
              const start = i * 0.155;
              const t = range(p, start, start + 0.155);
              const z = (1 - t) * 1200 - t * 320;
              const opacity = clamp(t * 6) * (1 - clamp((t - 0.88) / 0.12));
              return (
                <article
                  key={s.n}
                  className="absolute left-1/2 top-1/2 w-[86vw] max-w-2xl border border-studio-foreground/12 bg-studio-foreground/[0.04] p-8 backdrop-blur-md md:p-12"
                  style={{
                    transform: `translate3d(calc(-50% + ${(i % 2 ? 1 : -1) * (1 - t) * 8}vw), -50%, ${-z}px) rotateY(${(i % 2 ? -1 : 1) * (1 - t) * 12}deg)`,
                    opacity,
                    filter: `blur(${(1 - clamp(t * 3)) * 8}px)`,
                  }}
                >
                  <div className="text-[10px] tracking-[0.4em] text-accent">{dict.process.stepLabel} {s.n}</div>
                  <h3 className="mt-5 font-display text-3xl leading-[1.02] tracking-[-0.03em] md:text-5xl">{s.t}</h3>
                  <p className="mt-5 max-w-md text-sm leading-relaxed text-studio-muted">{s.d}</p>
                </article>
              );
            })}
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-2">
          {STEPS.map((s, i) => (
            <span
              key={s.n}
              className="h-[2px] w-8 bg-studio-foreground/20"
              style={{ background: p > i * 0.155 ? "var(--accent)" : undefined }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
