from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class InventoryAudit(Base):
    __tablename__ = "inventory_audit"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    
    adjustment_type = Column(String(50), nullable=False, index=True)
    previous_stock = Column(Integer, nullable=False)
    adjustment = Column(Integer, nullable=False)
    new_stock = Column(Integer, nullable=False)
    reason = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    __table_args__ = (
        CheckConstraint("adjustment != 0", name="check_adjustment_not_zero"),
        CheckConstraint("previous_stock >= 0", name="check_previous_stock_non_negative"),
        CheckConstraint("new_stock >= 0", name="check_new_stock_non_negative"),
    )

    product = relationship("Product", back_populates="inventory_audits")
    admin = relationship("User", foreign_keys=[admin_id])
    order = relationship("Order", foreign_keys=[order_id])
