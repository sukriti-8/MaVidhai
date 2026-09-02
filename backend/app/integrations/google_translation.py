import os
from typing import Sequence

SUPPORTED_TARGET_LANGUAGES = {"te", "hi", "ta", "kn"}


def translate_texts(
    texts: Sequence[str],
    target_language: str,
    source_language: str = "en",
) -> list[str]:
    """Translate a batch of strings using Google Cloud Translation v3."""
    if not texts:
        return []

    if target_language not in SUPPORTED_TARGET_LANGUAGES:
        raise ValueError(f"Unsupported target language: {target_language}")

    try:
        from google.cloud import translate_v3
    except ImportError as exc:  # pragma: no cover - depends on environment
        raise RuntimeError("google-cloud-translate package is not installed") from exc

    project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
    if not project_id:
        raise RuntimeError("GOOGLE_CLOUD_PROJECT_ID is not configured")

    location = os.getenv("GOOGLE_CLOUD_LOCATION", "global")

    client = translate_v3.TranslationServiceClient()
    request = {
        "parent": f"projects/{project_id}/locations/{location}",
        "contents": list(texts),
        "mime_type": "text/plain",
        "source_language_code": source_language,
        "target_language_code": target_language,
    }

    response = client.translate_text(request=request)
    return [item.translated_text for item in response.translations]
