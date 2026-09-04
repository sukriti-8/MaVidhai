from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_translate_single_text_success():
    with patch("app.services.translation_service.translate_texts", return_value=["మావిధైకి స్వాగతం"]):
        response = client.post(
            "/api/translation",
            json={"text": "Welcome to MaVidhai", "target_language": "te"},
        )

    assert response.status_code == 200
    assert response.json() == {
        "source_language": "en",
        "target_language": "te",
        "translated_text": "మావిధైకి స్వాగతం",
    }


def test_translate_batch_success():
    with patch(
        "app.services.translation_service.translate_texts",
        return_value=["మావిధైకి స్వాగతం", "ఇప్పుడే షాపింగ్ చేయండి", "కార్ట్కు జోడించండి"],
    ):
        response = client.post(
            "/api/translation",
            json={
                "texts": ["Welcome to MaVidhai", "Shop Now", "Add to Cart"],
                "target_language": "te",
            },
        )

    assert response.status_code == 200
    assert response.json() == {
        "source_language": "en",
        "target_language": "te",
        "translations": [
            "మావిధైకి స్వాగతం",
            "ఇప్పుడే షాపింగ్ చేయండి",
            "కార్ట్కు జోడించండి",
        ],
    }


def test_invalid_target_language_rejected():
    response = client.post(
        "/api/translation",
        json={"text": "Welcome", "target_language": "fr"},
    )

    assert response.status_code == 422


def test_empty_payload_rejected():
    response = client.post(
        "/api/translation",
        json={"target_language": "te"},
    )

    assert response.status_code == 422


def test_mutual_exclusion_rejected():
    response = client.post(
        "/api/translation",
        json={
            "text": "Welcome",
            "texts": ["Welcome"],
            "target_language": "te",
        },
    )

    assert response.status_code == 422


def test_text_length_limit_rejected():
    long_text = "A" * 501
    response = client.post(
        "/api/translation",
        json={"text": long_text, "target_language": "te"},
    )

    assert response.status_code == 422


def test_google_api_failure_returns_500():
    with patch("app.services.translation_service.translate_texts", side_effect=RuntimeError("Google API failure")):
        response = client.post(
            "/api/translation",
            json={"text": "Welcome", "target_language": "hi"},
        )

    assert response.status_code == 500
    assert response.json()["detail"] == "Google translation failed"
