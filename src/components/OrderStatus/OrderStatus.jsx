export default function OrderStatus({ status }) {
  const statusConfig = {
    pending:            { label: "Payment processing",               style: "bg-[#fef9ec] text-[#a9780d]" },
    confirmed:          { label: "Confirmed",                         style: "bg-[#edf7f0] text-[#2d7a4f]" },
    inventory_conflict: { label: "Payment received — confirming stock", style: "bg-[#fff4e5] text-[#b45309]" },
    processing:         { label: "Preparing",                         style: "bg-[#edf7f0] text-[#2d7a4f]" },
    shipped:            { label: "Shipped",                           style: "bg-[#e8f4fd] text-[#1a6fa8]" },
    delivered:          { label: "Delivered",                         style: "bg-[#edf7f0] text-[#2d7a4f]" },
    cancelled:          { label: "Cancelled",                         style: "bg-[#fdf2f2] text-[#b91c1c]" },
  };

  // Safe fallback: show the raw value in neutral colours for any unknown future status
  const config = statusConfig[status] ?? { label: status, style: "bg-[#f5f1e8] text-[#756d63]" };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.style}`}>
      {config.label}
    </span>
  );
}
