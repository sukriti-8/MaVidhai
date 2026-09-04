# API Documentation

## Auth
- `POST /api/auth/register`: Create a new user
- `POST /api/auth/login`: Authenticate and receive JWT

## Catalog
- `GET /api/products`: List products with filtering
- `GET /api/products/{slug}`: Get specific product details
- `GET /api/categories`: List product categories

## Commerce
- `GET /api/cart`: Retrieve current user's cart
- `POST /api/cart`: Add item to cart
- `PUT /api/cart/{item_id}`: Update item quantity
- `DELETE /api/cart/{item_id}`: Remove item from cart
- `GET /api/wishlist`: Retrieve current user's wishlist
- `POST /api/wishlist`: Add item to wishlist

## Orders
- `GET /api/orders`: List user's past orders
- `POST /api/orders`: Convert cart to an immutable pending order
- `GET /api/orders/{orderNumber}`: Retrieve detailed snapshot of a specific order

## Payments
- `POST /api/payments/create`: Initialize a Razorpay payment attempt for a specific order
- `POST /api/payments/verify`: Cryptographically verify frontend payment signature

## Webhooks
- `POST /api/webhooks/razorpay`: Server-to-server webhook endpoint for processing `payment.captured` and `payment.failed` events.
