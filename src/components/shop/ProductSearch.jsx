"use client";

export default function ProductSearch({ value, onChange }) {
  return (
    <div className="relative w-full max-w-sm">
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder="Search products..."
        className="w-full rounded-lg border border-[#dfd2bb] bg-white px-4 py-2.5 pl-10 text-sm text-[#29251f] placeholder:text-[#a48d69] focus:border-[#d1a11c] focus:outline-none focus:ring-1 focus:ring-[#d1a11c]"
      />

      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a48d69]">
        🔍
      </span>
    </div>
  );
}
