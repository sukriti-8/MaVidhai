"use client";

const categories = [
  "All",
  "Living",
  "Kitchen",
  "Decor",
  "Personal Care",
  "Gifting",
  "Clothing",
];

export default function ProductFilters({
  filters,
  onCategoryChange,
  onPriceChange,
  onAvailabilityChange,
}) {
  const isPriceSelected = (min, max) =>
    filters.minPrice === min && filters.maxPrice === max;

  return (
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
                onClick={() => onCategoryChange(categoryName)}
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

        {/* PRICE */}
        <h3 className="text-sm font-semibold text-[#29251f]">
          Price
        </h3>

        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 text-sm text-[#686159]">
            <input
              type="radio"
              name="price"
              checked={isPriceSelected("", "")}
              onChange={() => onPriceChange("", "")}
              className="h-4 w-4 accent-[#d1a11c]"
            />
            All Prices
          </label>

          <label className="flex items-center gap-3 text-sm text-[#686159]">
            <input
              type="radio"
              name="price"
              checked={isPriceSelected(0, 1000)}
              onChange={() => onPriceChange(0, 1000)}
              className="h-4 w-4 accent-[#d1a11c]"
            />
            Under ₹1,000
          </label>

          <label className="flex items-center gap-3 text-sm text-[#686159]">
            <input
              type="radio"
              name="price"
              checked={isPriceSelected(1000, 2000)}
              onChange={() => onPriceChange(1000, 2000)}
              className="h-4 w-4 accent-[#d1a11c]"
            />
            ₹1,000 – ₹2,000
          </label>

          <label className="flex items-center gap-3 text-sm text-[#686159]">
            <input
              type="radio"
              name="price"
              checked={isPriceSelected(2000, "")}
              onChange={() => onPriceChange(2000, "")}
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
            checked={filters.available}
            onChange={(e) => onAvailabilityChange(e.target.checked)}
            className="h-4 w-4 accent-[#d1a11c]"
          />
          In Stock
        </label>
      </div>
    </aside>
  );
}
