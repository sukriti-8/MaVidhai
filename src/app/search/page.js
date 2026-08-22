import Link from "next/link";
import { products } from "@/data/product";

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = (params?.q || "").trim();

  const results = query
    ? products.filter((product) => {
        const searchText = `${product.name} ${product.category}`.toLowerCase();

        return searchText.includes(query.toLowerCase());
      })
    : [];

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-12">
      <div className="mx-auto max-w-7xl">

        {/* Heading */}
        <div className="mb-10">
          <p className="text-xs font-medium uppercase tracking-[3px] text-[#c99716]">
            Search
          </p>

          <h1 className="mt-2 text-4xl font-semibold text-[#29251f]">
            {query ? `Results for "${query}"` : "Find what you're looking for"}
          </h1>

          {query && (
            <p className="mt-3 text-sm text-[#756d63]">
              {results.length}{" "}
              {results.length === 1 ? "product" : "products"} found
            </p>
          )}
        </div>

        {/* No search query */}
        {!query && (
          <div className="rounded-2xl border border-[#eadfca] bg-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#d1a11c] text-2xl text-[#c99716]">
              ✦
            </div>

            <h2 className="text-xl font-semibold text-[#3b342b]">
              Search MaVidhai
            </h2>

            <p className="mt-2 text-sm text-[#81786d]">
              Try searching for lamps, clothing, decor, gifting and more.
            </p>
          </div>
        )}

        {/* No results */}
        {query && results.length === 0 && (
          <div className="rounded-2xl border border-[#eadfca] bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-[#3b342b]">
              No products found
            </h2>

            <p className="mt-2 text-sm text-[#81786d]">
              We couldn't find anything matching "{query}".
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-block rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#B8860B]"
            >
              Browse All Products
            </Link>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group overflow-hidden rounded-xl border border-[#eadfca] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#d5ae50] hover:shadow-lg"
              >
                {/* Image placeholder */}
                <div className="flex aspect-square items-center justify-center bg-[#f1e8d7]">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-[#d1a11c] text-xl text-[#c99716] transition-transform duration-300 group-hover:scale-110">
                      ✦
                    </div>

                    <p className="text-[10px] uppercase tracking-[1.5px] text-[#9b8a70]">
                      Product Image
                    </p>
                  </div>
                </div>

                {/* Product info */}
                <div className="p-4">
                  {product.badge && (
                    <span className="inline-block rounded-full bg-[#f8f2e6] px-2.5 py-1 text-[10px] font-medium text-[#a9780d]">
                      {product.badge}
                    </span>
                  )}

                  <p className="mt-2 text-xs text-[#9b8a70]">
                    {product.category}
                  </p>

                  <h2 className="mt-1 text-sm font-semibold text-[#3b342b]">
                    {product.name}
                  </h2>

                  <p className="mt-3 text-base font-semibold text-[#b27d0d]">
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>

                  <p className="mt-1 text-xs text-[#81786d]">
                    ★ {product.rating} ({product.reviews} reviews)
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}