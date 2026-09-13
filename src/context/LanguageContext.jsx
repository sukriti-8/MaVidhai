"use client";

import { createContext, useContext, useEffect, useState } from "react";

const LANGUAGE_STORAGE_KEY = "mavidhai_language";

const LANGUAGES = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
  ta: "தமிழ்",
  kn: "ಕನ್ನಡ",
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (savedLanguage && LANGUAGES[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (newLanguage) => {
    if (!LANGUAGES[newLanguage]) return;

    setLanguage(newLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        languages: LANGUAGES,
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