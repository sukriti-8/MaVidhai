"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { addToCart, addToWishlist } from "@/lib/api";

function ShopProductCard({ product }) {
  const router = useRouter();
  const pathname = usePathname();

  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState("");

  const [isWishlisting, setIsWishlisting] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistError, setWishlistError] = useState("");

  const reviewCount = Number(
    product.reviews ?? product.review_count ?? 0
  );

  const hasPrice =
    product.price != null &&
    Number.isFinite(Number(product.price)) &&
    Number(product.price) > 0;

  const isPurchasable =
    hasPrice &&
    product.is_active !== false &&
    product.availability !== false &&
    Number(product.stock ?? 0) > 0;

  const goToLogin = () => {
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
  };

  const handleQuickAdd = async (event) => {
    event.preventDefault();

    if (!isPurchasable || addingToCart) return;

    setAddingToCart(true);
    setAddedToCart(false);
    setCartError("");

    try {
      await addToCart(product.id, 1);
      setAddedToCart(true);

      window.dispatchEvent(new Event("cart-updated"));

      setTimeout(() => setAddedToCart(false), 3000);
    } catch (error) {
      if (error.message === "Unauthorized") {
        goToLogin();
        return;
      }

      setCartError("Unable to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (event) => {
    event.preventDefault();

    if (isWishlisting) return;

    setIsWishlisting(true);
    setWishlistError("");

    try {
      await addToWishlist(product.id);
      setIsWishlisted(true);

      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (error) {
      if (error.message === "Unauthorized") {
        goToLogin();
        return;
      }

      setWishlistError("Could not add to wishlist");
    } finally {
      setIsWishlisting(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#eadfca] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f1e8d7]">
        <Link href={`/product/${product.slug}`} className="block h-full">
          {product.image_url || product.image ? (
            <img
              src={product.image_url || product.image}
              alt={product.name || "Product"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[#d1a11c] text-xl text-[#c99716]">
                  ✦
                </div>
                <p className="text-[10px] uppercase tracking-[2px] text-[#9b8a70]">
                  Product Image
                </p>
              </div>
            </div>
          )}
        </Link>

        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-[#d1a11c] px-3 py-1 text-[10px] font-medium text-white">
            {product.badge}
          </span>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          disabled={isWishlisting}
          aria-label={`Add ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          style={{ color: isWishlisted ? "#c99716" : "#81786d" }}
        >
          {isWishlisting ? "…" : isWishlisted ? "♥" : "♡"}
        </button>

        {wishlistError && (
          <span
            role="status"
            className="absolute right-3 top-14 rounded bg-white px-2 py-1 text-xs text-red-600 shadow"
          >
            {wishlistError}
          </span>
        )}
      </div>

      <Link href={`/product/${product.slug}`}>
        <div className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-[1.5px] text-[#b5965c]">
            {product.category?.name}
          </p>

          <h3 className="mt-1.5 min-h-[40px] text-sm font-medium leading-5 text-[#3b342b]">
            {product.name}
          </h3>

          {reviewCount > 0 && product.rating != null && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-xs text-[#d1a11c]">★</span>
              <span className="text-xs font-medium text-[#5f584f]">
                {product.rating}
              </span>
              <span className="text-[11px] text-[#a99d8b]">
                ({reviewCount})
              </span>
            </div>
          )}

          <div className="mt-3 flex min-h-5 flex-wrap items-baseline gap-2">
            {hasPrice ? (
              <>
                {product.mrp != null &&
                  Number(product.mrp) > Number(product.price) && (
                    <span className="text-xs text-gray-400 line-through">
                      ₹{Number(product.mrp).toLocaleString("en-IN")}
                    </span>
                  )}

                <span className="text-sm font-semibold text-[#a9780d]">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-[#a9780d]">
                {product.badge === "Coming Soon"
                  ? "Coming Soon"
                  : "Price coming soon"}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={!isPurchasable || addingToCart}
          className="block w-full rounded-lg border border-[#d9bf7c] py-2.5 text-center text-xs font-medium text-[#9b6d0d] transition-colors hover:bg-[#fff8e8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {!isPurchasable
            ? "Coming Soon"
            : addingToCart
              ? "Adding..."
              : addedToCart
                ? "✓ Added to Cart"
                : "Quick Add"}
        </button>

        {cartError && (
          <p role="alert" className="mt-2 text-center text-xs text-red-600">
            {cartError}
          </p>
        )}
      </div>
    </div>
  );
}

export default ShopProductCard;