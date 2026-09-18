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

        "description": (
            "Handwoven cotton saree in Rani pink with a deep "
            "purple border, featuring woven paisley rows across "
            "the body and a checked pattern in the pallu."
        ),

        "details": (
              "Woven paisley rows run across the body, with a "
              "checked pattern in the pallu. Deep purple border "
              "with a traditional peacock design."
          ),

        "material": "100% Cotton",
        "dimensions": "5.5 m",
        "colour": "Rani Pink with Deep Purple",
       

        "availability": True,
        "stock": 20,

        "image_url": "/sarees/saree-1.png",
    },

    {
        "slug": "rope-storage-basket",
        "name": "Rope Storage Basket",
        "category": "Home & Living",

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

        # We will add the actual image URL later.
        "image_url": None,
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

        # ----------------------------------------------------
        # 1. REMOVE OLD PRODUCTS
        # ----------------------------------------------------

        existing_products = db.execute(
            select(Product)
        ).scalars().all()

        print(
            f"\nExisting products found: "
            f"{len(existing_products)}"
        )

        for product in existing_products:
            db.delete(product)

        db.commit()

        print(
            f"Old products removed: "
            f"{len(existing_products)}"
        )

        # ----------------------------------------------------
        # 2. REMOVE OLD CATEGORIES
        # ----------------------------------------------------

        existing_categories = db.execute(
            select(Category)
        ).scalars().all()

        print(
            f"Existing categories found: "
            f"{len(existing_categories)}"
        )

        for category in existing_categories:
            db.delete(category)

        db.commit()

        print(
            f"Old categories removed: "
            f"{len(existing_categories)}"
        )

        # ----------------------------------------------------
        # 3. CREATE THE 3 NEW CATEGORIES
        # ----------------------------------------------------

        category_by_name = {}

        for category_name in CATEGORIES:
            category = Category(
                name=category_name,
                slug=slugify(category_name),
            )

            db.add(category)
            db.commit()
            db.refresh(category)

            category_by_name[category_name] = category

            print(
                f"Created category: "
                f"{category_name}"
            )

        # ----------------------------------------------------
        # 4. CREATE THE 3 NEW PRODUCTS
        # ----------------------------------------------------

        products_created = 0

        for product_data in PRODUCTS:

            category = category_by_name.get(
                product_data["category"]
            )

            if not category:
                print(
                    f"WARNING: Category "
                    f"'{product_data['category']}' "
                    f"not found for "
                    f"'{product_data['name']}'"
                )
                continue

            product = Product(
                category_id=category.id,

                name=product_data["name"],
                slug=product_data["slug"],

                price=product_data["price"],

                description=product_data.get(
                    "description"
                ),

                details=product_data.get(
                    "details"
                ),

                material=product_data.get(
                    "material"
                ),

                dimensions=product_data.get(
                    "dimensions"
                ),

                colour=product_data.get(
                    "colour"
                ),

                care=product_data.get(
                    "care"
                ),

                badge=product_data.get(
                    "badge"
                ),

                availability=product_data.get(
                    "availability",
                    True,
                ),

                stock=product_data.get(
                    "stock",
                    0,
                ),

                image_url=product_data.get(
                    "image_url"
                ),
            )

            db.add(product)
            products_created += 1

            print(
                f"Created product: "
                f"{product_data['name']}"
            )

        db.commit()

        # ----------------------------------------------------
        # 5. VERIFY DATABASE
        # ----------------------------------------------------

        final_categories = db.execute(
            select(Category)
        ).scalars().all()

        final_products = db.execute(
            select(Product)
        ).scalars().all()

        print("\n========================================")
        print("CATALOG SEED COMPLETED")
        print("========================================")

        print(
            f"Categories in DB: "
            f"{len(final_categories)}"
        )

        print(
            f"Products created: "
            f"{products_created}"
        )

        print(
            f"Products in DB: "
            f"{len(final_products)}"
        )

        print("\nFINAL CATALOG:")

        for product in final_products:
            category = db.execute(
                select(Category).where(
                    Category.id == product.category_id
                )
            ).scalar_one_or_none()

            print(
                f"- {category.name} "
                f"-> {product.name} "
                f"-> ₹{product.price}"
            )

        print("\nNo old products remain.")
        print("No extra categories remain.")
        print("No extra toy products were added.")

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