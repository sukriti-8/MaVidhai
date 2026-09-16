from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_product_list_contains_stock_and_category():
    response = client.get("/api/products?page=1&limit=20")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] >= 12
    assert len(data["items"]) >= 12

    for product in data["items"]:
        assert "slug" in product
        assert "stock" in product
        assert isinstance(product["stock"], int)
        assert "availability" in product
        assert isinstance(product["availability"], bool)

        assert "category" in product
        assert product["category"] is not None

        assert "id" in product["category"]
        assert "name" in product["category"]
        assert "slug" in product["category"]


def test_product_detail_contains_stock_and_category():
    response = client.get(
        "/api/products/handcrafted-brass-lamp"
    )

    assert response.status_code == 200

    product = response.json()

    assert product["slug"] == "handcrafted-brass-lamp"
    assert product["stock"] == 20
    assert product["availability"] is True

    assert product["category"] is not None
    assert product["category"]["name"] == "Living"
    assert product["category"]["slug"] == "living"


def test_product_detail_not_found():
    response = client.get(
        "/api/products/does-not-exist"
    )

    assert response.status_code == 404


def test_product_search_by_name():
    response = client.get("/api/products?search=lamp")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] >= 1

    for product in data["items"]:
        assert "lamp" in product["name"].lower()


def test_product_search_is_case_insensitive():
    response = client.get("/api/products?search=LAMP")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] >= 1

    for product in data["items"]:
        assert "lamp" in product["name"].lower()


def test_product_search_respects_pagination():
    response = client.get(
        "/api/products?search=lamp&page=1&limit=1"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["limit"] == 1
    assert len(data["items"]) <= 1


def test_product_search_combined_with_availability():
    response = client.get(
        "/api/products?search=lamp&available=true"
    )

    assert response.status_code == 200

    data = response.json()

    for product in data["items"]:
        assert "lamp" in product["name"].lower()
        assert product["availability"] is True


def test_product_search_no_results():
    response = client.get(
        "/api/products?search=product-that-does-not-exist"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 0
    assert data["items"] == []
    assert data["pages"] == 0


def test_product_search_by_description():
    response = client.get(
        "/api/products?search=heritage"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] >= 1

    slugs = {product["slug"] for product in data["items"]}

    assert "handcrafted-brass-lamp" in slugs
