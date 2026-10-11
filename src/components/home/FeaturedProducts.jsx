"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/api";
import ProductGrid from "@/components/shop/ProductGrid";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeaturedProducts() {
      try {
        const data = await getProducts(
          { page: 1, limit: 4 },
          controller.signal
        );
        setProducts(Array.isArray(data?.items) ? data.items : []);
      } catch (error) {
        if (error.name !== "AbortError") setUnavailable(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadFeaturedProducts();
    return () => controller.abort();
  }, []);

  if (loading) {
    return <p className="py-8 text-center text-sm text-[#756d63]">Loading products…</p>;
  }

  if (unavailable) {
    return (
      <p className="py-8 text-center text-sm text-[#756d63]">
        Products are unavailable right now. Please visit the shop again shortly.
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[#756d63]">
        There are no products to feature yet.
      </p>
    );
  }

  return (
    <>
      <ProductGrid products={products.slice(0, 4)} />
      <div className="mt-8 text-center sm:hidden">
        <Link href="/shop" className="text-sm font-medium text-[#b27d0d]">
          View all products →
        </Link>
      </div>
    </>
  );
}
