from typing import Union
from pydantic import BaseModel, Field, ConfigDict, model_validator


class TranslationRequest(BaseModel):
    text: str | None = Field(default=None, min_length=1, max_length=500)
    texts: list[str] | None = Field(default=None, min_length=1, max_length=20)
    target_language: str = Field(..., min_length=2, max_length=2)
    source_language: str = Field(default="en", min_length=2, max_length=2)

    @model_validator(mode='after')
    def check_text_or_texts(self):
        has_text = self.text is not None
        has_texts = self.texts is not None
        if has_text and has_texts:
            raise ValueError("Cannot provide both text and texts")
        if not has_text and not has_texts:
            raise ValueError("Either text or texts must be provided")
        return self

    @property
    def normalized_texts(self) -> list[str]:
        if self.text is not None:
            return [self.text]
        if self.texts is not None:
            return self.texts
        return []

    @property
    def resolved_target_language(self) -> str:
        return self.target_language.lower()

    model_config = ConfigDict(extra="forbid")


class SingleTranslationResponse(BaseModel):
    source_language: str
    target_language: str
    translated_text: str

class BatchTranslationResponse(BaseModel):
    source_language: str
    target_language: str
    translations: list[str]

TranslationResponse = Union[SingleTranslationResponse, BatchTranslationResponse]
