import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.category import Category
from tests.test_payments import test_db, auth_headers_user1, auth_headers_user2
from tests.test_admin_categories import super_admin_headers

client = TestClient(app)

def test_admin_audit_log_retrieval(super_admin_headers, test_db, auth_headers_user1):
    # Need to create a sample category manually or use the existing ones from seed?
    # Seed creates 6 categories. Let's just create one.
    import uuid
    unique_slug = f"audit-cat-{uuid.uuid4().hex[:8]}"
    sample_category = Category(name=f"Audit Cat {uuid.uuid4().hex[:8]}", slug=unique_slug, is_active=True)
    test_db.add(sample_category)
    test_db.commit()
    test_db.refresh(sample_category)
    
    # Trigger an audit event (update category)
    response = client.put(
        f"/api/admin/categories/{sample_category.id}",
        json={"name": "Updated Category Audit"},
        headers=super_admin_headers
    )
    assert response.status_code == 200
    
    # Retrieve audit logs
    audit_response = client.get(
        "/api/admin/audit",
        headers=super_admin_headers
    )
    assert audit_response.status_code == 200
    
    data = audit_response.json()
    assert data["total"] >= 1
    
    # Verify the specific event is present
    found_event = None
    for item in data["items"]:
        if item["action"] == "CATEGORY_UPDATED" and item["entity_id"] == str(sample_category.id):
            found_event = item
            break
            
    assert found_event is not None
    assert found_event["entity_type"] == "CATEGORY"
    assert "request" in found_event["details"]

def test_admin_audit_access_denied_for_customer(auth_headers_user1):
    response = client.get(
        "/api/admin/audit",
        headers=auth_headers_user1
    )
    assert response.status_code == 403
