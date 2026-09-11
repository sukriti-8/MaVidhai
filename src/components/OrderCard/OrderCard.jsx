import Link from "next/link";
import OrderStatus from "@/components/OrderStatus/OrderStatus";

const paymentStatusConfig = {
  created:  { label: "Payment: Processing", style: "text-[#a9780d]" },
  pending:  { label: "Payment: Pending",  style: "text-[#a9780d]" },
  captured: { label: "Payment: Captured", style: "text-[#2d7a4f]" },
  failed:   { label: "Payment: Failed",   style: "text-[#b91c1c]" },
  refunded: { label: "Payment: Refunded", style: "text-[#1a6fa8]" },
};

export default function OrderCard({ order }) {
  const date = new Date(order.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const paymentConfig =
    paymentStatusConfig[order.payment_status] ??
    { label: `Payment: ${order.payment_status ?? "—"}`, style: "text-[#756d63]" };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-xl border border-[#eadfca] p-6 shadow-sm mb-4">
      <div className="flex flex-col gap-2 mb-4 sm:mb-0">
        <div className="text-sm font-medium text-[#756d63]">{order.order_number}</div>
        <div className="text-lg font-bold text-[#29251f]">₹{Number(order.total_amount).toLocaleString("en-IN")}</div>
        <div className="text-sm text-[#756d63]">{date} • {order.items_count ?? 0} items</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <OrderStatus status={order.status} />
          <span className={`text-xs font-medium ${paymentConfig.style}`}>
            {paymentConfig.label}
          </span>
        </div>
      </div>
      <div className="sm:text-right flex items-center sm:block">
        <Link
          href={`/orders/${order.order_number}`}
          className="text-[#d1a11c] font-medium hover:text-[#bd8d0f] transition-colors"
        >
          View Order &rarr;
        </Link>
      </div>
    </div>
  );
}
