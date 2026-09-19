"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getWishlist,
  removeFromWishlist,
  addToCart,
  setAuthToken,
} from "@/lib/api";

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [cartAddedIds, setCartAddedIds] = useState({});

  const loadWishlist = useCallback(async () => {
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
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWishlist();
  }, [loadWishlist]);

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

      setCartAddedIds((prev) => ({
        ...prev,
        [productId]: true,
      }));

      setTimeout(() => {
        setCartAddedIds((prev) => ({
          ...prev,
          [productId]: false,
        }));
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
      <main className="min-h-screen bg-[#F8F6F2] flex items-center justify-center">
        <p className="text-[#A85838]">Loading your wishlist...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#F8F6F2] flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>

        <button
          onClick={loadWishlist}
          className="text-[#A85838] underline focus:outline-none focus:ring-2 focus:ring-[#1D1D1B]"
        >
          Try again
        </button>
      </main>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <main className="min-h-screen bg-[#F8F6F2] px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-[800px] text-center">
          <h1 className="text-4xl font-bold text-[#1D1D1B]">
            Your wishlist is empty
          </h1>

          <p className="mt-4 text-[#A85838]">
            Save products you love and come back to them later.
          </p>

          <div className="mt-8">
            <Link
              href="/shop"
              className="inline-block rounded-lg bg-[#F2C9B9] px-8 py-3.5 text-sm font-medium text-[#1D1D1B] transition-all hover:bg-[#A8B39F] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#1D1D1B]"
            >
              Explore Shop
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-6 py-10 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-3xl font-bold text-[#1D1D1B] sm:text-4xl">
          My Wishlist
        </h1>

        <p className="mt-2 text-[#A85838]">
          Products you&apos;ve saved
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-2xl border border-[#A8B39F] bg-white p-5 transition-shadow hover:shadow-md"
            >
              <Link
                href={`/product/${item.product.slug}`}
                className="group"
              >
                <div className="flex aspect-square items-center justify-center rounded-xl bg-[#A8B39F]">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#3F5144] text-[#3F5144]">
                      ✦
                    </div>

                    <p className="text-[9px] uppercase tracking-[1.5px] text-[#3F5144]">
                      Product Image
                    </p>
                  </div>
                </div>
              </Link>

              <div className="mt-4 flex-1">
                <h3 className="font-semibold text-[#1D1D1B]">
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="hover:text-[#A85838]"
                  >
                    {item.product.name}
                  </Link>
                </h3>

                <p className="mt-1 text-sm font-semibold text-[#A85838]">
                  ₹{item.product.price.toLocaleString("en-IN")}
                </p>

                {!item.product.availability && (
                  <p className="mt-1 text-xs text-red-600">
                    Currently unavailable
                  </p>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => handleAddToCart(item.product.id)}
                  disabled={
                    addingToCartId === item.product.id ||
                    !item.product.availability
                  }
                  className="flex-1 rounded-lg bg-[#F2C9B9] px-4 py-2 text-sm font-medium text-[#1D1D1B] transition-all hover:bg-[#A8B39F] hover:shadow-lg disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-[#1D1D1B]"
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#A8B39F] bg-white text-lg text-[#3F5144] transition-colors hover:bg-[#F2C9B9] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#1D1D1B]"
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