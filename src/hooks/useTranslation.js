"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { translateTexts } from "../services/translation";

export function useTranslation(texts = []) {
  const { language } = useLanguage();

  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Create a stable dependency from the actual text values,
  // not from the array reference.
  const textKey = Array.isArray(texts)
    ? texts
        .filter((text) => typeof text === "string" && text.trim())
        .join("\u0000")
    : "";

  const normalizedTexts = useMemo(() => {
    if (!Array.isArray(texts)) {
      return [];
    }

    return [
      ...new Set(
        texts.filter(
          (text) => typeof text === "string" && text.trim()
        )
      ),
    ];
  }, [textKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadTranslations() {
      if (normalizedTexts.length === 0) {
        setTranslations({});
        setIsTranslating(false);
        return;
      }

      // English is our source language.
      if (language === "en") {
        const englishTranslations = Object.fromEntries(
          normalizedTexts.map((text) => [text, text])
        );

        setTranslations(englishTranslations);
        setIsTranslating(false);
        return;
      }

      setIsTranslating(true);

      try {
        const translatedTexts = await translateTexts(
          normalizedTexts,
          language
        );

        if (cancelled) return;

        const result = {};

        normalizedTexts.forEach((text, index) => {
          result[text] = translatedTexts[index] ?? text;
        });

        setTranslations(result);
      } catch (error) {
        if (cancelled) return;

        console.error("Translation failed:", error);

        // Always fall back to English.
        const fallbackTranslations = Object.fromEntries(
          normalizedTexts.map((text) => [text, text])
        );

        setTranslations(fallbackTranslations);
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    }

    loadTranslations();

    return () => {
      cancelled = true;
    };
  }, [language, textKey, normalizedTexts]);

  const t = useCallback(
    (text) => {
      if (!text) return text;

      return translations[text] ?? text;
    },
    [translations]
  );

  return {
    t,
    language,
    isTranslating,
  };
}