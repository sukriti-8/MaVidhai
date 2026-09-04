# Payment Flow and Architecture

## 1:N Payment Attempt Architecture

A core design decision in MaVidhai is the separation of Orders and Payments. An order can have multiple payment attempts if previous ones fail. Network failures, declined cards, or user cancellations happen frequently. A 1:N architecture allows multiple payment attempts against a single order without polluting the database with duplicate, unpaid orders.

```text
1 ORDER
   │
   ├── Payment Attempt #1 → FAILED
   │
   ├── Payment Attempt #2 → FAILED
   │
   └── Payment Attempt #3 → CAPTURED
                              │
                              ▼
                         CONFIRMED
```

## Transaction State Machine

The checkout and payment verification process follows a strict state machine to guarantee transactional integrity. 

Order creation and payment initialization are separate transactional boundaries. The checkout transaction safely converts the cart into an immutable pending Order and clears the cart atomically. If Razorpay initialization subsequently fails, the Order remains `pending` rather than being corrupted or duplicated. The user can retry payment against the same Order, creating another Payment attempt rather than another Order.

```text
                    CART
                     │
                     ▼
              POST /api/orders
                     │
                     ▼
              ┌──────────────┐
              │    ORDER     │
              │   PENDING    │
              └──────┬───────┘
                     │
                     ▼
          POST /api/payments/create
                     │
                     ▼
              Razorpay Order
                     │
                     ▼
             Razorpay Checkout
                /           \
             failed        success
               │              │
               ▼              ▼
          Payment #1      verifyPayment
            failed             │
                               ▼
                         Payment remains
                           non-final
                               │
                               ▼
                     Razorpay Webhook
                               │
                     ┌─────────┴─────────┐
                     │                   │
              payment.failed     payment.captured
                     │                   │
                     ▼                   ▼
               Payment=failed      Payment=captured
               Order=pending       Order=confirmed
                                         │
                                         ▼
                                  PaymentEvent
                                  idempotency
```
