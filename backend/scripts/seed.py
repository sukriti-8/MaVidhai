import os
import sys

# Add the backend directory to sys.path so we can import 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database.connection import SessionLocal
from app.models.category import Category
from app.models.product import Product

def slugify(text: str) -> str:
    return text.lower().replace(" ", "-")

CATEGORIES = [
  "Living",
  "Kitchen",
  "Decor",
  "Personal Care",
  "Gifting",
  "Clothing"
]

PRODUCTS = [
  {
    "slug": "handcrafted-brass-lamp",
    "name": "Handcrafted Brass Lamp",
    "category": "Living",
    "price": 2499,
    "description": "A thoughtfully crafted brass lamp that brings warmth, character and a touch of heritage into your space.",
    "material": "Brass",
    "dimensions": "12 × 8 inches",
  },
  {
    "slug": "handwoven-table-runner",
    "name": "Handwoven Table Runner",
    "category": "Decor",
    "price": 1299,
  },
  {
    "slug": "artisan-ceramic-mug",
    "name": "Artisan Ceramic Mug",
    "category": "Kitchen",
    "price": 699,
  },
  {
    "slug": "heritage-candle-set",
    "name": "Heritage Candle Set",
    "category": "Living",
    "price": 999,
  },
  {
    "slug": "natural-body-care-set",
    "name": "Natural Body Care Set",
    "category": "Personal Care",
    "price": 1599,
  },
  {
    "slug": "artisan-gift-box",
    "name": "Artisan Gift Box",
    "category": "Gifting",
    "price": 1899,
  },
  {
    "slug": "handcrafted-cotton-kurta",
    "name": "Handcrafted Cotton Kurta",
    "category": "Clothing",
    "price": 2199,
  },
  {
    "slug": "wooden-serving-tray",
    "name": "Handcrafted Wooden Tray",
    "category": "Kitchen",
    "price": 1499,
  },
  {
    "slug": "woven-storage-basket",
    "name": "Woven Storage Basket",
    "category": "Living",
    "price": 1199,
  },
  {
    "slug": "hand-painted-vase",
    "name": "Hand-Painted Ceramic Vase",
    "category": "Decor",
    "price": 1799,
  },
  {
    "slug": "wellness-gifting-set",
    "name": "Wellness Gifting Set",
    "category": "Gifting",
    "price": 2299,
  },
  {
    "slug": "everyday-handloom-shirt",
    "name": "Everyday Handloom Shirt",
    "category": "Clothing",
    "price": 1999,
  }
]

def seed_database():
    db: Session = SessionLocal()
    try:
        print("Seeding MaVidhai catalog...")
        
        # 1. Seed Categories
        category_by_slug = {}
        for cat_name in CATEGORIES:
            cat_slug = slugify(cat_name)
            cat = db.execute(select(Category).where(Category.slug == cat_slug)).scalar_one_or_none()
            if not cat:
                cat = Category(name=cat_name, slug=cat_slug)
                db.add(cat)
                db.commit()
                db.refresh(cat)
            category_by_slug[cat_name] = cat
        
        print(f"Categories: {len(category_by_slug)}")
        
        # 2. Seed Products
        products_seeded = 0
        for p_data in PRODUCTS:
            product = db.execute(select(Product).where(Product.slug == p_data["slug"])).scalar_one_or_none()
            if not product:
                cat = category_by_slug.get(p_data["category"])
                if not cat:
                    print(f"Warning: Category {p_data['category']} not found for product {p_data['name']}")
                    continue
                
                product = Product(
                    category_id=cat.id,
                    name=p_data["name"],
                    slug=p_data["slug"],
                    price=p_data["price"],
                    description=p_data.get("description"),
                    material=p_data.get("material"),
                    dimensions=p_data.get("dimensions"),
                    availability=True,
                    image_url=None
                )
                db.add(product)
                products_seeded += 1
                
        if products_seeded > 0:
            db.commit()
            
        total_products = db.execute(select(Product)).scalars().all()
        print(f"Products: {len(total_products)}")
        print("\nCatalog seeding completed successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
