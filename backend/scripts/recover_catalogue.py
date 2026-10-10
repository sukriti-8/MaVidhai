
from decimal import Decimal

from sqlalchemy import select

from app.database.connection import SessionLocal
from app.models.category import Category
from app.models.product import Product


CATEGORY = {
    "name": "Sarees",
    "slug": "sarees",
}

PRODUCT = {
    "name": "Handwoven Cotton Saree – Pink & Deep Purple",
    "slug": "handwoven-cotton-saree-pink-deep-purple",
    "price": Decimal("999.00"),
    "mrp": Decimal("1099.00"),
    "description": (
        "Woven paisley rows run across the body, with a checked "
        "pattern in the pallu. Deep purple border with a "
        "traditional peacock design."
    ),
    "material": "100% Cotton",
    "dimensions": "5.5 m saree · No blouse piece",
    "colour": "Rani Pink with Deep Purple Border",
    "stock": 20,
    "availability": True,
    "is_active": True,
    "image_url": "/sarees/saree1.jpeg",
    "images": [
        "/sarees/saree1.jpeg",
        "/sarees/saree2.jpeg",
    ],
}


def recover_catalogue():
    db = SessionLocal()

    try:
        category = db.execute(
            select(Category).where(Category.slug == CATEGORY["slug"])
        ).scalar_one_or_none()

        if category is None:
            category = Category(
                name=CATEGORY["name"],
                slug=CATEGORY["slug"],
                is_active=True,
            )
            db.add(category)
            db.flush()
            print("Created category:", category.slug)
        else:
            print("Category already exists; preserved:", category.slug)

        product = db.execute(
            select(Product).where(Product.slug == PRODUCT["slug"])
        ).scalar_one_or_none()

        if product is not None:
            print("Product already exists; preserved:", product.slug)
            db.rollback()
            print("No product changes were made.")
            return

        product = Product(
            category_id=category.id,
            **PRODUCT,
        )
        db.add(product)
        db.commit()

        print("Saree recovered successfully.")
        print("Category:", category.slug)
        print("Product:", product.slug)
        print("Price: ₹999.00")
        print("MRP: ₹1099.00")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    recover_catalogue()