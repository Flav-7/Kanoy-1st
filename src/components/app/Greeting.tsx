import { useLanguage } from "@/lib/i18n/LanguageContext";
import { APP_COPY } from "./app-i18n";

function greetingKey(hour: number): "morning" | "afternoon" | "evening" {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 20) return "afternoon";
  return "evening";
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.charAt(0) ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase();
}

/**
 * Avatar with initials + "Boa noite, Dinis" + a line below. Without a known
 * person (a fresh install) it just welcomes to KANOY.
 */
export function Greeting({ name, subtitle }: { name: string | null; subtitle: string }) {
  const { language } = useLanguage();
  const t = APP_COPY[language];
  const firstName = name ? (name.split(/\s+/)[0] ?? name) : null;
  return (
    <>
      {name && (
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/10 bg-[#e8f3ff] text-3xl font-medium text-[#3b9cff]">
          {initials(name)}
        </div>
      )}
      <h1 className={`${name ? "mt-6" : "mt-16"} text-2xl font-semibold`}>
        {firstName
          ? `${t.greeting[greetingKey(new Date().getHours())]}, ${firstName}`
          : t.login.welcome}
      </h1>
      <p className="mt-2 text-base text-studio-foreground/85">{subtitle}</p>
    </>
  );
}
