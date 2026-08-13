import { useReveal } from "./anim";
import kanoyK from "@/assets/kanoy-k.png";

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
  return (
    <section className="relative bg-sand px-6 py-32 md:px-14 md:py-48" aria-label="About KANOY">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="eyebrow">About KANOY</div>
          <h2 className="mt-6 font-display text-[10vw] leading-[0.88] tracking-[-0.045em] md:text-[5.4vw]">
            WE DON'T JUST
            <br />
            BUILD WEBSITES.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <Reveal delay={0.1}>
            <p className="max-w-xl text-base leading-relaxed text-ink/65">
              KANOY creates digital experiences, websites and custom systems designed around the way a
              business actually operates. Every project starts from the client's reality — the bookings,
              the calendars, the customers, the pressure of a real operation — and ends as something people
              remember after they close the tab.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <span className="k-halo inline-block">
              <img src={kanoyK} alt="" aria-hidden loading="lazy" className="k-float k-glow w-24 md:w-32" />
            </span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section className="relative bg-background px-6 py-32 md:px-14 md:py-44" aria-label="How KANOY works commercially">
      <div className="mx-auto grid max-w-5xl gap-14 md:grid-cols-2">
        <Reveal>
          <div className="eyebrow">The model</div>
          <h2 className="mt-6 font-display text-4xl leading-[0.98] tracking-[-0.03em] md:text-5xl">
            Website creation
            <br />
            <span className="text-ink/45">+ monthly management</span>
          </h2>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-ink/60">
            KANOY generally works with a build phase followed by a monthly service. Custom systems and
            advanced functionality are quoted individually, based on what the project really needs.
          </p>
        </Reveal>
        <Reveal delay={0.12}>
          <ul className="border-t border-ink/10">
            {["Hosting", "Maintenance", "Updates", "Technical management"].map((i) => (
              <li key={i} className="flex items-center justify-between border-b border-ink/10 py-5 text-sm">
                <span>{i}</span>
                <span className="text-accent">included</span>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <p className="font-display text-2xl tracking-[-0.02em]">Need something custom?</p>
            <a href="#contact" className="btn-kanoy mt-6">
              Talk to us
            </a>
            <p className="mt-5 text-xs leading-relaxed text-ink/50">
              For custom projects, contact KANOY for more information or to request a portfolio of
              previous work.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Contact() {
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
            LET'S BUILD
            <br />
            SOMETHING.
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-8 text-sm uppercase tracking-[0.32em] text-studio-muted">
            Tell us what you're thinking.
          </p>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <a href="mailto:hello@kanoy.studio?subject=Project%20enquiry" className="btn-kanoy bg-accent text-ink">
              Contact KANOY
            </a>
            <a
              href="mailto:hello@kanoy.studio?subject=Portfolio%20request"
              className="btn-kanoy-ghost border-studio-foreground/25 text-studio-foreground"
            >
              Request portfolio
            </a>
          </div>
        </Reveal>
        <div className="mt-28 flex flex-col items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-studio-muted/70">
          <img src={kanoyK} alt="KANOY" width={1024} height={1024} loading="lazy" className="w-8" />
          <span>KANOY — Digital studio</span>
        </div>
      </div>
    </section>
  );
}
