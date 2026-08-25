"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCart, updateCartItem, removeCartItem, setAuthToken } from "@/lib/api";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
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
  }

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
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
      <main className="min-h-screen bg-[#fffdf8] flex items-center justify-center">
        <p className="text-[#a48d69]">Loading your cart...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#fffdf8] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={loadCart} className="text-[#a48d69] underline">Try again</button>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-[800px] text-center">
          <h1 className="text-4xl font-bold text-[#29251f]">Your cart is empty</h1>
          <p className="mt-4 text-[#756d63]">
            Discover handcrafted products you'll love.
          </p>
          <div className="mt-8">
            <Link
              href="/shop"
              className="inline-block rounded-lg bg-[#d1a11c] px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#bd8d0f] hover:shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-10 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-3xl font-bold text-[#29251f] sm:text-4xl">Cart</h1>
        <p className="mt-2 text-[#756d63]">
          Your selected handcrafted products
        </p>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_350px]">
          
          {/* CART ITEMS */}
          <div>
            <div className="hidden grid-cols-[3fr_1fr_1fr] border-b border-[#eee5d2] pb-4 text-xs font-medium uppercase tracking-[2px] text-[#91887c] sm:grid">
              <div>Product</div>
              <div className="text-center">Quantity</div>
              <div className="text-right">Total</div>
            </div>

            <div className="divide-y divide-[#eee5d2]">
              {cart.items.map((item) => (
                <div key={item.id} className="grid items-center gap-6 py-8 sm:grid-cols-[3fr_1fr_1fr]">
                  
                  {/* PRODUCT INFO */}
                  <div className="flex items-center gap-6">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-[#eadfca] bg-[#f1e8d7]">
                      <span className="text-[#c99716]">✦</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#29251f]">
                        <Link href={`/product/${item.product.slug}`} className="hover:text-[#a9780d]">
                          {item.product.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-[#756d63]">
                        ₹{item.product.price.toLocaleString("en-IN")}
                      </p>
                      {!item.product.availability && (
                        <p className="mt-1 text-xs text-red-500">
                          Currently unavailable
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        disabled={updatingId === item.id}
                        className="mt-3 text-sm text-[#a9780d] hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* QUANTITY */}
                  <div className="flex justify-center">
                    <div className="flex w-fit items-center rounded-lg border border-[#dfd2bb] bg-white">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updatingId === item.id}
                        className="flex h-9 w-9 items-center justify-center text-[#756d63] hover:text-[#a9780d] disabled:opacity-50"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={updatingId === item.id}
                        className="flex h-9 w-9 items-center justify-center text-[#756d63] hover:text-[#a9780d] disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* SUBTOTAL */}
                  <div className="text-right font-semibold text-[#29251f]">
                    ₹{Number(item.subtotal).toLocaleString("en-IN")}
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* ORDER SUMMARY */}
          <div className="rounded-2xl border border-[#eadfca] bg-white p-6 sm:p-8 h-fit">
            <h2 className="text-lg font-semibold text-[#29251f]">Order Summary</h2>
            
            <div className="mt-6 flex items-center justify-between border-b border-[#eee5d2] pb-6">
              <span className="text-[#756d63]">Subtotal</span>
              <span className="font-semibold text-[#29251f]">
                ₹{Number(cart.subtotal).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="font-semibold text-[#29251f]">Total</span>
              <span className="text-xl font-bold text-[#a9780d]">
                ₹{Number(cart.subtotal).toLocaleString("en-IN")}
              </span>
            </div>
            
            <p className="mt-2 text-right text-xs text-[#91887c]">
              Shipping & taxes calculated at checkout
            </p>

            <Link
              href="/checkout"
              className="mt-8 flex w-full justify-center rounded-lg bg-[#29251f] py-4 text-sm font-medium text-white transition-all hover:bg-[#1a1714] hover:shadow-lg"
            >
              Proceed to Checkout
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
