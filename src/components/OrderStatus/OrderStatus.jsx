export default function OrderStatus({ status }) {
  const statusMap = {
    pending: "Payment processing",
    confirmed: "Confirmed",
    processing: "Preparing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  const label = statusMap[status] || status;

  return (
    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-[#f5f1e8] text-[#a9780d]">
      {label}
    </span>
  );
}
