import os

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_whatsapp_webhook_verification_success(monkeypatch):
    monkeypatch.setenv(
        "WHATSAPP_VERIFY_TOKEN",
        "test_whatsapp_verify_token",
    )

    response = client.get(
        "/api/whatsapp/webhook",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "test_whatsapp_verify_token",
            "hub.challenge": "123456789",
        },
    )

    assert response.status_code == 200
    assert response.text == "123456789"


def test_whatsapp_webhook_verification_wrong_token(monkeypatch):
    monkeypatch.setenv(
        "WHATSAPP_VERIFY_TOKEN",
        "test_whatsapp_verify_token",
    )

    response = client.get(
        "/api/whatsapp/webhook",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "wrong_token",
            "hub.challenge": "123456789",
        },
    )

    assert response.status_code == 403


def test_whatsapp_webhook_receives_message():
    payload = {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "changes": [
                    {
                        "value": {
                            "messages": [
                                {
                                    "from": "919999999999",
                                    "id": "wamid.TEST123",
                                    "type": "text",
                                    "text": {
                                        "body": "Hi",
                                    },
                                }
                            ]
                        }
                    }
                ]
            }
        ],
    }

    response = client.post(
        "/api/whatsapp/webhook",
        json=payload,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "received"
