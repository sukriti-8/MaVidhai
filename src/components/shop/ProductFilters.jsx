"use client";

export default function ProductFilters({
  categories = [],
  filters,
  onCategoryChange,
  onPriceChange,
  onAvailabilityChange,
}) {
  const isCategorySelected = (slug) => filters.category === slug;

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
            <span className="text-xs text-[#b5965c]">Filter</span>
          </div>

          <div className="mt-5 space-y-1">
            <button
              type="button"
              onClick={() => onCategoryChange("")}
              className={`w-full rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                filters.category === ""
                  ? "bg-[#fff3d8] text-[#9b6d0d]"
                  : "text-[#5f584f] hover:bg-[#fffaf0]"
              }`}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.id ?? category.slug}
                type="button"
                onClick={() => onCategoryChange(category.slug)}
                aria-pressed={isCategorySelected(category.slug)}
                className={`w-full rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                  isCategorySelected(category.slug)
                    ? "bg-[#fff3d8] text-[#9b6d0d]"
                    : "text-[#5f584f] hover:bg-[#fffaf0]"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* DIVIDER */}
        <div className="my-6 border-t border-[#eee5d2]" />

        {/* PRICE */}
        <div>
          <h3 className="text-sm font-semibold text-[#29251f]">Price</h3>

          <div className="mt-4 space-y-3">
            <PriceOption
              label="All Prices"
              selected={isPriceSelected("", "")}
              onClick={() => onPriceChange("", "")}
            />

            <PriceOption
              label="Under ₹1,000"
              selected={isPriceSelected("", "999")}
              onClick={() => onPriceChange("", "999")}
            />

            <PriceOption
              label="₹1,000 – ₹2,000"
              selected={isPriceSelected("1000", "2000")}
              onClick={() => onPriceChange("1000", "2000")}
            />

            <PriceOption
              label="Above ₹2,000"
              selected={isPriceSelected("2000", "")}
              onClick={() => onPriceChange("2000", "")}
            />
          </div>
        </div>

        {/* DIVIDER */}
        <div className="my-6 border-t border-[#eee5d2]" />

        {/* AVAILABILITY */}
        <div>
          <button
            type="button"
            onClick={() => onAvailabilityChange(!filters.available)}
            aria-pressed={Boolean(filters.available)}
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

function PriceOption({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex items-center gap-3 text-sm text-[#5f584f]"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
          selected ? "border-[#d1a11c]" : "border-[#a9a29a]"
        }`}
      >
        {selected && (
          <span className="h-2.5 w-2.5 rounded-full bg-[#d1a11c]" />
        )}
      </span>

      {label}
    </button>
  );
}