"use client";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  return (
    <div className="mt-10 flex items-center justify-between border-t border-[#eee5d2] pt-6">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded-lg border border-[#dfd2bb] bg-white px-4 py-2.5 text-sm text-[#5f584f] hover:border-[#d1a11c] disabled:opacity-50 disabled:hover:border-[#dfd2bb]"
      >
        Previous
      </button>

      <span className="text-sm text-[#686159]">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded-lg border border-[#dfd2bb] bg-white px-4 py-2.5 text-sm text-[#5f584f] hover:border-[#d1a11c] disabled:opacity-50 disabled:hover:border-[#dfd2bb]"
      >
        Next
      </button>
    </div>
  );
}
