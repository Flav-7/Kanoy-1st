import { clamp, range, useScrollProgress } from "./anim";

const STEPS = [
  { n: "01", t: "Tell us what you need.", d: "A short conversation about your business, your clients and what has to happen online." },
  { n: "02", t: "We design the experience.", d: "Direction, structure and motion — designed around how people actually use your site." },
  { n: "03", t: "We build the website.", d: "Hand-built, fast, responsive and made to be edited and extended later." },
  { n: "04", t: "We integrate the systems.", d: "Reservations, bookings, calendars, automations — whatever the operation needs." },
  { n: "05", t: "We launch.", d: "Domain, performance, tracking and a controlled go-live." },
  { n: "06", t: "We maintain and host it.", d: "Hosting, updates, technical management — your site stays alive and current." },
];

export function Process() {
  const { ref, p } = useScrollProgress<HTMLDivElement>();

  return (
    <section ref={ref} className="relative h-[600vh] bg-ink text-studio-foreground" aria-label="How KANOY works">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="light-beam" style={{ opacity: 0.22 + p * 0.25 }} />
        <div className="absolute left-6 top-10 md:left-14">
          <div className="text-[10px] uppercase tracking-[0.42em] text-accent">How we work</div>
        </div>
        <div className="camera">
          <div className="world">
            {STEPS.map((s, i) => {
              const start = i * 0.155;
              const t = range(p, start, start + 0.155);
              const z = (1 - t) * 1700 - t * 500;
              const opacity = clamp(t * 5) * (1 - clamp((t - 0.82) / 0.18));
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
                  <div className="text-[10px] tracking-[0.4em] text-accent">STEP {s.n}</div>
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
