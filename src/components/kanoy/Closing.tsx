import { Clock, Mail, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useReveal } from "./anim";
import kanoyK from "@/assets/branding/kanoy-k.webp";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ContactModal } from "./ContactModal";
import { InstagramLink } from "./InstagramLink";

function LegalLinks({ className }: { className?: string }) {
  const { dict } = useLanguage();
  return (
    <nav className={`flex items-center gap-3 ${className ?? ""}`} aria-label="Legal">
      <Link to="/termos" className="transition-colors hover:text-neutral-300">
        {dict.contact.termsLink}
      </Link>
      <span aria-hidden="true">·</span>
      <Link to="/privacidade" className="transition-colors hover:text-neutral-300">
        {dict.contact.privacyLink}
      </Link>
    </nav>
  );
}

/** Phone, hours and Instagram — laid out differently per breakpoint by the
 *  two call sites below, not by this component itself. */
function SupportInfo({
  title,
  phone,
  email,
  hours,
  align,
}: {
  title: string;
  phone: string;
  email: string;
  hours: string;
  align: "center" | "right";
}) {
  const textAlign = align === "center" ? "text-center" : "text-right";
  const justify = align === "center" ? "justify-center" : "justify-end";
  return (
    <div className={`${textAlign} text-[10px] uppercase tracking-[0.2em] text-neutral-400/70`}>
      <div className="text-neutral-500">{title}</div>
      <div className={`mt-1.5 flex items-center gap-1.5 ${justify}`}>
        <Phone className="h-3 w-3" strokeWidth={1.5} />
        <span>{phone}</span>
      </div>
      <div className={`mt-1 flex items-center gap-1.5 ${justify}`}>
        <Mail className="h-3 w-3" strokeWidth={1.5} />
        <span>{email}</span>
      </div>
      <div className={`mt-1 flex items-center gap-1.5 ${justify}`}>
        <Clock className="h-3 w-3" strokeWidth={1.5} />
        <span>{hours}</span>
      </div>
    </div>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, shown } = useReveal<HTMLDivElement>(0.08);
  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(38px)",
        filter: shown ? "none" : "blur(8px)",
        transition: `opacity 0.5s ${delay}s cubic-bezier(.2,.7,.2,1), transform 0.55s ${delay}s cubic-bezier(.2,.7,.2,1), filter 0.5s ${delay}s`,
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
          <h2
            id="about-title"
            className="mt-6 font-display text-[10vw] leading-[0.88] tracking-[-0.045em] md:text-[5.4vw]"
          >
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

export function Contact({ autoOpenModal }: { autoOpenModal?: boolean | undefined }) {
  const { dict } = useLanguage();
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-ink px-6 py-40 text-studio-foreground md:px-14 md:py-56"
      aria-label="Contact KANOY"
    >
      <div className="light-beam" style={{ opacity: 0.35, top: "-10%" }} />
      <div className="absolute bottom-6 left-6 z-50 flex flex-col gap-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-400/70 md:bottom-10 md:left-10">
        <span>{dict.contact.copyright}</span>
        <LegalLinks />
      </div>
      <div className="relative mx-auto max-w-5xl text-center">
        <Reveal>
          <h2
            id="contact-title"
            className="font-display text-[13vw] leading-[0.85] tracking-[-0.05em] md:text-[8vw]"
          >
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
            <ContactModal autoOpen={autoOpenModal} />
          </div>
        </Reveal>
        <div className="mt-10 flex flex-col items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-studio-muted/70">
          <img
            src={kanoyK}
            alt="KANOY"
            width={1024}
            height={1024}
            loading="lazy"
            className="k-balloon w-20 md:w-28"
          />
          <span>{dict.contact.footerTagline}</span>
          <div className="mt-4 flex flex-col items-center gap-1.5 md:hidden">
            <SupportInfo
              title={dict.contact.support.title}
              phone={dict.contact.support.phone}
              email={dict.contact.support.email}
              hours={dict.contact.support.hours}
              align="center"
            />
            <InstagramLink />
          </div>
        </div>
      </div>
      <div className="absolute bottom-10 right-10 z-50 hidden items-center gap-4 md:flex">
        <SupportInfo
          title={dict.contact.support.title}
          phone={dict.contact.support.phone}
          email={dict.contact.support.email}
          hours={dict.contact.support.hours}
          align="right"
        />
        <div className="h-9 w-px bg-neutral-700/60" />
        <InstagramLink />
      </div>
    </section>
  );
}
