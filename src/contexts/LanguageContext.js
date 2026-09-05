"use client";

import React, { createContext, useState, useEffect, useRef, useCallback } from "react";
import { translateTexts } from "@/lib/api";

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [translations, setTranslations] = useState({});
  const pendingRef = useRef(new Set());
  const timeoutRef = useRef(null);
  const fetchedRef = useRef(new Set());

  // Load language from local storage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("mavidhai_lang");
    if (savedLang) {
      setCurrentLanguage(savedLang);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem("mavidhai_lang", currentLanguage);
  }, [currentLanguage]);

  const fetchTranslations = useCallback(async () => {
    if (pendingRef.current.size === 0 || currentLanguage === "en") return;

    const textsToTranslate = Array.from(pendingRef.current);
    pendingRef.current.clear();
    timeoutRef.current = null;

    try {
      const data = await translateTexts(textsToTranslate, currentLanguage);
      if (data.translations && data.translations.length === textsToTranslate.length) {
        setTranslations(prev => {
          const langDict = { ...(prev[currentLanguage] || {}) };
          textsToTranslate.forEach((text, idx) => {
            langDict[text] = data.translations[idx];
            fetchedRef.current.add(`${currentLanguage}:${text}`);
          });
          return { ...prev, [currentLanguage]: langDict };
        });
      }
    } catch (err) {
      console.error("Translation fetch failed:", err);
      // Fails silently, falls back to english
    }
  }, [currentLanguage]);

  const t = useCallback((text) => {
    if (!text || currentLanguage === "en") return text;

    const langDict = translations[currentLanguage] || {};
    if (langDict[text] !== undefined) {
      return langDict[text];
    }

    const cacheKey = `${currentLanguage}:${text}`;
    if (fetchedRef.current.has(cacheKey)) {
        return text; // we already tried and failed, or it's currently fetching, don't spam
    }

    // Queue for translation
    if (!pendingRef.current.has(text)) {
      pendingRef.current.add(text);
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(fetchTranslations, 100);
      }
    }

    return text; // Fallback immediately
  }, [currentLanguage, translations, fetchTranslations]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage: setCurrentLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
