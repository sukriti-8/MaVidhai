import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.user import User
from tests.test_payments import test_db, auth_headers_user1, auth_headers_user2
from tests.test_admin_categories import super_admin_headers

client = TestClient(app)

def test_admin_users_rbac(auth_headers_user2, super_admin_headers):
    # Anonymous -> 401
    res = client.get("/api/admin/users")
    assert res.status_code == 401

    # CUSTOMER -> 403
    res = client.get("/api/admin/users", headers=auth_headers_user2)
    assert res.status_code == 403

    # SUPER_ADMIN -> 200
    res = client.get("/api/admin/users", headers=super_admin_headers)
    assert res.status_code == 200

def test_admin_users_list_and_search(test_db: Session, super_admin_headers):
    # Search for an existing user (the super admin)
    res = client.get("/api/admin/users?search=userpay1", headers=super_admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert any("userpay1" in u["email"].lower() for u in data["items"])

def test_admin_update_user(test_db: Session, super_admin_headers):
    # Find user 1
    user1 = test_db.query(User).filter(User.role == "CUSTOMER").first()
    
    # Update profile
    res = client.put(f"/api/admin/users/{user1.id}", json={
        "full_name": "Updated Name"
    }, headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["full_name"] == "Updated Name"
    
    # Update role to SUPER_ADMIN
    res = client.patch(f"/api/admin/users/{user1.id}/role", json={
        "role": "SUPER_ADMIN"
    }, headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["role"] == "SUPER_ADMIN"
    
    # Deactivate user
    res = client.patch(f"/api/admin/users/{user1.id}/status", json={
        "is_active": False
    }, headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["is_active"] is False

def test_admin_cannot_demote_self(test_db: Session, super_admin_headers):
    super_admin = test_db.query(User).filter(User.email == "userpay1@example.com").first()
    
    res = client.patch(f"/api/admin/users/{super_admin.id}/role", json={
        "role": "CUSTOMER"
    }, headers=super_admin_headers)
    assert res.status_code == 400
    assert "demote" in res.json()["detail"].lower()

def test_admin_cannot_deactivate_self(test_db: Session, super_admin_headers):
    super_admin = test_db.query(User).filter(User.email == "userpay1@example.com").first()
    
    res = client.patch(f"/api/admin/users/{super_admin.id}/status", json={
        "is_active": False
    }, headers=super_admin_headers)
    assert res.status_code == 400
    assert "deactivate" in res.json()["detail"].lower()
