import { useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/translations";
import { FLAGS } from "./flags";
import { useDismiss } from "./useDismiss";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useDismiss(open, rootRef, () => setOpen(false));

  const others = LANGUAGES.filter((l) => l.code !== language);
  const flagClass = "h-4 w-6 rounded-[3px] object-cover shadow-[0_1px_4px_rgba(0,0,0,0.55)]";
  const ActiveFlag = FLAGS[language];

  return (
    <div
      ref={rootRef}
      className="fixed right-4 top-4 z-50 flex items-center gap-2 md:right-6 md:top-6"
    >
      {open &&
        others.map(({ code, label }) => {
          const Flag = FLAGS[code];
          return (
            <button
              key={code}
              type="button"
              title={label}
              aria-label={label}
              onClick={() => {
                setLanguage(code);
                setOpen(false);
              }}
              className="opacity-90 transition-transform duration-200 hover:scale-110 hover:opacity-100"
            >
              <Flag className={flagClass} />
            </button>
          );
        })}

      <button
        type="button"
        aria-expanded={open}
        aria-label="Language"
        onClick={() => setOpen((o) => !o)}
        className="transition-transform duration-200 hover:scale-110"
      >
        <ActiveFlag className={`${flagClass} ring-2 ring-white/80`} />
      </button>
    </div>
  );
}
