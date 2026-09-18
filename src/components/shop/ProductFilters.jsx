"use client";

const CATEGORIES = [
  "Sarees",
  "Home & Living",
  "Toys",
];

export default function ProductFilters({
  filters,
  onCategoryChange,
  onPriceChange,
  onAvailabilityChange,
}) {
  const isCategorySelected = (category) => {
    const slug = category.toLowerCase().replace(/\s+/g, "-");
    return filters.category === slug;
  };

  const isPriceSelected = (min, max) =>
    filters.minPrice === min && filters.maxPrice === max;

  return (
    <aside className="w-full shrink-0 lg:w-[230px]">
      <div className="rounded-2xl border border-[#eadfca] bg-white p-5">

        {/* CATEGORY */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#29251f]">
              Categories
            </h3>

            <span className="text-xs text-[#b5965c]">
              Filter
            </span>
          </div>

          <div className="mt-5 space-y-1">
            <button
              type="button"
              onClick={() => onCategoryChange("All")}
              className={`w-full rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                filters.category === ""
                  ? "bg-[#fff3d8] text-[#9b6d0d]"
                  : "text-[#5f584f] hover:bg-[#fffaf0]"
              }`}
            >
              All
            </button>

            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => onCategoryChange(category)}
                className={`w-full rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                  isCategorySelected(category)
                    ? "bg-[#fff3d8] text-[#9b6d0d]"
                    : "text-[#5f584f] hover:bg-[#fffaf0]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* DIVIDER */}
        <div className="my-6 border-t border-[#eee5d2]" />

        {/* PRICE */}
        <div>
          <h3 className="text-sm font-semibold text-[#29251f]">
            Price
          </h3>

          <div className="mt-4 space-y-3">

            <button
              type="button"
              onClick={() => onPriceChange("", "")}
              className="flex items-center gap-3 text-sm text-[#5f584f]"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  isPriceSelected("", "")
                    ? "border-[#d1a11c]"
                    : "border-[#a9a29a]"
                }`}
              >
                {isPriceSelected("", "") && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d1a11c]" />
                )}
              </span>

              All Prices
            </button>

            <button
              type="button"
              onClick={() => onPriceChange("", "999")}
              className="flex items-center gap-3 text-sm text-[#5f584f]"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  isPriceSelected("", "999")
                    ? "border-[#d1a11c]"
                    : "border-[#a9a29a]"
                }`}
              >
                {isPriceSelected("", "999") && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d1a11c]" />
                )}
              </span>

              Under ₹1,000
            </button>

            <button
              type="button"
              onClick={() => onPriceChange("1000", "2000")}
              className="flex items-center gap-3 text-sm text-[#5f584f]"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  isPriceSelected("1000", "2000")
                    ? "border-[#d1a11c]"
                    : "border-[#a9a29a]"
                }`}
              >
                {isPriceSelected("1000", "2000") && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d1a11c]" />
                )}
              </span>

              ₹1,000 – ₹2,000
            </button>

            <button
              type="button"
              onClick={() => onPriceChange("2000", "")}
              className="flex items-center gap-3 text-sm text-[#5f584f]"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  isPriceSelected("2000", "")
                    ? "border-[#d1a11c]"
                    : "border-[#a9a29a]"
                }`}
              >
                {isPriceSelected("2000", "") && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d1a11c]" />
                )}
              </span>

              Above ₹2,000
            </button>

          </div>
        </div>

        {/* DIVIDER */}
        <div className="my-6 border-t border-[#eee5d2]" />

        {/* AVAILABILITY */}
        <div>
          <button
            type="button"
            onClick={() =>
              onAvailabilityChange(!filters.available)
            }
            className="flex items-center gap-3 text-sm text-[#5f584f]"
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded border ${
                filters.available
                  ? "border-[#d1a11c] bg-[#d1a11c]"
                  : "border-[#a9a29a]"
              }`}
            >
              {filters.available && (
                <span className="text-xs text-white">✓</span>
              )}
            </span>

            In stock only
          </button>
        </div>

      </div>
    </aside>
  );
}