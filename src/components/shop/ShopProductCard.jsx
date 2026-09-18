"use client";

import { useState } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/api";

function ShopProductCard({ product }) {
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState("");

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (addingToCart) return;

    setAddingToCart(true);
    setAddedToCart(false);
    setCartError("");

    try {
      await addToCart(product.id, 1);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (error) {
      if (error.message === "Unauthorized") {
        window.location.href = "/login";
        return;
      }

      setCartError("Unable to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#eadfca] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* IMAGE */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f1e8d7]">

        <Link href={`/product/${product.slug}`}>
          {product.image_url || product.image ? (
            <img
              src={product.image_url || product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[#d1a11c] text-xl text-[#c99716] transition-transform duration-300 group-hover:scale-110">
                  ✦
                </div>

                <p className="text-[10px] uppercase tracking-[2px] text-[#9b8a70]">
                  Product Image
                </p>
              </div>
            </div>
          )}
        </Link>

        {/* BADGE */}
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-[#d1a11c] px-3 py-1 text-[10px] font-medium text-white">
            {product.badge}
          </span>
        )}

        {/* WISHLIST */}
        <button
          type="button"
          aria-label={`Add ${product.name} to wishlist`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg text-[#81786d] shadow-sm transition-all hover:text-[#c99716] hover:shadow-md"
        >
          ♡
        </button>

      </div>

      {/* DETAILS */}
      <Link href={`/product/${product.slug}`}>
        <div className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-[1.5px] text-[#b5965c]">
            {product.category?.name}
          </p>

          <h3 className="mt-1.5 min-h-[40px] text-sm font-medium leading-5 text-[#3b342b]">
            {product.name}
          </h3>

          {/* RATING */}
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs text-[#d1a11c]">★</span>
            <span className="text-xs font-medium text-[#5f584f]">
              {product.rating}
            </span>
            <span className="text-[11px] text-[#a99d8b]">
              ({product.reviews})
            </span>
          </div>

          <p className="mt-3 text-sm font-semibold text-[#a9780d]">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
        </div>
      </Link>

      {/* QUICK ADD */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={addingToCart}
          className="block w-full rounded-lg border border-[#d9bf7c] py-2.5 text-center text-xs font-medium text-[#9b6d0d] transition-colors hover:bg-[#fff8e8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {addingToCart
            ? "Adding..."
            : addedToCart
              ? "✓ Added to Cart"
              : "Quick Add"}
        </button>

        {cartError && (
          <p className="mt-2 text-center text-xs text-red-600">
            {cartError}
          </p>
        )}
      </div>

    </div>
  );
}

export default ShopProductCard;
