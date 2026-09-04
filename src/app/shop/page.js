"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/api";

const categories = [
  "All",
  "Living",
  "Kitchen",
  "Decor",
  "Personal Care",
  "Gifting",
  "Clothing",
];

export default function ShopPage() {
  const [products, setProducts] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    available: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =========================================================
  // LOAD PRODUCTS FROM BACKEND
  // =========================================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const data = await getProducts(
          {
            ...filters,
            page: pagination.page,
            limit: pagination.limit,
          },
          controller.signal
        );

        setProducts(data.items);

        setPagination((prev) => ({
          ...prev,
          page: data.page,
          limit: data.limit,
          total: data.total,
          pages: data.pages,
        }));
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to load products:", err);
          setError("Unable to load products. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [filters, pagination.page]);

  // =========================================================
  // CATEGORY FILTER
  // =========================================================

  const handleCategoryChange = (categoryName) => {
    const slug =
      categoryName === "All"
        ? ""
        : categoryName.toLowerCase().replace(" ", "-");

    setFilters((prev) => ({
      ...prev,
      category: slug,
    }));

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  // =========================================================
  // PRICE FILTER
  // =========================================================

  const handlePriceChange = (min, max) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: min,
      maxPrice: max,
    }));

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  // =========================================================
  // AVAILABILITY FILTER
  // =========================================================

  const handleAvailabilityChange = (checked) => {
    setFilters((prev) => ({
      ...prev,
      available: checked,
    }));

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  // =========================================================
  // PAGINATION
  // =========================================================

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // =========================================================
  // PRICE RADIO STATE
  // =========================================================

  const isPriceSelected = (min, max) =>
    filters.minPrice === min && filters.maxPrice === max;

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      available: false,
    });

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  return (
    <main className="min-h-screen bg-[#fffdf8]">

      {/* =====================================================
          SHOP HEADER
      ====================================================== */}

      <section className="border-b border-[#eee5d2] bg-white px-6 py-12 lg:px-10">
        <div className="mx-auto max-w-[1400px]">

          <p className="text-xs font-medium uppercase tracking-[3px] text-[#c99716]">
            Discover
          </p>

          <h1 className="mt-3 text-4xl font-semibold text-[#29251f] sm:text-5xl">
            Shop
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#756d63]">
            Explore thoughtfully crafted products for your home, everyday
            life, gifting and more.
          </p>

        </div>
      </section>

      {/* =====================================================
          SHOP CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">

        <div className="flex flex-col gap-8 lg:flex-row">

          {/* =================================================
              FILTER SIDEBAR
          ================================================== */}

          <aside className="w-full shrink-0 lg:w-56">

            <div className="rounded-2xl border border-[#eadfca] bg-white p-5">

              {/* CATEGORY HEADER */}

              <div className="flex items-center justify-between">

                <h2 className="text-sm font-semibold text-[#29251f]">
                  Categories
                </h2>

                <span className="text-xs text-[#a48d69]">
                  Filter
                </span>

              </div>

              {/* CATEGORY OPTIONS */}

              <div className="mt-5 space-y-1">

                {categories.map((categoryName) => {

                  const slug =
                    categoryName === "All"
                      ? ""
                      : categoryName.toLowerCase().replace(" ", "-");

                  const isActive = filters.category === slug;

                  return (
                    <button
                      key={categoryName}
                      type="button"
                      onClick={() => handleCategoryChange(categoryName)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-[#fff6df] font-medium text-[#a9780d]"
                          : "text-[#686159] hover:bg-[#fffaf0] hover:text-[#a9780d]"
                      }`}
                    >
                      <span>{categoryName}</span>
                    </button>
                  );
                })}

              </div>

              <div className="my-6 border-t border-[#eee5d2]" />

              {/* =================================================
                  PRICE FILTER
              ================================================== */}

              <h3 className="text-sm font-semibold text-[#29251f]">
                Price
              </h3>

              <div className="mt-4 space-y-3">

                {/* ALL PRICES */}

                <label className="flex items-center gap-3 text-sm text-[#686159]">

                  <input
                    type="radio"
                    name="price"
                    checked={isPriceSelected("", "")}
                    onChange={() => handlePriceChange("", "")}
                    className="h-4 w-4 accent-[#d1a11c]"
                  />

                  All Prices

                </label>

                {/* UNDER 1000 */}

                <label className="flex items-center gap-3 text-sm text-[#686159]">

                  <input
                    type="radio"
                    name="price"
                    checked={isPriceSelected(0, 1000)}
                    onChange={() => handlePriceChange(0, 1000)}
                    className="h-4 w-4 accent-[#d1a11c]"
                  />

                  Under ₹1,000

                </label>

                {/* 1000 - 2000 */}

                <label className="flex items-center gap-3 text-sm text-[#686159]">

                  <input
                    type="radio"
                    name="price"
                    checked={isPriceSelected(1000, 2000)}
                    onChange={() => handlePriceChange(1000, 2000)}
                    className="h-4 w-4 accent-[#d1a11c]"
                  />

                  ₹1,000 – ₹2,000

                </label>

                {/* ABOVE 2000 */}

                <label className="flex items-center gap-3 text-sm text-[#686159]">

                  <input
                    type="radio"
                    name="price"
                    checked={isPriceSelected(2000, "")}
                    onChange={() => handlePriceChange(2000, "")}
                    className="h-4 w-4 accent-[#d1a11c]"
                  />

                  Above ₹2,000

                </label>

              </div>

              <div className="my-6 border-t border-[#eee5d2]" />

              {/* =================================================
                  AVAILABILITY FILTER
              ================================================== */}

              <h3 className="text-sm font-semibold text-[#29251f]">
                Availability
              </h3>

              <label className="mt-4 flex items-center gap-3 text-sm text-[#686159]">

                <input
                  type="checkbox"
                  checked={filters.available}
                  onChange={(event) =>
                    handleAvailabilityChange(event.target.checked)
                  }
                  className="h-4 w-4 accent-[#d1a11c]"
                />

                In Stock

              </label>

              {/* CLEAR FILTERS */}

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 text-xs text-[#a9780d] hover:underline"
              >
                Clear all filters
              </button>

            </div>
          </aside>

          {/* =================================================
              PRODUCT AREA
          ================================================== */}

          <div className="min-w-0 flex-1">

            {/* TOOLBAR */}

            <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#eee5d2] pb-5 sm:flex-row sm:items-center">

              <p className="text-sm text-[#756d63]">

                Showing{" "}

                <span className="font-medium text-[#29251f]">
                  {pagination.total}
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

            {/* =================================================
                PRODUCT GRID
            ================================================== */}

            {loading ? (

              <div className="flex h-64 items-center justify-center">
                <p className="text-[#a48d69]">
                  Loading products...
                </p>
              </div>

            ) : error ? (

              <div className="flex h-64 flex-col items-center justify-center gap-4">

                <p className="text-red-500">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="text-[#a48d69] underline"
                >
                  Try again
                </button>

              </div>

            ) : products.length === 0 ? (

              <div className="flex h-64 flex-col items-center justify-center text-center">

                <p className="mb-2 font-medium text-[#29251f]">
                  No products found.
                </p>

                <p className="text-sm text-[#756d63]">
                  Try adjusting your filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-sm text-[#a9780d] hover:underline"
                >
                  Clear all filters
                </button>

              </div>

            ) : (

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">

                {products.map((product) => (
                  <ShopProductCard
                    key={product.id}
                    product={product}
                  />
                ))}

              </div>

            )}

            {/* =================================================
                PAGINATION
            ================================================== */}

            {!loading &&
              !error &&
              pagination.pages > 1 && (

                <div className="mt-10 flex items-center justify-between border-t border-[#eee5d2] pt-6">

                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      handlePageChange(pagination.page - 1)
                    }
                    className="rounded-lg border border-[#dfd2bb] bg-white px-4 py-2.5 text-sm text-[#5f584f] hover:border-[#d1a11c] disabled:opacity-50 disabled:hover:border-[#dfd2bb]"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-[#686159]">
                    Page {pagination.page} of {pagination.pages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      pagination.page >= pagination.pages
                    }
                    onClick={() =>
                      handlePageChange(pagination.page + 1)
                    }
                    className="rounded-lg border border-[#dfd2bb] bg-white px-4 py-2.5 text-sm text-[#5f584f] hover:border-[#d1a11c] disabled:opacity-50 disabled:hover:border-[#dfd2bb]"
                  >
                    Next
                  </button>

                </div>
              )}

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

      {/* =====================================================
          IMAGE
      ====================================================== */}

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

      {/* =====================================================
          PRODUCT DETAILS
      ====================================================== */}

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
            ₹{Number(product.price).toLocaleString("en-IN")}
          </p>

        </div>

      </Link>

      {/* =====================================================
          VIEW PRODUCT
      ====================================================== */}

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