# 3-Minute Demo Walkthrough

## Act 1 — Catalog
1. Navigate from **Home** to **Shop**.
2. Filter products.
3. View **Product details**.
*Talking Point:* Emphasize that products are coming from PostgreSQL rather than frontend mock data.

## Act 2 — Commerce
1. **Login** to the system.
2. Add a product to the **Cart** and **Wishlist**.
3. View the **Cart** and change item quantities.
*Talking Point:* Note how the Navbar dynamically synchronizes with the server state.

## Act 3 — Checkout
1. Proceed from **Cart** to **Checkout**.
2. Explain the **Order creation** step.
3. Arrive at **Razorpay Checkout**.
*Talking Point:* The frontend is untrusted. MaVidhai therefore never accepts the frontend's price or total as authoritative. During checkout, the backend reloads the current product prices from PostgreSQL and calculates each OrderItem subtotal and the final order total server-side.

## Act 4 — Failure + Retry
1. Simulate a **Payment Attempt #1** and intentionally fail it.
2. Observe the order remains **PENDING**.
3. Click **Pay Again**.
4. Simulate **Payment Attempt #2** and successfully capture it.
5. Observe the order transitions to **CONFIRMED**.
*Talking Point:* A failed payment does not create another order. It creates another payment attempt against the same order. Order creation and payment initialization are separate transactional boundaries.

## Act 5 — Historical Integrity
1. View the **Order detail** page.
*Talking Point:* The order stores product names, unit prices, quantities, shipping, and totals as an immutable historical snapshot. If a product's price changes or it is deleted from the catalog next month, the historical order must still accurately reflect what the user bought and how much they paid at the time of purchase.
