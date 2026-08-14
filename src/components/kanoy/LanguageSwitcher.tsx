import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/translations";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language"
      className="fixed right-4 top-4 z-50 flex items-center gap-1 rounded-full border border-white/15 bg-transparent p-1 md:right-6 md:top-6"
    >
      {LANGUAGES.map(({ code, label, flag }) => {
        const active = language === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            title={label}
            onClick={() => setLanguage(code)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition-colors duration-300 ${
              active ? "bg-accent text-ink" : "text-white/70 hover:text-white"
            }`}
          >
            <span className="text-sm leading-none">{flag}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
