import { clamp, range, useScrollProgress } from "./anim";
import kanoyK from "@/assets/kanoy-k.png";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const SERVICE_NUMBERS = ["01", "02", "03", "04", "05", "06", "07"];

export function Services() {
  const { ref, p } = useScrollProgress<HTMLDivElement>();
  const { dict } = useLanguage();
  const SERVICES = dict.services.items.map((item, i) => ({ n: SERVICE_NUMBERS[i]!, ...item }));

  return (
    <section ref={ref} className="relative h-[520vh] bg-background" aria-label="What KANOY does">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden px-6 py-[4vh] md:px-14">

        <div
          className="pointer-events-none absolute -right-[8vw] top-1/2 -translate-y-1/2"
          style={{ opacity: 0.26 + p * 0.12, transform: `translate3d(0,-50%,0) rotate(${-10 + p * 20}deg) scale(${1 + p * 0.2})` }}
        >
          <span className="k-halo">
            <img src={kanoyK} alt="" aria-hidden loading="lazy" className="k-glow w-[34vw]" />
          </span>
        </div>

        <div className="relative mx-auto w-full max-w-5xl">
          <div className="eyebrow" style={{ opacity: range(p, 0, 0.06) }}>
            {dict.services.eyebrow}
          </div>
          <h2
            className="mt-[1.5vh] font-display text-[clamp(1.5rem,3.6vh,2.9rem)] leading-[0.95] tracking-[-0.03em]"
            style={{
              opacity: range(p, 0.01, 0.08),
              transform: `translateY(${(1 - range(p, 0.01, 0.08)) * 40}px)`,
            }}
          >
            {dict.services.title}
          </h2>

          <ul className="mt-[2vh]">
            {SERVICES.map((s, i) => {
              const start = 0.1 + i * 0.115;
              const t = range(p, start, start + 0.09);
              const past = range(p, start + 0.16, start + 0.3);
              return (
                <li
                  key={s.n}
                  className="border-t border-ink/10 py-[0.55vh]"
                  style={{
                    opacity: clamp(t - past * 0.55),
                    transform: `translate3d(${(1 - t) * 60}px, ${(1 - t) * 18}px, 0)`,
                    filter: `blur(${(1 - t) * 6}px)`,
                  }}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:gap-10">
                    <span className="text-[10px] tracking-[0.4em] text-accent">{s.n}</span>
                    <h3 className="font-display text-[clamp(1rem,2.2vh,1.6rem)] tracking-[-0.02em] md:w-[38%]">{s.title}</h3>
                    <p className="max-w-md text-[clamp(0.72rem,1.6vh,0.9rem)] leading-relaxed text-ink/60">{s.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
