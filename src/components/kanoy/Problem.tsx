import type { ComponentType } from "react";
import { BarChart3, Clock, EyeOff, MessageCircle, Settings, Smartphone } from "lucide-react";
import { useReveal } from "./anim";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import browserWindow from "@/assets/problem/browser-window.png";

const ITEM_ICONS = [Clock, Smartphone, EyeOff, MessageCircle, BarChart3, Settings];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, shown } = useReveal<HTMLDivElement>(0.2);
  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(28px)",
        transition: `opacity 0.9s ${delay}s cubic-bezier(.2,.7,.2,1), transform 0.9s ${delay}s cubic-bezier(.2,.7,.2,1)`,
      }}
    >
      {children}
    </div>
  );
}

function ProblemItem({
  item,
  shown,
  delay,
}: {
  item: { title: string; text: string; icon: ComponentType<{ className?: string; strokeWidth?: number }> };
  shown: boolean;
  delay: number;
}) {
  return (
    <div
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0) scale(1)" : "translateY(40px) scale(0.82)",
        transition: `opacity 0.8s ${delay}s cubic-bezier(.34,1.56,.64,1), transform 0.8s ${delay}s cubic-bezier(.34,1.56,.64,1)`,
      }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
        <item.icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 font-display text-base tracking-[-0.01em] text-ink">{item.title}</h3>
      <p className="mt-1.5 text-sm leading-snug text-ink/55">{item.text}</p>
    </div>
  );
}

function Badge({
  icon: Icon,
  label,
  className = "",
  delay = "0s",
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  className?: string;
  delay?: string;
}) {
  return (
    <div
      className={`problem-badge absolute flex items-center gap-2.5 rounded-xl border border-white/60 bg-white/80 py-2 pl-2.5 pr-4 shadow-[0_10px_30px_-12px_rgba(20,60,90,0.35)] backdrop-blur-md ${className}`}
      style={{ animationDelay: delay }}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="text-xs font-medium leading-tight text-ink/80">{label}</span>
    </div>
  );
}

export function Problem() {
  const { dict } = useLanguage();
  const items = dict.problem.items.map((item, i) => ({ ...item, icon: ITEM_ICONS[i]! }));
  const { ref: gridRef, shown: gridShown } = useReveal<HTMLDivElement>(0.15, { repeat: true });

  return (
    <section
      id="problem"
      className="relative overflow-hidden bg-background px-6 py-32 md:px-14 md:py-40"
      aria-label={dict.problem.eyebrow}
    >
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2 md:items-center md:gap-10">
        <div>
          <Reveal>
            <div className="eyebrow">{dict.problem.eyebrow}</div>
            <h2 className="mt-6 font-display text-[9vw] leading-[0.92] tracking-[-0.035em] md:text-[3.1vw]">
              {dict.problem.titleLine1}
              <br />
              {dict.problem.titleLine2}
            </h2>
            <p className="mt-7 max-w-md text-sm leading-relaxed text-ink/60 md:text-base">
              {dict.problem.subtitle}
            </p>
          </Reveal>

          <div ref={gridRef} className="mt-14 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3">
            {items.map((item, i) => (
              <ProblemItem key={item.title} item={item} shown={gridShown} delay={0.1 + i * 0.09} />
            ))}
          </div>
        </div>

        <Reveal delay={0.15}>
          <div className="relative mx-auto hidden aspect-square w-full max-w-md md:block">
            <div className="absolute inset-[6%] rounded-full bg-accent/25 blur-[80px]" />
            <div className="absolute inset-[14%] rounded-full bg-accent-2/20 blur-[70px]" />

            <div className="absolute left-1/2 top-1/2 w-[78%] -translate-x-1/2 -translate-y-1/2">
              <img
                src={browserWindow}
                alt=""
                aria-hidden
                loading="lazy"
                className="k-balloon block w-full drop-shadow-[0_30px_60px_rgba(20,60,90,0.35)]"
              />
            </div>

            <Badge
              icon={Clock}
              label={dict.problem.badges.slow}
              className="left-[2%] top-[16%]"
              delay="0s"
            />
            <Badge
              icon={Smartphone}
              label={dict.problem.badges.mobile}
              className="right-[0%] top-[30%] text-right"
              delay="1.4s"
            />
            <Badge
              icon={EyeOff}
              label={dict.problem.badges.design}
              className="left-[0%] bottom-[24%]"
              delay="2.4s"
            />
            <Badge
              icon={BarChart3}
              label={dict.problem.badges.conversions}
              className="right-[4%] bottom-[10%]"
              delay="0.8s"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
