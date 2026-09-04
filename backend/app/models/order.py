from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, nullable=False, default="pending")
    subtotal = Column(Numeric(10, 2), nullable=False)
    shipping_amount = Column(Numeric(10, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, nullable=False, default="INR")
    
    shipping_full_name = Column(String, nullable=False)
    shipping_email = Column(String, nullable=False)
    shipping_phone = Column(String, nullable=False)
    shipping_address_line1 = Column(String, nullable=False)
    shipping_address_line2 = Column(String, nullable=True)
    shipping_city = Column(String, nullable=False)
    shipping_state = Column(String, nullable=False)
    shipping_postal_code = Column(String, nullable=False)
    shipping_country = Column(String, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    user = relationship("User")

    __table_args__ = (
        CheckConstraint("subtotal >= 0", name="check_order_subtotal_positive"),
        CheckConstraint("shipping_amount >= 0", name="check_order_shipping_positive"),
        CheckConstraint("discount_amount >= 0", name="check_order_discount_positive"),
        CheckConstraint("total_amount >= 0", name="check_order_total_positive"),
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    
    # Historical snapshot fields
    product_name = Column(String, nullable=False)
    product_slug = Column(String, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

    __table_args__ = (
        CheckConstraint("quantity >= 1", name="check_orderitem_quantity_positive"),
        CheckConstraint("unit_price >= 0", name="check_orderitem_price_positive"),
        CheckConstraint("subtotal >= 0", name="check_orderitem_subtotal_positive"),
    )
