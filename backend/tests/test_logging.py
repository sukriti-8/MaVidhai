import logging
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from app.utils.logging import request_id_context, RequestIdFilter

client = TestClient(app, raise_server_exceptions=False)

class CaptureHandler(logging.Handler):
    """Custom handler to capture log records during tests."""
    def __init__(self):
        super().__init__()
        self.records = []

    def emit(self, record):
        self.records.append(record)

@pytest.fixture(autouse=True)
def capture_logs():
    """Fixture to capture all logs for assertion."""
    handler = CaptureHandler()
    handler.addFilter(RequestIdFilter())
    logger = logging.getLogger()
    logger.addHandler(handler)
    yield handler
    logger.removeHandler(handler)

def test_1_generated_request_id():
    """Test 1: No X-Request-ID provided -> generated UUID in response."""
    response = client.get("/health")
    assert response.status_code == 200
    req_id = response.headers.get("X-Request-ID")
    assert req_id is not None
    assert len(req_id) > 10  # Roughly UUID length

def test_2_preserved_request_id():
    """Test 2: Provided X-Request-ID is preserved."""
    test_id = "test-request-123"
    response = client.get("/health", headers={"X-Request-ID": test_id})
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == test_id

def test_3_logging_context_receives_request_id(capture_logs):
    """Test 3: Request ID reaches the logging context and record."""
    test_id = "test-request-log-ctx"
    response = client.get("/api/products", headers={"X-Request-ID": test_id})
    assert response.status_code == 200
    
    # The middleware should have logged a completion message
    completion_records = [r for r in capture_logs.records if r.getMessage() == "Request completed"]
    assert len(completion_records) > 0
    # Our RequestIdFilter injects `request_id` into the record
    assert getattr(completion_records[-1], "request_id", None) == test_id

def test_4_oversized_request_id_replaced():
    """Test 4: Malformed/oversized IDs are replaced."""
    oversized_id = "a" * 150
    response = client.get("/health", headers={"X-Request-ID": oversized_id})
    assert response.status_code == 200
    req_id = response.headers.get("X-Request-ID")
    assert req_id != oversized_id
    assert len(req_id) < 128

def test_5_health_probes_suppressed(capture_logs):
    """Test 5: /health and /ready don't generate normal INFO access-log noise."""
    capture_logs.records.clear()
    client.get("/health")
    client.get("/ready")
    
    completion_records = [r for r in capture_logs.records if r.getMessage() == "Request completed"]
    # Should be empty because successful health probes are suppressed
    assert len(completion_records) == 0

def test_6_5xx_produces_error_log(capture_logs):
    """Test 6: 5xx request produces an error log containing the request ID."""
    capture_logs.records.clear()
    
    # We patch a route dependency or logic to raise an exception
    with patch("app.database.connection.engine.connect") as mock_connect:
        mock_connect.side_effect = Exception("Simulated DB Failure")
        
        test_id = "test-error-123"
        response = client.get("/api/products", headers={"X-Request-ID": test_id})
        assert response.status_code == 500
        
        # Check that X-Request-ID is still in the response headers!
        assert response.headers.get("X-Request-ID") == test_id
        
        # Check the logs for the unhandled error
        error_records = [r for r in capture_logs.records if r.levelno == logging.ERROR]
        assert len(error_records) > 0
        
        target_record = error_records[-1]
        print(f"Request ID in record: {getattr(target_record, 'request_id', None)}")
        print(f"Request ID in context: {request_id_context.get()}")
        assert getattr(target_record, "request_id", None) == test_id
        assert target_record.exc_info is not None

def test_7_sensitive_fields_not_logged(capture_logs):
    """Test 7: Verify sensitive fields (bodies, query params) aren't dumped into logs."""
    capture_logs.records.clear()
    
    test_id = "test-auth-123"
    # Send a login request
    response = client.post(
        "/api/auth/login",
        data={"username": "test@example.com", "password": "SuperSecretPassword123"},
        headers={"X-Request-ID": test_id}
    )
    
    completion_records = [r for r in capture_logs.records if r.getMessage() == "Request completed"]
    
    if completion_records:
        target_record = completion_records[-1]
        
        # The log should contain path and status, but NO body or password
        log_dict = target_record.__dict__
        assert "SuperSecretPassword123" not in str(log_dict)
        assert "test@example.com" not in str(log_dict)
        
        # We also check that only the explicitly defined safe extra fields are present
        assert "method" in log_dict
        assert "path" in log_dict
        assert "status_code" in log_dict
        assert "duration_ms" in log_dict
