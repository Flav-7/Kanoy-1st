/** Small inline SVG flags — avoids relying on the OS/browser's emoji font, which
 * doesn't render flag emoji on every platform (e.g. shows "PT" as plain letters). */
import type { ReactElement } from "react";
import type { Language } from "@/lib/i18n/translations";

type FlagProps = { className?: string };

export function FlagPT({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="40" fill="#d1001f" />
      <rect width="24" height="40" fill="#046a38" />
      <circle cx="24" cy="20" r="7.5" fill="#ffcc00" stroke="#fff" strokeWidth="0.6" />
    </svg>
  );
}

export function FlagES({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="40" fill="#aa151b" />
      <rect y="10" width="60" height="20" fill="#f1bf00" />
    </svg>
  );
}

export function FlagGB({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3.2" />
      <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="13.3" />
      <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8" />
    </svg>
  );
}

export const FLAGS: Record<Language, (props: FlagProps) => ReactElement> = {
  pt: FlagPT,
  es: FlagES,
  en: FlagGB,
};
