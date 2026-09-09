import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useDismiss } from "./useDismiss";

/** Line-art fingerprint, drawn as strokes (not a raster mask) so it stays
 *  crisp and readable at the small trigger-button size — a detailed photo
 *  or filled icon just turns into a blob at 24-28px. */
function FingerprintIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </svg>
  );
}

const SECTION_IDS = ["services", "about", "problem", "process", "contact"] as const;

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
    // The section itself starts with a large top padding, so landing on its
    // very top edge (the default align:0) leaves mostly blank space above
    // the fold on short mobile viewports. Skip past most of that padding
    // there only — desktop has the room for it to look fine as-is. Keep
    // some of it (rather than skipping all 128px) so the eyebrow doesn't
    // land directly under the fixed corner logo, which sits ~40px tall.
    { id: "problem", label: dict.nav.problem, subtitle: dict.problem.eyebrow, mobileOffset: 65 },
    { id: "services", label: dict.nav.services, subtitle: dict.services.eyebrow },
    { id: "process", label: dict.nav.process, subtitle: dict.process.eyebrow },
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
    mobileOffset?: number;
    label: string;
    subtitle: string;
  }[];

  const goTo = (item: (typeof items)[number]) => {
    const el = document.getElementById(item.target ?? item.id);
    if (!el) return;
    const align = item.align ?? 0;
    const rect = el.getBoundingClientRect();
    const desiredViewportTop = (window.innerHeight - rect.height) * align;
    let targetTop = rect.top + window.scrollY - desiredViewportTop;
    if (item.mobileOffset && window.innerWidth < 768) targetTop += item.mobileOffset;
    window.scrollTo({ top: targetTop, behavior: "smooth" });
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`fixed right-2 top-20 z-50 flex flex-col-reverse items-end gap-4 transition-opacity duration-500 md:left-6 md:right-auto md:top-1/2 md:flex-col md:items-start md:-translate-y-1/2 ${
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
        className="flex h-9 w-9 items-center justify-center text-white"
      >
        <FingerprintIcon className="h-7 w-7" />
      </button>
    </div>
  );
}
