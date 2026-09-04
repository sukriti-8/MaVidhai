# Security Implementations

MaVidhai implements several critical security boundaries to ensure transaction integrity and user isolation.

## Server-Authoritative Pricing
The frontend is untrusted. MaVidhai therefore never accepts the frontend's price or total as authoritative. During checkout, the backend reloads the current product prices from PostgreSQL and calculates each OrderItem subtotal and the final order total server-side.

## JWT Authentication and User Isolation
User identity is derived from the validated JWT on the backend rather than from a client-supplied `user_id`. Every user-specific query is scoped to the authenticated user's ID. For example, an order lookup requires both the requested order number and the authenticated user ID to match.

*(Note: The current frontend stores the JWT in localStorage. A future production hardening step would be moving authentication to secure, HttpOnly, SameSite cookies to reduce token exposure to client-side JavaScript.)*

## Razorpay Signature Verification
Razorpay signs the raw webhook payload. We therefore verify the HMAC against the exact request bytes before parsing the JSON. This avoids verifying a reconstructed representation rather than the payload that was actually signed.

The frontend payment callback is not sufficient to finalize an order because the browser is not the authoritative payment system. MaVidhai verifies the checkout response, but deliberately leaves the Order pending. The authoritative state transition to `confirmed` occurs only after a valid Razorpay `payment.captured` webhook has been signature-verified and matched against our stored Payment record.

## Webhook Idempotency
The webhook handler records Razorpay's unique event ID in `PaymentEvent`. A unique database constraint creates a durable idempotency boundary. If Razorpay retries the same event, the existing event is detected and the state transition is not executed again.

## Transaction-Safe Checkout
Order creation and payment initialization are separate transactional boundaries. The checkout transaction safely converts the cart into an immutable pending Order and clears the cart atomically. If Razorpay initialization subsequently fails, the Order remains `pending` rather than being corrupted or duplicated. 

## Additional Protections
- **Secret Separation**: Environment variables separate configuration from code.
- **CORS**: Explicit CORS configuration limits cross-origin access.
- **PostgreSQL Constraints**: Enforces data integrity at the database level.
