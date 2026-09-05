import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api";

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = (params?.q || "").trim();

  let results = [];

  if (query) {
    const categories = await getCategories();

    const matchedCategory = categories.find(
      (category) =>
        category.name.toLowerCase().includes(query.toLowerCase()) ||
        category.slug.toLowerCase().includes(query.toLowerCase())
    );

    if (matchedCategory) {
      const data = await getProducts({
        category: matchedCategory.slug,
        page: 1,
        limit: 100,
      });

      results = data.items || data;
    } else {
      const data = await getProducts({
        page: 1,
        limit: 100,
      });

      const products = data.items || data;

      results = products.filter((product) => {
        const searchText = [
          product.name,
          product.slug,
          product.description,
          product.short_description,
          product.details,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchText.includes(query.toLowerCase());
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-12">
      <div className="mx-auto max-w-7xl">
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

        {results.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group overflow-hidden rounded-xl border border-[#eadfca] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#d5ae50] hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden bg-[#f1e8d7]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#81786d]">
                      Image unavailable
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h2 className="mt-1 text-sm font-semibold text-[#3b342b]">
                    {product.name}
                  </h2>

                  <p className="mt-3 text-base font-semibold text-[#b27d0d]">
                    ₹{Number(product.price).toLocaleString("en-IN")}
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