from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
import os
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User
from app.integrations import razorpay_client

def create_payment(db: Session, user: User, order_number: str):
    # 1. Get MaVidhai Order and verify ownership
    order = db.query(Order).filter(
        Order.order_number == order_number,
        Order.user_id == user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    # 2. Verify order status
    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot create payment for order with status: {order.status}"
        )
        
    # 3. Prevent duplicate Razorpay Orders
    existing_payment = db.query(Payment).filter(
        Payment.order_id == order.id,
        Payment.status == "created"
    ).first()
    
    amount_paise = int(order.total_amount * Decimal("100"))
    
    if amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order amount must be greater than zero"
        )
    
    if existing_payment:
        provider_order_id = existing_payment.provider_order_id
    else:
        # 4. Create Razorpay Order
        try:
            rzp_order = razorpay_client.create_provider_order(
                amount_paise=amount_paise,
                receipt=order.order_number,
                currency="INR"
            )
            
            # Verify amount from Razorpay
            if rzp_order["amount"] != amount_paise:
                raise Exception("Amount mismatch with payment provider")
                
            provider_order_id = rzp_order["id"]
            
            # 5. Create Payment record
            payment = Payment(
                order_id=order.id,
                provider="razorpay",
                provider_order_id=provider_order_id,
                amount=order.total_amount,
                currency="INR",
                status="created"
            )
            db.add(payment)
            db.commit()
            
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to create payment: {str(e)}"
            )

    key_id = os.getenv("RAZORPAY_KEY_ID", "rzp_test_dummy")
    
    # 6. Return response
    return {
        "order_number": order.order_number,
        "razorpay_order_id": provider_order_id,
        "amount": amount_paise,
        "currency": "INR",
        "key_id": key_id
    }

def verify_payment(db: Session, user: User, data):
    # 1. Verify ownership and get Order
    order = db.query(Order).filter(
        Order.order_number == data.order_number,
        Order.user_id == user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    # 2. Get the Payment and verify provider order ID matches
    payment = db.query(Payment).filter(
        Payment.order_id == order.id,
        Payment.provider_order_id == data.razorpay_order_id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment not found for this order")
        
    # 3. Prevent duplicate verification (Idempotency)
    if payment.provider_payment_id == data.razorpay_payment_id:
        return {
            "status": "success",
            "order_number": order.order_number,
            "message": "Payment already verified"
        }
        
    # 4. Verify the Signature
    is_valid_signature = razorpay_client.verify_signature(
        order_id=data.razorpay_order_id,
        payment_id=data.razorpay_payment_id,
        signature=data.razorpay_signature
    )
    
    if not is_valid_signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment signature")
        
    # 5. Verify the Amount
    provider_payment = razorpay_client.fetch_provider_payment(data.razorpay_payment_id)
    expected_amount_paise = int(payment.amount * Decimal("100"))
    
    if provider_payment.get("amount") != expected_amount_paise:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment amount mismatch")
        
    # 6. Update Payment (but leave Order pending)
    # The signature is verified, meaning the frontend flow completed authentically.
    # However, we leave the status as 'created' (or whatever it was) and let the webhook transition to 'captured'.
    payment.provider_payment_id = data.razorpay_payment_id
    # We could store the signature or additional metadata if we wanted to
    db.commit()
    
    return {
        "status": "success",
        "order_number": order.order_number,
        "message": "Payment submitted successfully"
    }
