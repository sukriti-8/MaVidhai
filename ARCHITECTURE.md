# MaVidhai Architecture

```text
                    ┌─────────────────────┐
                    │     Next.js 16      │
                    │  MaVidhai Frontend  │
                    └──────────┬──────────┘
                               │ REST / JWT
                               ▼
                    ┌─────────────────────┐
                    │     FastAPI API     │
                    ├─────────────────────┤
                    │ Auth                │
                    │ Catalog             │
                    │ Cart / Wishlist    │
                    │ Orders              │
                    │ Payments            │
                    │ Webhooks            │
                    └──────────┬──────────┘
                               │ SQLAlchemy
                               ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    │                     │
                    │ Products            │
                    │ Cart / Wishlist     │
                    │ Orders / Items      │
                    │ Payments            │
                    │ Payment Events      │
                    └─────────────────────┘
                               ▲
                               │
                    ┌──────────┴──────────┐
                    │      Razorpay       │
                    │ Checkout + Webhooks │
                    └─────────────────────┘
```

## Data Flow
- **Next.js** handles the user interface and routing. It communicates with the backend via REST APIs, passing JWT tokens for authentication.
- **FastAPI** provides the core business logic, validation, and database interactions using SQLAlchemy.
- **PostgreSQL** is the single source of truth for pricing, order snapshots, and idempotency state. A PostgreSQL-backed cart provides persistent, cross-device state and allows the server to enforce ownership, validate products, and calculate authoritative cart totals.
- **Razorpay** handles payment processing, redirecting the user back to the application and sending asynchronous webhooks to confirm capture.
