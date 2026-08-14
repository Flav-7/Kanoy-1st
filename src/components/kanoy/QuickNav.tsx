import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const SECTION_IDS = ["services", "about", "process", "pricing", "contact"] as const;

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

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const items = [
    { id: "services", label: dict.nav.services, subtitle: dict.services.eyebrow },
    { id: "about", label: dict.nav.about, subtitle: dict.about.eyebrow },
    { id: "process", label: dict.nav.process, subtitle: dict.process.eyebrow },
    { id: "pricing", label: dict.nav.pricing, subtitle: dict.pricing.eyebrow },
    { id: "contact", label: dict.nav.contact, subtitle: dict.contact.subtitle },
  ] satisfies { id: (typeof SECTION_IDS)[number]; label: string; subtitle: string }[];

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`fixed right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col items-end gap-4 transition-opacity duration-500 md:right-6 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{ mixBlendMode: "difference" }}
    >
      {open && (
        <ul className="flex flex-col items-end gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => goTo(item.id)} className="block text-right">
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
        className="flex h-9 w-9 flex-col items-end justify-center gap-[6px]"
      >
        <span className="h-[2px] w-6 bg-white" />
        <span className="h-[2px] w-6 bg-white" />
        <span className="h-[2px] w-4 bg-white" />
      </button>
    </div>
  );
}
