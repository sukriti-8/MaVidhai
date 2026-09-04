"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getWishlist, removeFromWishlist, addToCart, setAuthToken } from "@/lib/api";

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [cartAddedIds, setCartAddedIds] = useState({});

  useEffect(() => {
    loadWishlist();
  }, []);

  async function loadWishlist() {
    try {
      setLoading(true);
      const data = await getWishlist();
      setWishlist(data);
    } catch (err) {
      if (err.message === "Unauthorized") {
        setAuthToken(null);
        router.push("/login");
      } else {
        console.error(err);
        setError("Failed to load wishlist");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleRemove = async (itemId) => {
    try {
      setUpdatingId(itemId);
      const updatedWishlist = await removeFromWishlist(itemId);
      setWishlist(updatedWishlist);
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

  const handleAddToCart = async (productId) => {
    try {
      setAddingToCartId(productId);
      await addToCart(productId, 1);
      setCartAddedIds((prev) => ({ ...prev, [productId]: true }));
      setTimeout(() => {
        setCartAddedIds((prev) => ({ ...prev, [productId]: false }));
      }, 3000);
    } catch (err) {
      if (err.message === "Unauthorized") {
        setAuthToken(null);
        router.push("/login");
      } else {
        alert("Failed to add to cart");
      }
    } finally {
      setAddingToCartId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffdf8] flex items-center justify-center">
        <p className="text-[#a48d69]">Loading your wishlist...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#fffdf8] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={loadWishlist} className="text-[#a48d69] underline">Try again</button>
      </main>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-[800px] text-center">
          <h1 className="text-4xl font-bold text-[#29251f]">Your wishlist is empty</h1>
          <p className="mt-4 text-[#756d63]">
            Save products you love and come back to them later.
          </p>
          <div className="mt-8">
            <Link
              href="/shop"
              className="inline-block rounded-lg bg-[#d1a11c] px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#bd8d0f] hover:shadow-lg"
            >
              Explore Shop
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-10 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-3xl font-bold text-[#29251f] sm:text-4xl">My Wishlist</h1>
        <p className="mt-2 text-[#756d63]">
          Products you've saved
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.items.map((item) => (
            <div key={item.id} className="flex flex-col rounded-2xl border border-[#eadfca] bg-white p-5 transition-shadow hover:shadow-md">
              <Link href={`/product/${item.product.slug}`} className="group">
                <div className="flex aspect-square items-center justify-center rounded-xl bg-[#f1e8d7]">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#d1a11c] text-[#c99716]">
                      ✦
                    </div>
                    <p className="text-[9px] uppercase tracking-[1.5px] text-[#9b8a70]">
                      Product Image
                    </p>
                  </div>
                </div>
              </Link>
              
              <div className="mt-4 flex-1">
                <h3 className="font-semibold text-[#29251f]">
                  <Link href={`/product/${item.product.slug}`} className="hover:text-[#a9780d]">
                    {item.product.name}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-[#a9780d] font-semibold">
                  ₹{item.product.price.toLocaleString("en-IN")}
                </p>
                {!item.product.availability && (
                  <p className="mt-1 text-xs text-red-500">
                    Currently unavailable
                  </p>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => handleAddToCart(item.product.id)}
                  disabled={addingToCartId === item.product.id || !item.product.availability}
                  className="flex-1 rounded-lg bg-[#d1a11c] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#bd8d0f] hover:shadow-lg disabled:opacity-75"
                >
                  {addingToCartId === item.product.id
                    ? "Adding..."
                    : cartAddedIds[item.product.id]
                    ? "Added ✓"
                    : "Add to Cart"}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={updatingId === item.id}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d9bf7c] bg-white text-lg text-[#c99716] transition-colors hover:bg-[#f1e8d7] disabled:opacity-50"
                  aria-label="Remove from wishlist"
                >
                  ♥
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
