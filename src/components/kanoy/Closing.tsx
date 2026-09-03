import { useReveal } from "./anim";
import kanoyK from "@/assets/branding/kanoy-k.png";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ContactModal } from "./ContactModal";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, shown } = useReveal<HTMLDivElement>(0.25);
  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(38px)",
        filter: shown ? "none" : "blur(8px)",
        transition: `opacity 1s ${delay}s cubic-bezier(.2,.7,.2,1), transform 1.1s ${delay}s cubic-bezier(.2,.7,.2,1), filter 1s ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export function About() {
  const { dict } = useLanguage();
  return (
    <section
      id="about"
      className="relative bg-sand px-6 py-32 md:px-14 md:py-48"
      aria-label="About KANOY"
    >
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="eyebrow">{dict.about.eyebrow}</div>
          <h2 className="mt-6 font-display text-[10vw] leading-[0.88] tracking-[-0.045em] md:text-[5.4vw]">
            {dict.about.titleLine1}
            <br />
            {dict.about.titleLine2}
          </h2>
        </Reveal>
        <div className="mt-14">
          <Reveal delay={0.1}>
            <p className="max-w-xl text-base leading-relaxed text-ink/65">{dict.about.text}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  const { dict } = useLanguage();
  return (
    <section
      id="pricing"
      className="relative bg-background px-6 py-32 md:px-14 md:py-44"
      aria-label="How KANOY works commercially"
    >
      <div className="mx-auto grid max-w-5xl gap-14 md:grid-cols-2">
        <Reveal>
          <div className="eyebrow">{dict.pricing.eyebrow}</div>
          <h2 className="mt-6 font-display text-4xl leading-[0.98] tracking-[-0.03em] md:text-5xl">
            {dict.pricing.titleLine1}
            <br />
            <span className="text-ink/45">{dict.pricing.titleLine2}</span>
          </h2>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-ink/60">{dict.pricing.text}</p>
        </Reveal>
        <Reveal delay={0.12}>
          <ul className="border-t border-ink/10">
            {dict.pricing.items.map((i) => (
              <li
                key={i}
                className="flex items-center justify-between border-b border-ink/10 py-5 text-sm"
              >
                <span>{i}</span>
                <span className="text-accent">{dict.pricing.included}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <p className="font-display text-2xl tracking-[-0.02em]">{dict.pricing.needCustom}</p>
            <a href="#contact" className="btn-kanoy mt-6">
              {dict.pricing.talkToUs}
            </a>
            <p className="mt-5 text-xs leading-relaxed text-ink/50">{dict.pricing.customNote}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Contact() {
  const { dict } = useLanguage();
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-ink px-6 py-40 text-studio-foreground md:px-14 md:py-56"
      aria-label="Contact KANOY"
    >
      <div className="light-beam" style={{ opacity: 0.35 }} />
      <div className="relative mx-auto max-w-5xl text-center">
        <Reveal>
          <h2 className="font-display text-[13vw] leading-[0.85] tracking-[-0.05em] md:text-[8vw]">
            {dict.contact.titleLine1}
            <br />
            {dict.contact.titleLine2}
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-8 text-sm uppercase tracking-[0.32em] text-studio-muted">
            {dict.contact.subtitle}
          </p>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <ContactModal />
          </div>
        </Reveal>
        <div className="mt-28 flex flex-col items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-studio-muted/70">
          <img src={kanoyK} alt="KANOY" width={1024} height={1024} loading="lazy" className="w-8" />
          <span>{dict.contact.footerTagline}</span>
        </div>
      </div>
    </section>
  );
}
