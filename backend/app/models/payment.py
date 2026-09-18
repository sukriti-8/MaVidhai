from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, JSON, Index, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String, nullable=False) # e.g. "razorpay"
    
    # Razorpay Order ID (e.g. order_xxxx)
    provider_order_id = Column(String, index=True, nullable=False)
    
    # Razorpay Payment ID (e.g. pay_xxxx) - nullable initially until checkout succeeds
    provider_payment_id = Column(String, unique=True, index=True, nullable=True)
    
    status = Column(String, nullable=False, default="created")
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, nullable=False, default="INR")
    
    failure_code = Column(String, nullable=True)
    failure_message = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    order = relationship("Order", backref="payments")


class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id = Column(Integer, primary_key=True, index=True)
    provider_event_id = Column(String, unique=True, index=True, nullable=False)
    event_type = Column(String, nullable=False, index=True)
    payload = Column(JSON, nullable=False)
    
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PaymentRefund(Base):
    __tablename__ = "payment_refunds"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    provider_refund_id = Column(String, unique=True, index=True, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String, nullable=False, default="pending") # pending, completed, failed
    
    failure_code = Column(String, nullable=True)
    failure_message = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    payment = relationship("Payment", backref="refunds")
    admin = relationship("User")

    __table_args__ = (
        Index(
            "ix_payment_refunds_one_pending_per_payment",
            "payment_id",
            unique=True,
            sqlite_where=text("status = 'pending'"),
            postgresql_where=text("status = 'pending'")
        ),
    )
