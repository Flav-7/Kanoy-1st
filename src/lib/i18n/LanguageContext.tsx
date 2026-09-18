import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LANGUAGE, translations, type Dictionary, type Language } from "./translations";

const STORAGE_KEY = "kanoy-lang";
const SUPPORTED: Language[] = ["pt", "es", "en"];

function detectLanguage(): Language {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of candidates) {
    const code = raw?.slice(0, 2).toLowerCase();
    if (code === "es") return "es";
    if (code === "en") return "en";
    if (code === "pt") return "pt";
  }
  return DEFAULT_LANGUAGE;
}

/** The visitor's stored choice if there is one, otherwise their browser's
 *  language. Client-only — reads localStorage/navigator. */
export function resolveLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored as Language)) return stored as Language;
  } catch {
    // storage blocked (private mode, etc.) — fall through to detection
  }
  return detectLanguage();
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  dict: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Server + first client render always start in Portuguese so there is no
  // hydration mismatch; auto-detection kicks in right after mount.
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLanguageState(resolveLanguage());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dict: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
