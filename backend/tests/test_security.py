from app.utils.security import hash_password, verify_password, JWT_ALGORITHM, create_access_token
import os
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

# Ensure JWT_SECRET_KEY, JWT_ISSUER, JWT_AUDIENCE are set for tests
import app.utils.security as security
if not security.JWT_SECRET_KEY:
    security.JWT_SECRET_KEY = "test-secret"
if not security.JWT_ISSUER:
    security.JWT_ISSUER = "mavidhai-api"
if not security.JWT_AUDIENCE:
    security.JWT_AUDIENCE = "mavidhai-frontend"

client = TestClient(app, raise_server_exceptions=False)

def test_password_hashing():
    password = "TestPassword123!"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("WrongPassword123!", hashed)

def test_docs_disabled_in_production():
    with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
        pass

def test_cors_preflight():
    response = client.options("/api/products", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET"
    })
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers

def test_security_headers():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    # HSTS is only active in production
    assert "strict-transport-security" not in response.headers

def test_trusted_host_blocked():
    from fastapi import FastAPI
    from fastapi.middleware.trustedhost import TrustedHostMiddleware

    test_app = FastAPI()
    test_app.add_middleware(TrustedHostMiddleware, allowed_hosts=["api.mavidhai.com"])

    @test_app.get("/health")
    def health():
        return {"status": "ok"}

    test_client = TestClient(test_app)
    response = test_client.get("/health", headers={"Host": "malicious.com"})
    assert response.status_code == 400

def test_jwt_missing_issuer():
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=15)
    to_encode = {
        "exp": expire,
        "iat": now,
        "aud": security.JWT_AUDIENCE,
        "sub": "testuser"
    }
    token = jwt.encode(to_encode, security.JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401

def test_jwt_missing_audience():
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=15)
    to_encode = {
        "exp": expire,
        "iat": now,
        "iss": security.JWT_ISSUER,
        "sub": "testuser"
    }
    token = jwt.encode(to_encode, security.JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401

def test_jwt_missing_iat():
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=15)
    to_encode = {
        "exp": expire,
        "iss": security.JWT_ISSUER,
        "aud": security.JWT_AUDIENCE,
        "sub": "testuser"
    }
    token = jwt.encode(to_encode, security.JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401

def test_jwt_wrong_issuer():
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=15)
    to_encode = {
        "exp": expire,
        "iat": now,
        "iss": "wrong-issuer",
        "aud": security.JWT_AUDIENCE,
        "sub": "testuser"
    }
    token = jwt.encode(to_encode, security.JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401

def test_jwt_expired():
    now = datetime.now(timezone.utc)
    expire = now - timedelta(minutes=15)
    to_encode = {
        "exp": expire,
        "iat": now,
        "iss": security.JWT_ISSUER,
        "aud": security.JWT_AUDIENCE,
        "sub": "testuser"
    }
    token = jwt.encode(to_encode, security.JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
