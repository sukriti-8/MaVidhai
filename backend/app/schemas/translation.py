from pydantic import BaseModel, Field, ConfigDict


class TranslationRequest(BaseModel):
    text: str | None = Field(default=None, min_length=1, max_length=500)
    texts: list[str] | None = Field(default=None, min_length=1, max_length=20)
    target_language: str = Field(..., min_length=2, max_length=2)
    source_language: str = Field(default="en", min_length=2, max_length=2)

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


class TranslationResponse(BaseModel):
    source_language: str
    target_language: str
    translated_text: str | None = None
    translations: list[str] | None = None
