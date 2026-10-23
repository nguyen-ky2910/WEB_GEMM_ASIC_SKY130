import { createContext, useContext, useState, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import { messages } from "./dictionaries";
import type { MessageKey } from "./dictionaries";
type Language = "en" | "vi";
const Context = createContext<{
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: MessageKey) => string;
} | null>(null);
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, update] = useState<Language>(() =>
    localStorage.getItem("gemm-language") === "vi" ? "vi" : "en",
  );
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo(
    () => ({
      lang,
      setLang: (next: Language) => {
        localStorage.setItem("gemm-language", next);
        document.documentElement.lang = next;
        update(next);
      },
      t: (key: MessageKey) => messages[key][lang === "en" ? 0 : 1],
    }),
    [lang],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("I18nProvider required");
  return ctx;
}
