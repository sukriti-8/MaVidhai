"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  setAuthToken,
} from "@/lib/api";

const colors = {
  ivory: "#F8F6F2",
  white: "#FFFFFF",
  peach: "#F2C9B9",
  terracotta: "#A85838",
  sage: "#A8B39F",
  forest: "#3F5144",
  charcoal: "#1D1D1B",
  muted: "#6F6A63",
  border: "#D9DED4",
  soft: "#F1EDE7",
};

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCart();
      setCart(data);
    } catch (err) {
      if (err.message === "Unauthorized") {
        setAuthToken(null);
        router.push("/login");
      } else {
        console.error(err);
        setError("Failed to load cart");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCart();
  }, [loadCart]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    const item = cart?.items.find((cartItem) => cartItem.id === itemId);

    if (!item) return;

    if (
      newQuantity < 1 ||
      !item.product.availability ||
      item.product.stock <= 0 ||
      newQuantity > item.product.stock
    ) {
      return;
    }

    try {
      setUpdatingId(itemId);
      const updatedCart = await updateCartItem(itemId, newQuantity);
      setCart(updatedCart);
    } catch (err) {
      if (err.message === "Unauthorized") {
        setAuthToken(null);
        router.push("/login");
      } else {
        alert("Failed to update quantity");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      setUpdatingId(itemId);
      const updatedCart = await removeCartItem(itemId);
      setCart(updatedCart);
    } catch (err) {
      if (err.message === "Unauthorized") {
        setAuthToken(null);
        router.push("/login");
      } else {
        alert("Failed to remove item");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: colors.ivory }}
      >
        <p style={{ color: colors.terracotta }}>
          Loading your cart...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center gap-4"
        style={{ backgroundColor: colors.ivory }}
      >
        <p className="text-red-500">{error}</p>

        <button
          onClick={loadCart}
          className="underline transition-colors hover:opacity-70"
          style={{ color: colors.terracotta }}
        >
          Try again
        </button>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main
        className="min-h-screen px-6 py-16 lg:px-10"
        style={{
          backgroundColor: colors.ivory,
          color: colors.charcoal,
        }}
      >
        <div className="mx-auto max-w-[800px] text-center">
          <h1
            className="text-4xl font-bold"
            style={{
              color: colors.charcoal,
              fontFamily: "Georgia, serif",
            }}
          >
            Your cart is empty
          </h1>

          <p
            className="mt-4"
            style={{ color: colors.muted }}
          >
            Discover handcrafted products you&apos;ll love.
          </p>

          <div className="mt-8">
            <Link
              href="/shop"
              className="inline-block rounded-lg px-8 py-3.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                backgroundColor: colors.forest,
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-6 py-10 lg:px-10 lg:py-16"
      style={{
        backgroundColor: colors.ivory,
        color: colors.charcoal,
      }}
    >
      <div className="mx-auto max-w-[1200px]">
        <h1
          className="text-3xl font-bold sm:text-4xl"
          style={{
            color: colors.charcoal,
            fontFamily: "Georgia, serif",
          }}
        >
          Cart
        </h1>

        <p
          className="mt-2"
          style={{ color: colors.muted }}
        >
          Your selected handcrafted products
        </p>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_350px]">

          {/* CART ITEMS */}
          <div>
            <div
              className="hidden grid-cols-[3fr_1fr_1fr] border-b pb-4 text-xs font-medium uppercase tracking-[2px] sm:grid"
              style={{
                borderColor: colors.border,
                color: colors.muted,
              }}
            >
              <div>Product</div>
              <div className="text-center">Quantity</div>
              <div className="text-right">Total</div>
            </div>

            <div
              className="divide-y"
              style={{
                borderColor: colors.border,
              }}
            >
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="grid items-center gap-6 py-8 sm:grid-cols-[3fr_1fr_1fr]"
                  style={{
                    borderColor: colors.border,
                  }}
                >

                  {/* PRODUCT INFO */}
                  <div className="flex items-center gap-6">
                    <div
                      className="flex h-24 w-[4.8rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.soft,
                      }}
                    >
                      <span
                        style={{ color: colors.terracotta }}
                      >
                        ✦
                      </span>
                    </div>

                    <div>
                      <h3
                        className="font-semibold"
                        style={{ color: colors.charcoal }}
                      >
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="transition-colors hover:opacity-70"
                        >
                          {item.product.name}
                        </Link>
                      </h3>

                      <p
                        className="mt-1 text-sm"
                        style={{ color: colors.muted }}
                      >
                        ₹{item.product.price.toLocaleString("en-IN")}
                      </p>

                      {!item.product.availability ||
                      item.product.stock <= 0 ? (
                        <p className="mt-1 text-xs text-red-500">
                          Out of Stock
                        </p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        disabled={updatingId === item.id}
                        className="mt-3 text-sm transition-colors hover:underline disabled:opacity-50"
                        style={{ color: colors.terracotta }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* QUANTITY */}
                  <div className="flex justify-center">
                    <div
                      className="flex w-fit items-center rounded-lg border bg-white"
                      style={{
                        borderColor: colors.border,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.id,
                            item.quantity - 1
                          )
                        }
                        disabled={
                          item.quantity <= 1 ||
                          updatingId === item.id ||
                          !item.product.availability ||
                          item.product.stock <= 0
                        }
                        className="flex h-9 w-9 items-center justify-center transition-colors hover:opacity-70 disabled:opacity-50"
                        style={{ color: colors.muted }}
                      >
                        −
                      </button>

                      <span
                        className="w-10 text-center text-sm"
                        style={{ color: colors.charcoal }}
                      >
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.id,
                            item.quantity + 1
                          )
                        }
                        disabled={
                          updatingId === item.id ||
                          !item.product.availability ||
                          item.product.stock <= 0 ||
                          item.quantity >= item.product.stock
                        }
                        className="flex h-9 w-9 items-center justify-center transition-colors hover:opacity-70 disabled:opacity-50"
                        style={{ color: colors.muted }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* SUBTOTAL */}
                  <div
                    className="text-right font-semibold"
                    style={{ color: colors.charcoal }}
                  >
                    ₹{Number(item.subtotal).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ORDER SUMMARY */}
          <div
            className="h-fit rounded-2xl border p-6 sm:p-8"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.white,
            }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: colors.charcoal }}
            >
              Order Summary
            </h2>

            <div
              className="mt-6 flex items-center justify-between border-b pb-6"
              style={{
                borderColor: colors.border,
              }}
            >
              <span style={{ color: colors.muted }}>
                Subtotal
              </span>

              <span
                className="font-semibold"
                style={{ color: colors.charcoal }}
              >
                ₹{Number(cart.subtotal).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span
                className="font-semibold"
                style={{ color: colors.charcoal }}
              >
                Total
              </span>

              <span
                className="text-xl font-bold"
                style={{ color: colors.terracotta }}
              >
                ₹{Number(cart.subtotal).toLocaleString("en-IN")}
              </span>
            </div>

            <p
              className="mt-2 text-right text-xs"
              style={{ color: colors.muted }}
            >
              Shipping & taxes calculated at checkout
            </p>

            <Link
              href="/checkout"
              className="mt-8 flex w-full justify-center rounded-lg py-4 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                backgroundColor: colors.forest,
              }}
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}