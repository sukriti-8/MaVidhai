const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function requestTranslation(payload) {
  const response = await fetch(`${API_BASE_URL}/api/translation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Translation request failed"
    );
  }

  return response.json();
}

/**
 * Translate a single piece of text.
 */
export async function translateText(text, targetLanguage) {
  if (!text?.trim()) {
    return text;
  }

  if (targetLanguage === "en") {
    return text;
  }

  const data = await requestTranslation({
    text,
    target_language: targetLanguage,
  });

  return data.translated_text ?? text;
}

/**
 * Translate multiple pieces of text in one API request.
 */
export async function translateTexts(texts, targetLanguage) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  if (targetLanguage === "en") {
    return texts;
  }

  const validTexts = texts.filter(
    (text) => typeof text === "string" && text.trim()
  );

  if (validTexts.length === 0) {
    return texts;
  }

  const data = await requestTranslation({
    texts: validTexts,
    target_language: targetLanguage,
  });

  const translations = data.translations;

  if (!Array.isArray(translations)) {
    throw new Error("Invalid translation response");
  }

  return translations;
}