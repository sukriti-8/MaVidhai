import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.main import app
from tests.test_payments import test_db, auth_headers_user1, auth_headers_user2
from tests.test_admin_categories import super_admin_headers

client = TestClient(app)

def test_admin_dashboard_rbac(auth_headers_user2, super_admin_headers):
    # Anonymous -> 401
    res = client.get("/api/admin/dashboard")
    assert res.status_code == 401

    # CUSTOMER -> 403
    res = client.get("/api/admin/dashboard", headers=auth_headers_user2)
    assert res.status_code == 403

    # SUPER_ADMIN -> 200
    res = client.get("/api/admin/dashboard", headers=super_admin_headers)
    assert res.status_code == 200

def test_admin_dashboard_metrics_structure(test_db: Session, super_admin_headers):
    res = client.get("/api/admin/dashboard", headers=super_admin_headers)
    assert res.status_code == 200
    
    data = res.json()
    assert "period" in data
    assert "metrics" in data
    
    assert "total_revenue" in data["metrics"]
    assert "average_order_value" in data["metrics"]
    assert "total_orders" in data["metrics"]
    assert "new_customers" in data["metrics"]
    assert "returning_customers" in data["metrics"]
    
    assert "inventory_summary" in data
    assert "total_stock" in data["inventory_summary"]
    assert "low_stock_count" in data["inventory_summary"]
    assert "out_of_stock_count" in data["inventory_summary"]
    
    assert "recent_orders" in data
    assert isinstance(data["recent_orders"], list)
    if len(data["recent_orders"]) > 0:
        assert "order_status" in data["recent_orders"][0]
        assert "payment_status" in data["recent_orders"][0]
    
    assert "recent_audits" in data
    assert isinstance(data["recent_audits"], list)

def test_admin_dashboard_date_params(test_db: Session, super_admin_headers):
    # Test default period (30 days)
    res = client.get("/api/admin/dashboard", headers=super_admin_headers)
    data = res.json()
    start = date.fromisoformat(data["period"]["start_date"])
    end = date.fromisoformat(data["period"]["end_date"])
    assert (end - start).days == 29 # 30 days inclusive

    # Test custom period
    start_str = "2026-01-01"
    end_str = "2026-01-10"
    res = client.get(f"/api/admin/dashboard?start_date={start_str}&end_date={end_str}", headers=super_admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["period"]["start_date"] == start_str
    assert data["period"]["end_date"] == end_str
