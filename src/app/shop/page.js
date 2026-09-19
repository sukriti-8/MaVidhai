"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getProducts } from "@/lib/api";

import ProductSearch from "@/components/shop/ProductSearch";
import ProductFilters from "@/components/shop/ProductFilters";
import ProductGrid from "@/components/shop/ProductGrid";
import Pagination from "@/components/shop/Pagination";

function ShopContent() {
  /*** State ***/
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Initialise the category filter from the URL (origin/main behaviour)
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams?.get("category") || "";

  const [filters, setFilters] = useState({
    search: "",
    category: categoryFromUrl,
    minPrice: "",
    maxPrice: "",
    available: false,
  });

  // Search input + debounce (HEAD behaviour)
  const [searchInput, setSearchInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =========================================================
  // LOAD PRODUCTS FROM BACKEND
  // =========================================================

  // Debounce search input (HEAD)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        if (prev.search === searchInput) return prev;
        return { ...prev, search: searchInput };
      });
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch products whenever filters or page changes
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
  }, [filters, pagination.page, pagination.limit]);

  // =========================================================
  // FILTER HANDLERS
  // =========================================================

  const handleCategoryChange = (categoryName) => {
    const categorySlugs = {
      All: "",
      Sarees: "sarees",
      "Home & Living": "home-and-living",
      Toys: "toys",
    };

    const slug = categorySlugs[categoryName] ?? "";

    setFilters((prev) => ({
      ...prev,
      category: slug,
    }));

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

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

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const isPriceSelected = (min, max) =>
    filters.minPrice === min && filters.maxPrice === max;

  const clearFilters = () => {
    setFilters({
      search: "",
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
    <main className="min-h-screen bg-[#F8F6F2]">
      {/* SHOP HEADER */}
      <section className="border-b border-[#E8E4DD] bg-[#F8F6F2] px-6 py-12 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-xs font-medium uppercase tracking-[3px] text-[#A85838]">
            Discover
          </p>

          <h1 className="mt-3 text-4xl font-semibold text-[#1D1D1B] sm:text-5xl">
            Shop
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#1D1D1B]">
            Explore thoughtfully crafted products for your home, everyday life,
            gifting and more.
          </p>
        </div>
      </section>

      {/* SHOP CONTENT */}
      <section className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* FILTER SIDEBAR */}
          <ProductFilters
            filters={filters}
            onCategoryChange={handleCategoryChange}
            onPriceChange={handlePriceChange}
            onAvailabilityChange={handleAvailabilityChange}
          />

          {/* PRODUCT AREA */}
          <div className="min-w-0 flex-1">
            {/* TOOLBAR */}
            <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#E8E4DD] pb-5 sm:flex-row sm:items-center">
              <ProductSearch
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <p className="hidden text-sm text-[#1D1D1B] sm:block">
                  Showing{" "}
                  <span className="font-medium text-[#1D1D1B]">
                    {pagination.total}
                  </span>{" "}
                  products
                </p>

                <button
                  type="button"
                  className="rounded-lg border border-[#D8D4CC] bg-white px-4 py-2.5 text-sm text-[#1D1D1B] transition-colors hover:border-[#A85838]"
                >
                  Sort by: Featured ▾
                </button>
              </div>
            </div>

            {/* PRODUCT GRID */}
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-[#3F5144]">
                  Loading products...
                </p>
              </div>
            ) : error ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4">
                <p className="text-red-600">{error}</p>

                <button
                  onClick={() => window.location.reload()}
                  className="text-[#A85838] underline"
                >
                  Try again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <p className="mb-2 font-medium text-[#1D1D1B]">
                  No products found.
                </p>

                <p className="text-sm text-[#1D1D1B]">
                  Try a different search or adjust your filters.
                </p>

                <button
                  onClick={() => {
                    setSearchInput("");
                    clearFilters();
                  }}
                  className="mt-4 text-sm text-[#A85838] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <ProductGrid products={products} />
            )}

            {/* PAGINATION */}
            {!loading && !error && pagination.pages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopContent />
    </Suspense>
  );
}