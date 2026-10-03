from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, Integer, CheckConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("stock >= 0", name="check_stock_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    # Original / list price shown struck through next to `price` when the
    # item is on offer. Null means "no MRP set, just show `price`".
    mrp: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    material: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dimensions: Mapped[str | None] = mapped_column(String(255), nullable=True)
    colour: Mapped[str | None] = mapped_column(String(100), nullable=True)
    care: Mapped[str | None] = mapped_column(String(500), nullable=True)
    badge: Mapped[str | None] = mapped_column(String(100), nullable=True)
    availability: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    image_url: Mapped[str | None] = mapped_column(String(500))
    # Full ordered gallery for the product detail page, e.g.
    # ["/rope-basket/basket-1.jpeg", "/rope-basket/basket-2.jpeg", ...].
    # `image_url` above stays as the single cover photo used on
    # listing/card views so existing code doesn't need to change.
    images: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    category = relationship("Category", back_populates="products")
    inventory_audits = relationship("InventoryAudit", back_populates="product", cascade="all, delete-orphan")