from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "mavidhai-api"

def test_ready_check_success():
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "up"

@patch("app.routes.ops.Session.execute")
def test_ready_check_failure(mock_execute):
    mock_execute.side_effect = Exception("DB Connection Failed")
    response = client.get("/ready")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "not_ready"
    assert data["database"] == "down"
    # Ensure the actual exception details are not exposed in the response
    assert "DB Connection Failed" not in response.text
