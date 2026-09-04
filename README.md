<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
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
>>>>>>> origin/backend-development
