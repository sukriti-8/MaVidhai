from fastapi import APIRouter, HTTPException, status

from app.schemas.translation import TranslationRequest, TranslationResponse
from app.services import translation_service

router = APIRouter(prefix="/api", tags=["translation"])


@router.post("/translation", response_model=TranslationResponse, status_code=status.HTTP_200_OK)
def translate(request: TranslationRequest):
    if not request.text and not request.texts:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Either text or texts must be provided")

    if request.text is not None and len(request.text) > 500:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Text exceeds 500 characters")

    if request.texts is not None:
        if len(request.texts) > 20:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Maximum 20 strings per request")
        for item in request.texts:
            if len(item) > 500:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Text exceeds 500 characters")

    try:
        payload_texts = request.normalized_texts
        translated = translation_service.translate_texts(
            payload_texts,
            request.resolved_target_language,
            request.source_language,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Google translation failed") from exc

    if request.text is not None:
        return {
            "source_language": request.source_language,
            "target_language": request.resolved_target_language,
            "translated_text": translated[0] if translated else "",
        }

    return {
        "source_language": request.source_language,
        "target_language": request.resolved_target_language,
        "translations": translated,
    }
