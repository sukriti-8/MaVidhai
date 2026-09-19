"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { addToCart, addToWishlist } from "@/lib/api";
import theme from "@/styles/theme";

export default function ProductCard({ product }) {
  const router = useRouter();
  const pathname = usePathname();

  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState("");

  const [isWishlisting, setIsWishlisting] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const goToLogin = () => {
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
  };

  const handleAddToCart = async () => {
    if (addingToCart) return;

    setAddingToCart(true);
    setCartError("");

    try {
      await addToCart(product.id, 1);
      setAddedToCart(true);
      window.dispatchEvent(new Event("cart-updated"));
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (err) {
      if (err.message === "Unauthorized") {
        goToLogin();
        return;
      }
      setCartError("Unable to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    if (isWishlisting) return;

    setIsWishlisting(true);

    try {
      await addToWishlist(product.id);
      setIsWishlisted(true);
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (err) {
      if (err.message === "Unauthorized") {
        goToLogin();
        return;
      }
      // Card has no room for an inline error here; fail quietly.
    } finally {
      setIsWishlisting(false);
    }
  };

  return (
    <div
      className="group overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ borderColor: theme.colors.sage }}
    >
      <div className="relative">
        <Link href={`/product/${product.slug}`} className="block">
          {/* IMAGE */}
          <div
            className="flex aspect-square items-center justify-center overflow-hidden"
            style={{ backgroundColor: theme.colors.sage }}
          >
            {product.image_url || product.image ? (
              <img
                src={product.image_url || product.image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="text-center">
                <div
                  className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full border text-xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    borderColor: theme.colors.charcoal,
                    color: theme.colors.charcoal,
                  }}
                >
                  ✦
                </div>

                <p
                  className="text-[10px] uppercase tracking-[1.5px]"
                  style={{ color: theme.colors.charcoal }}
                >
                  Product Image
                </p>
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div className="p-4">
            <h3
              className="text-sm font-medium"
              style={{ color: theme.colors.charcoal }}
            >
              {product.name}
            </h3>

            <p
              className="mt-2 text-sm font-semibold"
              style={{ color: theme.colors.terracotta }}
            >
              ₹{Number(product.price || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </Link>

        {/* WISHLIST */}
        <button
          type="button"
          onClick={handleWishlist}
          disabled={isWishlisting}
          aria-label={`Add ${product.name} to wishlist`}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: theme.colors.white,
            color: isWishlisted ? theme.colors.terracotta : theme.colors.charcoal,
          }}
        >
          {isWishlisted ? "♥" : "♡"}
        </button>
      </div>

      {/* ADD TO CART */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={addingToCart}
          className="w-full rounded-lg border py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            borderColor: theme.colors.charcoal,
            color: theme.colors.charcoal,
          }}
        >
          {addingToCart
            ? "Adding..."
            : addedToCart
              ? "✓ Added to Cart"
              : "Add to Cart"}
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