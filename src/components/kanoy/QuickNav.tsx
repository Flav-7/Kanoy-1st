import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useDismiss } from "./useDismiss";

const SECTION_IDS = ["services", "about", "problem", "process", "pricing", "contact"] as const;

export function QuickNav() {
  const { dict } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  useDismiss(open, rootRef, () => setOpen(false));

  const items = [
    { id: "about", target: "about-title", align: 0.5, label: dict.nav.about, subtitle: dict.about.eyebrow },
    { id: "problem", label: dict.nav.problem, subtitle: dict.problem.eyebrow },
    { id: "services", label: dict.nav.services, subtitle: dict.services.eyebrow },
    { id: "process", label: dict.nav.process, subtitle: dict.process.eyebrow },
    { id: "pricing", label: dict.nav.pricing, subtitle: dict.pricing.eyebrow },
    {
      id: "contact",
      target: "contact-title",
      align: 0.22,
      label: dict.nav.contact,
      subtitle: dict.contact.subtitle,
    },
  ] satisfies {
    id: (typeof SECTION_IDS)[number];
    target?: string;
    align?: number;
    label: string;
    subtitle: string;
  }[];

  const goTo = (item: (typeof items)[number]) => {
    const el = document.getElementById(item.target ?? item.id);
    if (!el) return;
    const align = item.align ?? 0;
    const rect = el.getBoundingClientRect();
    const desiredViewportTop = (window.innerHeight - rect.height) * align;
    const targetTop = rect.top + window.scrollY - desiredViewportTop;
    window.scrollTo({ top: targetTop, behavior: "smooth" });
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`fixed right-2 top-10 z-50 flex flex-col-reverse items-end gap-4 transition-opacity duration-500 md:left-6 md:right-auto md:top-1/2 md:flex-col md:items-start md:-translate-y-1/2 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{ mixBlendMode: "difference" }}
    >
      {open && (
        <ul className="flex flex-col items-end gap-3 md:items-start">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => goTo(item)} className="block text-right md:text-left">
                <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-white">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[9px] uppercase tracking-[0.15em] text-white/60">
                  {item.subtitle}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 flex-col items-start justify-center gap-[6px]"
      >
        <span className="h-[2px] w-6 bg-white" />
        <span className="h-[2px] w-6 bg-white" />
        <span className="h-[2px] w-4 bg-white" />
      </button>
    </div>
  );
}
