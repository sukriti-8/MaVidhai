import os
import sys
from decimal import Decimal

# Add the backend directory to sys.path so we can import 'app'
sys.path.insert(
    0,
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..")
    ),
)

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.connection import SessionLocal
from app.models.category import Category
from app.models.product import Product


# ============================================================
# HELPERS
# ============================================================

def slugify(text: str) -> str:
    return (
        text.lower()
        .replace(" ", "-")
        .replace("&", "and")
    )


# ============================================================
# CATEGORIES
# ============================================================

CATEGORIES = [
    "Sarees",
    "Home & Living",
    "Toys",
]


# ============================================================
# PRODUCTS
# ============================================================

PRODUCTS = [
    {
        "slug": "handwoven-cotton-saree-pink-deep-purple",
        "name": "Handwoven Cotton Saree – Pink & Deep Purple",
        "category": "Sarees",

        "price": Decimal("999.00"),
        "mrp": Decimal("1099.00"),

        "description": (
            "Woven paisley rows run across the body, with a checked "
            "pattern in the pallu. Deep purple border with a "
            "traditional peacock design."
        ),

        "details": None,

        "material": "100% Cotton",
        "dimensions": "5.5 m saree · No blouse piece",
        "colour": "Rani Pink with Deep Purple Border",
        "care": None,
        "badge": None,

        "availability": True,
        "stock": 20,

        "image_url": "/sarees/saree1.jpeg",
        "images": [
            "/sarees/saree1.jpeg",
            "/sarees/saree2.jpeg",
        ],
    },

    {
        "slug": "rope-storage-basket",
        "name": "Rope Storage Basket",
        "category": "Home & Living",

        # Temporary because founder has not provided the price yet.
        "price": Decimal("0.00"),

        "description": (
            "Cylindrical woven basket with a decorative lion face, "
            "soft white fringe detailing, and a matching removable lid."
        ),
        "details": (
            "Ideal for storing toys, baby essentials, clothes, books, "
            "kids' rooms, bedrooms, or living spaces."
        ),
        "material": "Cotton Rope",
        "dimensions": "Medium — 24 cm (H) × 27 cm (D)",
        "colour": "Red",
        "care": "Wipe clean with a dry or slightly damp cloth. Keep dry.",
        "badge": None,

        "availability": True,
        "stock": 20,

        "image_url": "/rope-basket/basket-1.jpeg",
        "images": [
            "/rope-basket/basket-1.jpeg",
            "/rope-basket/basket-2.jpeg",
            "/rope-basket/basket-3.jpeg",
            "/rope-basket/basket-4.jpeg",
        ],
    },

    {
        "slug": "wooden-toy",
        "name": "Wooden Toy",
        "category": "Toys",

        # Temporary because founder has not provided the price yet.
        "price": Decimal("0.00"),

        "description": None,
        "details": None,
        "material": None,
        "dimensions": None,
        "colour": None,
        "care": None,
        "badge": None,

        "availability": True,
        "stock": 20,

        "image_url": None,
    },
]


# ============================================================
# DATABASE SEED
# ============================================================

def seed_database():
    db: Session = SessionLocal()

    try:
        print("========================================")
        print("MaVidhai Catalog Seed")
        print("========================================")

        # 1. CREATE OR REUSE THE 3 CATEGORIES
        category_by_name = {}

        for category_name in CATEGORIES:
            category_slug = slugify(category_name)

            category = db.execute(
                select(Category).where(Category.slug == category_slug)
            ).scalar_one_or_none()

            if category is None:
                category = Category(
                    name=category_name,
                    slug=category_slug,
                    is_active=True,
                )
                db.add(category)
                db.flush()
                print("Created category:", category_name)
            else:
                print("Reusing category:", category_name)

            category_by_name[category_name] = category

        # 2. CREATE MISSING PRODUCTS; PRESERVE EXISTING PRODUCTS
        for product_data in PRODUCTS:
            existing = db.execute(
                select(Product).where(
                    Product.slug == product_data["slug"]
                )
            ).scalar_one_or_none()

            if existing is not None:
                print("Preserving product:", existing.slug)
                continue

            category = category_by_name[product_data["category"]]

            product = Product(
                category_id=category.id,
                name=product_data["name"],
                slug=product_data["slug"],
                price=product_data["price"],
                mrp=product_data.get("mrp"),
                description=product_data.get("description"),
                details=product_data.get("details"),
                material=product_data.get("material"),
                dimensions=product_data.get("dimensions"),
                colour=product_data.get("colour"),
                care=product_data.get("care"),
                badge=product_data.get("badge"),
                availability=product_data.get("availability", True),
                is_active=True,
                show_in_catalogue=True,
                stock=product_data.get("stock", 20),
                image_url=product_data.get("image_url"),
                images=product_data.get("images"),
            )

            db.add(product)
            print("Added product:", product.slug)

        # 3. COMMIT AND VERIFY
        db.commit()

        final_categories = db.execute(
            select(Category)
        ).scalars().all()

        final_products = db.execute(
            select(Product)
        ).scalars().all()

        print("Categories in DB:", len(final_categories))
        print("Products in DB:", len(final_products))
        print("Catalogue seed completed.")


    except Exception as error:
        db.rollback()

        print("\n========================================")
        print("SEED FAILED")
        print("========================================")
        print(error)

        raise

    finally:
        db.close()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    seed_database()