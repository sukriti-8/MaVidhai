from app.integrations.google_translation import translate_texts as google_translate_texts

ALLOWED_LANGUAGES = {"te", "hi", "ta", "kn"}


def translate_texts(texts: list[str], target_language: str, source_language: str = "en") -> list[str]:
    if not texts:
        return []

    normalized_target = target_language.lower()
    if normalized_target not in ALLOWED_LANGUAGES:
        raise ValueError(f"Unsupported target language: {normalized_target}")

    cleaned_texts = [text.strip() for text in texts if isinstance(text, str) and text.strip()]
    if not cleaned_texts:
        return []

    try:
        return google_translate_texts(cleaned_texts, normalized_target, source_language=source_language)
    except ValueError:
        raise
    except Exception as exc:  # pragma: no cover - integration boundary
        raise RuntimeError("Google translation failed") from exc
