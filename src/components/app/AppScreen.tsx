import type { ReactNode } from "react";
import kanoyK from "@/assets/branding/kanoy-k.webp";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/translations";

/**
 * Full-screen frame of the installed app's own screens (sign-in, lock, code
 * setup): dark gradient, K logo and language switch on top, safe-area aware,
 * covering the site underneath.
 */
export function AppScreen({ label, children }: { label: string; children: ReactNode }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[100] flex h-dvh flex-col overflow-hidden bg-studio text-studio-foreground"
      style={{
        backgroundImage:
          "radial-gradient(90% 55% at 0% 0%, color-mix(in oklab, var(--accent) 16%, transparent), transparent 70%), linear-gradient(to bottom, #07131c, #04080b)",
        paddingTop: "max(env(safe-area-inset-top), 1rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
      }}
    >
      <header className="flex items-center justify-between px-6 pt-2">
        <img src={kanoyK} alt="KANOY" width={1024} height={1024} className="h-9 w-auto" />
        <div className="flex rounded-full bg-white/[0.06] p-1 text-sm">
          {LANGUAGES.map(({ code, label: name }) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              aria-pressed={language === code}
              className={`rounded-full px-3 py-1.5 ${
                language === code ? "bg-white/10 font-medium" : "text-studio-muted"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </header>
      {children}
    </div>
  );
}
