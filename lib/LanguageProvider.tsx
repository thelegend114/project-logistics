"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { Language } from "./translations";
import { translations } from "./translations";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: typeof translations[Language];
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>("EN");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("project-language");

    if (savedLanguage === "EN" || savedLanguage === "ES") {
      setLanguageState(savedLanguage);
    }
  }, []);

  function setLanguage(newLanguage: Language) {
    setLanguageState(newLanguage);
    localStorage.setItem("project-language", newLanguage);
  }

  const t = translations[language];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}