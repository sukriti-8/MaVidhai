# MaVidhai — Production Readiness & Engineering Report

MaVidhai is a full-stack, transactional e-commerce platform built as an internship project demonstrating secure, server-authoritative commerce flows, robust payment state machines, and API-driven design.

## Architecture

```text
                         ┌─────────────────────┐
                         │      Next.js        │
                         │                     │
                         │ Shop                │
                         │ Product Details     │
                         │ Cart                │
                         │ Wishlist            │
                         │ Checkout            │
                         │ Orders              │
                         └──────────┬──────────┘
                                    │
                              REST API / JWT
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      FastAPI        │
                         │                     │
                         │ Auth                │
                         │ Catalog             │
                         │ Cart                │
                         │ Wishlist            │
                         │ Orders              │
                         │ Payments            │
                         │ Webhooks            │
                         └──────┬────────┬─────┘
                                │        │
                         SQLAlchemy      │ Razorpay
                                │        │
                                ▼        ▼
                         ┌──────────┐  ┌──────────┐
                         │PostgreSQL│  │ Razorpay │
                         └──────────┘  └──────────┘
```

## Key Technical Decisions

1. **Server-authoritative pricing:** The frontend never determines the final payable amount. The backend calculates order totals from the trusted database catalog during the checkout transaction.
2. **Immutable order snapshots:** Historical orders remain accurate and readable even if products are deleted or change in price later.
3. **Payment attempts are separate from orders (1:N):** Failed payments can be safely retried without creating duplicate orders or duplicate database state.
4. **Webhook idempotency:** Duplicate Razorpay provider events are safely ignored and don't cause duplicate state transitions or application crashes.
5. **Transaction-safe checkout:** Cart-to-order conversion is atomic and will completely roll back if any step fails.

## Production Readiness

**P0 production-readiness audit passed; live Razorpay E2E and deployment verification pending.**

```text
Production Readiness
────────────────────────────────

Core application:         ✅ Verified
Backend tests:            ✅ 50/50 passing
Frontend build:           ✅ Passing
Database migrations:      ✅ Synchronized
Authentication:           ✅ Verified
Authorization:            ✅ Verified
Payments:                 ✅ Automated tests verified
Webhooks:                 ✅ Local boundary verified
Payment retry:            ✅ Verified
Real Razorpay E2E:        ⚠ Pending
Production deployment:    ⚠ Pending
```

## Setup & Local Development

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/Scripts/activate # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### 2. Frontend (Next.js)
```bash
npm install
npm run dev
```
