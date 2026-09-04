import { clamp, useScrollProgress } from "./anim";
import kanoyK from "@/assets/branding/kanoy-k.png";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const SERVICE_NUMBERS = ["01", "02", "03", "04", "05", "06", "07"];

export function Services() {
  const { ref, p } = useScrollProgress<HTMLDivElement>();
  const { dict } = useLanguage();
  const SERVICES = dict.services.items.map((item, i) => ({ n: SERVICE_NUMBERS[i]!, ...item }));
  const activeIndex = clamp(Math.floor(p * SERVICES.length), 0, SERVICES.length - 1);

  return (
    <section
      id="services"
      ref={ref}
      className="relative h-[250vh] bg-background"
      aria-label="What KANOY does"
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden px-6 py-[4vh] md:px-14">
        <div
          className="pointer-events-none absolute right-[3vw] top-[6vh]"
          style={{
            opacity: 0.26 + p * 0.12,
            transform: `rotate(${-10 + p * 20}deg) scale(${1 + p * 0.12})`,
          }}
        >
          <span className="k-halo">
            <img src={kanoyK} alt="" aria-hidden loading="lazy" className="k-glow w-[28vw]" />
          </span>
        </div>

        <div className="relative mx-auto w-full max-w-5xl">
          <div className="eyebrow">{dict.services.eyebrow}</div>
          <h2 className="mt-[1.5vh] font-display text-[clamp(1.5rem,3.6vh,2.9rem)] leading-[0.95] tracking-[-0.03em]">
            {dict.services.title}
          </h2>

          <ul className="mt-[3vh]">
            {SERVICES.map((s, i) => {
              const active = i === activeIndex;
              return (
                <li
                  key={s.n}
                  className={`rounded-2xl px-4 py-[1.1vh] transition-colors duration-500 ${
                    active ? "bg-accent/10" : i === 0 ? "" : "border-t border-ink/10"
                  }`}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:gap-10">
                    <span
                      className={`text-[10px] tracking-[0.4em] transition-colors duration-500 md:w-8 ${
                        active ? "text-accent" : "text-accent/40"
                      }`}
                    >
                      {s.n}
                    </span>
                    <h3
                      className={`font-display text-[clamp(1rem,2.2vh,1.6rem)] tracking-[-0.02em] transition-colors duration-500 md:w-[32%] ${
                        active ? "text-ink" : "text-ink/35"
                      }`}
                    >
                      {s.title}
                    </h3>
                    <p
                      className={`max-w-md text-[clamp(0.9rem,2vh,1.05rem)] leading-relaxed transition-colors duration-500 ${
                        active ? "text-ink/70" : "text-ink/30"
                      }`}
                    >
                      {s.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-[3vh] flex items-center gap-4 pl-4 text-[11px] tracking-[0.15em] text-ink/50">
            <span>
              {String(activeIndex + 1).padStart(2, "0")} / {String(SERVICES.length).padStart(2, "0")}
            </span>
            <div className="h-px max-w-[220px] flex-1 bg-ink/15">
              <div
                className="h-px bg-ink/70 transition-[width] duration-500"
                style={{ width: `${((activeIndex + 1) / SERVICES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
