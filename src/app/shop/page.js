"use client";

import Link from "next/link";
import { products } from "@/data/product";

const products = [
  {
    id: 1,
    name: "Pink Floral Saree",
    category: "Sarees",
    price: 1499,
    rating: 4.8,
    reviews: 42,
    badge: "Featured",
    image: "/sarees/saree-1.png",
  },
  {
    id: 2,
    name: "White Floral Saree",
    category: "Sarees",
    price: 1599,
    rating: 4.7,
    reviews: 28,
    badge: "New",
    image: "/sarees/saree-2.png",
  },
];

const categories = ["All", "Sarees"];

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-[#fffdf8]">

      {/* SHOP HEADER */}
      <section className="border-b border-[#eee5d2] bg-white px-6 py-12 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-xs font-medium uppercase tracking-[3px] text-[#c99716]">
            Discover
          </p>

          <h1 className="mt-3 text-4xl font-semibold text-[#29251f] sm:text-5xl">
            Shop
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#756d63]">
            Explore thoughtfully crafted sarees and products for everyday
            life, gifting and special occasions.
          </p>
        </div>
      </section>

      {/* SHOP CONTENT */}
      <section className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row">

          {/* FILTER SIDEBAR */}
          <aside className="w-full shrink-0 lg:w-56">
            <div className="rounded-2xl border border-[#eadfca] bg-white p-5">

              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#29251f]">
                  Categories
                </h2>

                <span className="text-xs text-[#a48d69]">
                  Filter
                </span>
              </div>

              <div className="mt-5 space-y-1">
                {categories.map((category, index) => (
                  <button
                    key={category}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      index === 0
                        ? "bg-[#fff6df] font-medium text-[#a9780d]"
                        : "text-[#686159] hover:bg-[#fffaf0] hover:text-[#a9780d]"
                    }`}
                  >
                    <span>{category}</span>

                    <span className="text-xs text-[#a99d8b]">
                      {index === 0 ? products.length : ""}
                    </span>
                  </button>
                ))}
              </div>

              <div className="my-6 border-t border-[#eee5d2]" />

              {/* PRICE */}
              <h3 className="text-sm font-semibold text-[#29251f]">
                Price
              </h3>

              <div className="mt-4 space-y-3">

                <label className="flex items-center gap-3 text-sm text-[#686159]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#d1a11c]"
                  />
                  Under ₹1,000
                </label>

                <label className="flex items-center gap-3 text-sm text-[#686159]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#d1a11c]"
                  />
                  ₹1,000 – ₹2,000
                </label>

                <label className="flex items-center gap-3 text-sm text-[#686159]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#d1a11c]"
                  />
                  Above ₹2,000
                </label>

              </div>

              <div className="my-6 border-t border-[#eee5d2]" />

              {/* AVAILABILITY */}
              <h3 className="text-sm font-semibold text-[#29251f]">
                Availability
              </h3>

              <label className="mt-4 flex items-center gap-3 text-sm text-[#686159]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#d1a11c]"
                />
                In Stock
              </label>

            </div>
          </aside>

          {/* PRODUCT AREA */}
          <div className="min-w-0 flex-1">

            {/* TOOLBAR */}
            <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#eee5d2] pb-5 sm:flex-row sm:items-center">

              <p className="text-sm text-[#756d63]">
                Showing{" "}
                <span className="font-medium text-[#29251f]">
                  {products.length}
                </span>{" "}
                products
              </p>

              <button
                type="button"
                className="rounded-lg border border-[#dfd2bb] bg-white px-4 py-2.5 text-sm text-[#5f584f] hover:border-[#d1a11c]"
              >
                Sort by: Featured ▾
              </button>

            </div>

            {/* PRODUCT GRID */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

              {products.map((product) => (
                <ShopProductCard
                  key={product.id}
                  product={product}
                />
              ))}

            </div>

          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ShopProductCard({ product }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#eadfca] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* IMAGE */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f1e8d7]">

        <Link href={`/products/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
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
      <Link href={`/products/${product.id}`}>
        <div className="p-5">

          <p className="text-[10px] font-medium uppercase tracking-[1.5px] text-[#b5965c]">
            {product.category}
          </p>

          <h3 className="mt-1.5 min-h-[40px] text-base font-medium leading-5 text-[#3b342b]">
            {product.name}
          </h3>

          {/* RATING */}
          <div className="mt-2 flex items-center gap-1.5">

            <span className="text-xs text-[#d1a11c]">
              ★
            </span>

            <span className="text-xs font-medium text-[#5f584f]">
              {product.rating}
            </span>

            <span className="text-[11px] text-[#a99d8b]">
              ({product.reviews})
            </span>

          </div>

          {/* PRICE */}
          <p className="mt-3 text-base font-semibold text-[#a9780d]">
            ₹{product.price.toLocaleString("en-IN")}
          </p>

        </div>
      </Link>

      {/* VIEW PRODUCT */}
      <div className="px-5 pb-5">
        <Link
          href={`/products/${product.id}`}
          className="block w-full rounded-lg border border-[#d9bf7c] py-2.5 text-center text-xs font-medium text-[#9b6d0d] transition-colors hover:bg-[#fff8e8]"
        >
          View Product
        </Link>
      </div>

    </div>
  );
}