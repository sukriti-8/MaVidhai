# MaVidhai

A full-stack, transactional e-commerce platform demonstrating secure, server-authoritative commerce flows and robust payment state machines.

[Demo] [GitHub] [Architecture]

## What is MaVidhai?
MaVidhai is an internship project showcasing a production-ready transactional commerce system. It focuses heavily on engineering depth rather than just frontend styling.

## Key Features
- Full catalog, cart, and wishlist functionality
- Authenticated user isolation
- Immutable order history
- 1:N payment attempt handling

## Engineering Highlights
✓ Server-authoritative pricing
✓ Immutable order snapshots
✓ 1:N payment attempt architecture
✓ Razorpay signature verification
✓ Webhook HMAC verification
✓ Webhook idempotency
✓ Transaction-safe checkout
✓ JWT ownership isolation
✓ PostgreSQL constraints
✓ API-level validation
✓ 50 automated backend tests

## Architecture
See [ARCHITECTURE.md](ARCHITECTURE.md) for the system design and technology flow.

## Payment Architecture
See [PAYMENT_FLOW.md](PAYMENT_FLOW.md) for a detailed breakdown of the Razorpay state machine and order lifecycle.

## Security
See [SECURITY.md](SECURITY.md) for an overview of the security implementations.

## Database Design
- **Products**: Source of truth for catalog and pricing.
- **Cart / Wishlist**: PostgreSQL-backed persistent state.
- **Orders / Items**: Immutable historical snapshots.
- **Payments / Events**: 1:N payment attempts and idempotent webhook logs.

## API Overview
See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for REST endpoint references.

## Testing
The backend is verified by 50 automated tests covering all critical paths, state transitions, and security boundaries.

## Production Readiness
| Area                      | Status                            |
| ------------------------- | --------------------------------- |
| Authentication            | ✅                                 |
| User isolation            | ✅                                 |
| Catalog                   | ✅                                 |
| Filtering                 | ✅                                 |
| Pagination                | ✅                                 |
| Cart                      | ✅                                 |
| Wishlist                  | ✅                                 |
| Orders                    | ✅                                 |
| Historical snapshots      | ✅                                 |
| Payment creation          | ✅                                 |
| Signature verification    | ✅                                 |
| Webhook idempotency       | ✅                                 |
| Payment retries           | ✅                                 |
| Transaction safety        | ✅                                 |
| Database migrations       | ✅                                 |
| Schema drift              | ✅                                 |
| Secret separation         | ✅                                 |
| CORS                      | ✅                                 |
| Backend tests             | **50 passed**                     |
| Frontend production build | ✅                                 |
| Repository hygiene        | ✅                                 |
| Live Razorpay E2E         | ⚠️ **Not independently verified** |

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React, TailwindCSS
- **Backend**: FastAPI, Python, SQLAlchemy, Alembic
- **Database**: PostgreSQL
- **Integrations**: Razorpay

## Local Development
### 1. Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### 2. Frontend
```bash
npm install
npm run dev
```

## Environment Variables
(See `.env.example` in both `backend` and root directories)

## Demo Flow
See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the 3-minute project walkthrough.

## Known Limitations
- JWT tokens are currently stored in `localStorage`. A production hardening step would migrate these to `HttpOnly` cookies.
- Live Razorpay HTTPS webhooks are not independently verified in a production-like environment (local webhook simulator verified the logic).
- Inventory enforcement is not currently implemented.

## Future Improvements
- Migration of JWT to secure cookies
- Real-time inventory tracking and concurrency control
- E2E testing against live Razorpay webhooks
