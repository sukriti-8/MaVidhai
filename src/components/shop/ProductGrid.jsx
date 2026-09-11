"use client";

import ShopProductCard from "@/components/shop/ShopProductCard";

export default function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ShopProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}
